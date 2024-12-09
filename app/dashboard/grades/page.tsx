'use client'
import { useState, useEffect } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Loader2, Plus, Pencil, Trash2, MoreVertical } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Classes, Students, Inserts } from '@/lib/types/supabase'
import type { StudentGrade, GradeItem } from '@/lib/types/supabase'
import GradeAssignmentModal from '@/components/GradeAssignmentModal'
import AddGradeItemModal from '@/components/AddGradeItemModal'

type GradeWithStudent = {
    student_id: string;
    score: number | null;
    students: {
      id: string;
      first_name: string;
      last_name: string;
    };
  }

  type GradeEntry = {
    class_id: string;
    student_id: string;
    assignment_name: string;
    score: number; // Must be a number for Supabase
    date: string;
  }

export default function GradesPage() {
    const { supabase, user } = useSupabase()
    const [classes, setClasses] = useState<Classes[]>([])
    const [selectedClass, setSelectedClass] = useState<string>('')
    const [gradeItems, setGradeItems] = useState<GradeItem[]>([])
    const [selectedGradeItem, setSelectedGradeItem] = useState<string>('')
    const [showAddGradeItem, setShowAddGradeItem] = useState(false)
    const [showAssignGrades, setShowAssignGrades] = useState(false)
    const [editingGradeItem, setEditingGradeItem] = useState<GradeItem | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deletingGradeItem, setDeletingGradeItem] = useState<GradeItem | null>(null)
    const [students, setStudents] = useState<StudentGrade[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
  
    // Fetch classes on component mount
    useEffect(() => {
      const fetchClasses = async () => {
        if (!user) return
  
        try {
          setLoading(true)
          setError(null)
  
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()
  
          if (userError) throw userError
  
          let query = supabase.from('classes').select('*')
          if (userData.role !== 'admin') {
            query = query.eq('teacher_id', user.id)
          }
  
          const { data: classesData, error: classesError } = await query.order('name')
  
          if (classesError) throw classesError
          setClasses(classesData || [])
  
          if (classesData?.length === 1) {
            setSelectedClass(classesData[0].id)
          }
        } catch (err) {
          console.error('Error fetching classes:', err)
          setError(err instanceof Error ? err.message : 'Failed to fetch classes')
        } finally {
          setLoading(false)
        }
      }
  
      fetchClasses()
    }, [user])
  
    // Fetch grade items when selected class changes
    useEffect(() => {
      const fetchGradeItems = async () => {
        if (!selectedClass) return
  
        try {
          const { data, error } = await supabase
            .from('grades')
            .select(`
              assignment_name,
              date,
              student_id
            `)
            .eq('class_id', selectedClass)
            .order('date', { ascending: false })
  
          if (error) throw error
  
          // Group items by assignment name and get the most recent date for each
          const gradeItemsMap = data.reduce((acc, item) => {
            const existingItem = acc.get(item.assignment_name)
            
            if (!existingItem || new Date(item.date) > new Date(existingItem.created_at)) {
              acc.set(item.assignment_name, {
                id: `${selectedClass}-${item.assignment_name}`,
                class_id: selectedClass,
                assignment_name: item.assignment_name,
                created_at: item.date
              })
            }
            
            return acc
          }, new Map<string, GradeItem>())
  
          setGradeItems(Array.from(gradeItemsMap.values()))
        } catch (err) {
          console.error('Error fetching grade items:', err)
          setError(err instanceof Error ? err.message : 'Failed to fetch grade items')
        }
      }
  
      fetchGradeItems()
    }, [selectedClass])
  
    const handleAddGradeItem = async (name: string) => {
        if (!selectedClass) return
      
        try {
          // First, let's log what we're working with
          console.log('Selected Class:', selectedClass)
          console.log('Assignment Name:', name)
      
          const { data: classStudents, error: studentsError } = await supabase
            .from('class_students')
            .select('student_id')
            .eq('class_id', selectedClass)
      
          if (studentsError) throw studentsError
          if (!classStudents?.length) {
            throw new Error('No students found in this class')
          }
      
          console.log('Found students:', classStudents)
      
          const currentDate = new Date().toISOString().split('T')[0]
          
          // Create properly typed grade entries
          const gradeEntries = classStudents.map(({ student_id }) => ({
            class_id: selectedClass,
            student_id,
            assignment_name: name,
            score: null,
            date: currentDate
          })) as Inserts<'grades'>[]
      
          console.log('Grade entries to insert:', gradeEntries)
      
          // Explicitly specify the columns we want to insert
          const { data: insertedGrades, error: insertError } = await supabase
            .from('grades')
            .insert(gradeEntries)
            .select()
      
          if (insertError) {
            console.error('Insert error:', insertError)
            throw insertError
          }
      
          console.log('Successfully inserted grades:', insertedGrades)
      
          // Add new grade item to state
          const newGradeItem: GradeItem = {
            id: `${selectedClass}-${name}`,
            class_id: selectedClass,
            assignment_name: name,
            created_at: currentDate
          }
      
          setGradeItems(prev => [newGradeItem, ...prev])
          setShowAddGradeItem(false)
        } catch (err) {
          console.error('Error adding grade item:', err)
          setError(err instanceof Error ? err.message : 'Failed to add grade item')
        }
      }
  
      const handleEditGradeItem = async (gradeItem: GradeItem, newName: string) => {
        if (!selectedClass || !newName.trim()) return
    
        try {
          const { error: updateError } = await supabase
            .from('grades')
            .update({ assignment_name: newName.trim() })
            .eq('class_id', selectedClass)
            .eq('assignment_name', gradeItem.assignment_name)
    
          if (updateError) throw updateError
    
          // Update local state
          setGradeItems(prev => prev.map(item => 
            item.id === gradeItem.id 
              ? { ...item, assignment_name: newName.trim() }
              : item
          ))
    
          setEditingGradeItem(null)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to update grade item')
        }
      }
    
      const handleDeleteGradeItem = async (gradeItem: GradeItem) => {
        if (!selectedClass) return
    
        try {
          const { error: deleteError } = await supabase
            .from('grades')
            .delete()
            .eq('class_id', selectedClass)
            .eq('assignment_name', gradeItem.assignment_name)
    
          if (deleteError) throw deleteError
    
          // Update local state
          setGradeItems(prev => prev.filter(item => item.id !== gradeItem.id))
          setShowDeleteConfirm(false)
          setDeletingGradeItem(null)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to delete grade item')
        }
      }
      
    const handleGradeItemSelect = async (gradeItemId: string) => {
      try {
        setSelectedGradeItem(gradeItemId)
        const selectedItem = gradeItems.find(item => item.id === gradeItemId)
        
        if (!selectedItem) return
  
        // Fetch both enrolled students and their grades
const { data: gradesData, error: gradesError } = await supabase
  .from('grades')
  .select(`
    student_id,
    score,
    students!inner (
      id,
      first_name,
      last_name
    )
  `)
  .eq('class_id', selectedClass)
  .eq('assignment_name', selectedItem.assignment_name) as { 
    data: GradeWithStudent[] | null, 
    error: any 
  };

if (gradesError) throw gradesError;
if (!gradesData) return;

const studentGrades = gradesData.map(grade => ({
  student_id: grade.student_id,
  first_name: grade.students.first_name,
  last_name: grade.students.last_name,
  score: grade.score
}));
  
        setStudents(studentGrades)
        setShowAssignGrades(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch student grades')
      }
    }
  
    const handleSaveGrades = async (grades: StudentGrade[]) => {
      if (!selectedClass || !selectedGradeItem) return
  
      try {
        const selectedItem = gradeItems.find(item => item.id === selectedGradeItem)
        if (!selectedItem) return
  
        const currentDate = new Date().toISOString().split('T')[0]
        const updates = grades.map(grade => ({
          class_id: selectedClass,
          student_id: grade.student_id,
          assignment_name: selectedItem.assignment_name,
          score: grade.score,
          date: currentDate
        }))
  
        // Delete existing grades and insert new ones
        const { error: deleteError } = await supabase
          .from('grades')
          .delete()
          .eq('class_id', selectedClass)
          .eq('assignment_name', selectedItem.assignment_name)
  
        if (deleteError) throw deleteError
  
        const { error: insertError } = await supabase
          .from('grades')
          .insert(updates)
  
        if (insertError) throw insertError
  
        setShowAssignGrades(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save grades')
      }
    }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-100">Grades</h1>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700 text-gray-100">
            <SelectValue placeholder="Select a class" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {classes.map((classItem) => (
              <SelectItem 
                key={classItem.id} 
                value={classItem.id}
                className="text-gray-100 focus:bg-gray-700"
              >
                {classItem.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="text-red-400 p-4 rounded-lg border border-red-800 bg-red-900/20">
          {error}
        </div>
      )}

{selectedClass && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium text-gray-200">
                Grade Items
              </CardTitle>
              <Button
                onClick={() => setShowAddGradeItem(true)}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              {gradeItems.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No grade items found. Add your first grade item to get started.
                </div>
              ) : (
                <div className="space-y-2">
                  {gradeItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-700 hover:bg-gray-700/50"
                    >
                      <span className="text-gray-100">{item.assignment_name}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGradeItemSelect(item.id)}
                          className="text-gray-300"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Assign Grades
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-gray-300">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-gray-800 border-gray-700">
                            <DropdownMenuItem
                              className="text-gray-100 focus:bg-gray-700 cursor-pointer"
                              onClick={() => setEditingGradeItem(item)}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit Name
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-400 focus:bg-gray-700 cursor-pointer"
                              onClick={() => {
                                setDeletingGradeItem(item)
                                setShowDeleteConfirm(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Grade Item Modal */}
      <Dialog open={!!editingGradeItem} onOpenChange={() => setEditingGradeItem(null)}>
        <DialogContent className="bg-gray-800 text-gray-100 border-gray-700">
          <DialogHeader>
            <DialogTitle>Edit Grade Item</DialogTitle>
          </DialogHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              if (editingGradeItem) {
                const formData = new FormData(e.currentTarget)
                handleEditGradeItem(editingGradeItem, formData.get('name') as string)
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Assignment Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingGradeItem?.assignment_name}
                className="bg-gray-700 border-gray-600 text-gray-100"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditingGradeItem(null)}
                className="border-gray-600 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-gray-800 text-gray-100 border-gray-700">
          <DialogHeader>
            <DialogTitle>Delete Grade Item</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete "{deletingGradeItem?.assignment_name}"? This will remove all student grades for this assignment.</p>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowDeleteConfirm(false)}
              className="border-gray-600 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingGradeItem && handleDeleteGradeItem(deletingGradeItem)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    

      {showAssignGrades && selectedGradeItem && (
        <GradeAssignmentModal
          isOpen={showAssignGrades}
          onClose={() => setShowAssignGrades(false)}
          onSave={handleSaveGrades}
          students={students}
          assignmentName={gradeItems.find(item => item.id === selectedGradeItem)?.assignment_name || ''}
        />
      )}

      {showAddGradeItem && (
        <AddGradeItemModal
          isOpen={showAddGradeItem}
          onClose={() => setShowAddGradeItem(false)}
          onAdd={handleAddGradeItem}
        />
      )}
    </div>
  )
}