'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSupabase } from '@/components/supabase-provider'
import { Upload } from 'lucide-react'
import Papa from 'papaparse'
import type { Classes } from '@/lib/types/supabase'

interface AddStudentModalProps {
  isOpen: boolean
  onClose: () => void
  onStudentAdded: () => void
}

export function AddStudentModal({ isOpen, onClose, onStudentAdded }: AddStudentModalProps) {
  const { supabase } = useSupabase()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [csvClass, setCsvClass] = useState<string>('')
  const [classes, setClasses] = useState<Classes[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchClasses = async () => {
    try {
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .order('name')

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
  }, [isOpen])

  const handleSingleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setError(null)

      const { data: newStudent, error: studentError } = await supabase
        .from('students')
        .insert({
          first_name: firstName,
          last_name: lastName || null,
          email: email || null
        })
        .select()
        .single()

      if (studentError) throw studentError

      if (selectedClass && newStudent) {
        const { error: enrollError } = await supabase
          .from('class_students')
          .insert({
            class_id: selectedClass,
            student_id: newStudent.id
          })

        if (enrollError) throw enrollError
      }

      setFirstName('')
      setLastName('')
      setEmail('')
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
  
      // Validate and clean data
      const validStudents = result.data
        .map(row => ({
          first_name: row.first_name?.trim(),
          last_name: row.last_name?.trim() || null,  // Changed to null
          email: row.email?.trim() || null           // Changed to null
        }))
        .filter(student => student.first_name) // Remove any rows without first names
  
      if (validStudents.length === 0) {
        throw new Error('No valid student data found. Each student must have a first name.')
      }
  
      console.log('Preparing to insert students:', validStudents)
  
      // Insert all students
      const { data: newStudents, error: studentsError } = await supabase
        .from('students')
        .insert(validStudents)
        .select()
  
      if (studentsError) {
        console.error('Database error:', studentsError)
        throw new Error(`Database error: ${studentsError.message}`)
      }
  
      if (!newStudents || newStudents.length === 0) {
        throw new Error('Failed to create new students')
      }
  
      // Enroll all new students in the selected class
      const { error: enrollError } = await supabase
        .from('class_students')
        .insert(
          newStudents.map(student => ({
            class_id: csvClass,
            student_id: student.id
          }))
        )
  
      if (enrollError) throw enrollError
  
      // Success!
      onStudentAdded()
      onClose()
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
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
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                {loading ? 'Adding...' : 'Add Student'}
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
                  ref={fileInputRef}
                  onChange={handleCSVUpload}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                  disabled={!csvClass || loading}
                />
                <p className="text-xs text-gray-400">
                  CSV should have columns: first_name (required), last_name, email
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
      </DialogContent>
    </Dialog>
  )
}