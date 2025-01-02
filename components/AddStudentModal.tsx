import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSupabase } from '@/components/supabase-provider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Loader2 } from 'lucide-react'
import Papa from 'papaparse'

interface AddStudentModalProps {
  isOpen: boolean
  onClose: () => void
  onStudentAdded: () => void
  schoolId?: string
}

export function AddStudentModal({ isOpen, onClose, onStudentAdded, schoolId }: AddStudentModalProps) {
  const { supabase } = useSupabase()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [csvClass, setCsvClass] = useState<string>('')
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchClasses = async () => {
    try {
      let query = supabase
        .from('classes')
        .select('*')
        .order('name')

      if (schoolId) {
        query = query.eq('school_id', schoolId)
      }

      const { data: classesData, error: classesError } = await query

      if (classesError) throw classesError
      setClasses(classesData || [])
    } catch (err) {
      console.error('Error fetching classes:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch classes')
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchClasses()
    }
  }, [isOpen, schoolId])

  const handleSingleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setError(null)

      // Create the student
      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert({
          first_name: firstName,
          last_name: lastName || '',
          school_id: schoolId || ''
        })
        .select()
        .single()

      if (studentError) throw studentError

      // If a class is selected, enroll the student
      if (selectedClass && student) {
        const { error: enrollError } = await supabase
          .from('class_students')
          .insert({
            class_id: selectedClass,
            student_id: student.id
          })

        if (enrollError) throw enrollError
      }

      setFirstName('')
      setLastName('')
      setSelectedClass('')
      onStudentAdded()
      onClose()
    } catch (err) {
      console.error('Error adding student:', err)
      setError(err instanceof Error ? err.message : 'Failed to add student')
    } finally {
      setLoading(false)
    }
  }

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !csvClass) return
  
    try {
      setLoading(true)
      setError(null)

      const result = await new Promise<Papa.ParseResult<any>>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: 'greedy',
          complete: resolve,
          error: reject,
          transformHeader: (header) => {
            return header.toLowerCase().trim().replace(/\s+/g, '_')
          }
        })
      })

      if (result.data.length === 0) {
        throw new Error('The CSV file is empty')
      }

      // Transform the data - only include name fields
      const students = result.data
        .map(row => ({
          first_name: row.first_name?.trim(),
          last_name: row.last_name?.trim() || '',
          school_id: schoolId
        }))
        .filter(student => student.first_name) // Filter out rows without first name

      // Insert the students
      const { data: newStudents, error: insertError } = await supabase
        .from('students')
        .insert(students)
        .select()

      if (insertError) throw insertError

      // Enroll students in the selected class
      if (newStudents && newStudents.length > 0) {
        const enrollments = newStudents.map(student => ({
          class_id: csvClass,
          student_id: student.id
        }))

        const { error: enrollError } = await supabase
          .from('class_students')
          .insert(enrollments)

        if (enrollError) throw enrollError
      }

      onStudentAdded()
      onClose()
      if (e.target.files) {
        e.target.value = ''
      }
      setCsvClass('')
    } catch (err) {
      console.error('CSV Upload Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to process CSV file')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-gray-100 border-gray-700">
        <DialogHeader>
          <DialogTitle>Add Student(s)</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-900/50 p-3 rounded-lg flex items-center gap-2 text-red-200 border border-red-800">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        
        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Student</TabsTrigger>
            <TabsTrigger value="csv">Class Import (CSV)</TabsTrigger>
          </TabsList>
          
          <TabsContent value="single" className="space-y-4">
            <form onSubmit={handleSingleStudentSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name (Optional)</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="class">Assign to Class (Optional)</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger 
                    className="bg-gray-700 border-gray-600 text-gray-100"
                    id="class"
                  >
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600 text-gray-100">
                    {classes.map((classItem) => (
                      <SelectItem 
                        key={classItem.id} 
                        value={classItem.id}
                        className="focus:bg-gray-600 focus:text-gray-100"
                      >
                        {classItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={loading || !firstName.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Student'
                )}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="csv" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csvClass">Select Class *</Label>
                <Select value={csvClass} onValueChange={setCsvClass} required>
                  <SelectTrigger 
                    className="bg-gray-700 border-gray-600 text-gray-100"
                    id="csvClass"
                  >
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600 text-gray-100">
                    {classes.map((classItem) => (
                      <SelectItem 
                        key={classItem.id} 
                        value={classItem.id}
                        className="focus:bg-gray-600 focus:text-gray-100"
                      >
                        {classItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="csv">Upload CSV File</Label>
                <Input
                  id="csv"
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                  disabled={!csvClass || loading}
                />
                <p className="text-xs text-gray-400">
                  CSV should have columns: first_name (required), last_name (optional)
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}