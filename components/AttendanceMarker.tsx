import { useState, useEffect } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X, AlertCircle, Loader2, Clock } from 'lucide-react'
import { cn } from "@/lib/utils"
import type { Students, Classes } from '@/lib/types/supabase'

interface AttendanceMarkerProps {
  classId?: string
  date: Date
  onSave?: () => void
}

interface ClassStudentResponse {
  student: {
    id: string
    first_name: string
    last_name: string
  }
}

type AttendanceStatus = 'present' | 'absent' | 'late'

interface StudentAttendance {
  id: string
  firstName: string
  lastName: string
  status: AttendanceStatus
}

export default function AttendanceMarker({ classId, date, onSave }: AttendanceMarkerProps) {
  const { supabase } = useSupabase()
  const [students, setStudents] = useState<StudentAttendance[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch students and existing attendance
  useEffect(() => {
    const fetchStudentsAndAttendance = async () => {
      if (!classId) return

      try {
        setLoading(true)
        setError(null)

        const formattedDate = date.toISOString().split('T')[0]

        // Fetch students in the class
        const { data: classStudents, error: studentsError } = await supabase
          .from('class_students')
          .select(`
            student:students (
              id,
              first_name,
              last_name
            )
          `)
          .eq('class_id', classId) as unknown as { 
            data: ClassStudentResponse[], 
            error: any 
          }

        if (studentsError) throw studentsError

        // Fetch existing attendance records
        const { data: existingAttendance, error: attendanceError } = await supabase
          .from('attendance')
          .select('*')
          .eq('class_id', classId)
          .eq('date', formattedDate)

        if (attendanceError) throw attendanceError

        // Combine student data with attendance records
        const studentAttendance: StudentAttendance[] = (classStudents || []).map((cs) => ({
          id: cs.student.id,
          firstName: cs.student.first_name,
          lastName: cs.student.last_name,
          status: existingAttendance?.find(a => a.student_id === cs.student.id)?.status || 'present'
        }))

        setStudents(studentAttendance)
      } catch (err) {
        console.error('Error fetching students and attendance:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchStudentsAndAttendance()
  }, [classId, date])

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudents(prev =>
      prev.map(student =>
        student.id === studentId ? { ...student, status } : student
      )
    )
  }

  const handleMarkAll = (status: AttendanceStatus) => {
    setStudents(prev => prev.map(student => ({ ...student, status })))
  }

  const handleSave = async () => {
    if (!classId) return

    try {
      setSaving(true)
      setError(null)

      const formattedDate = date.toISOString().split('T')[0]

      // Delete existing attendance records for this class and date
      const { error: deleteError } = await supabase
        .from('attendance')
        .delete()
        .eq('class_id', classId)
        .eq('date', formattedDate)

      if (deleteError) throw deleteError

      // Insert new attendance records
      const { error: insertError } = await supabase
        .from('attendance')
        .insert(
          students.map(student => ({
            class_id: classId,
            student_id: student.id,
            date: formattedDate,
            status: student.status
          }))
        )

      if (insertError) throw insertError

      if (onSave) onSave()
    } catch (err) {
      console.error('Error saving attendance:', err)
      setError(err instanceof Error ? err.message : 'Failed to save attendance')
    } finally {
      setSaving(false)
    }
  }

  if (!date) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="pt-6">
          <div className="text-center text-gray-400">
            Please select a date to mark attendance
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold text-gray-100">
          Mark Attendance for {date.toLocaleDateString()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-800 rounded-lg flex items-center gap-2 text-red-200">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading students...
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No students found in this class
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMarkAll('present')}
                className="border-green-700 text-green-500 hover:bg-green-900/20"
              >
                Mark All Present
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMarkAll('absent')}
                className="border-red-700 text-red-500 hover:bg-red-900/20"
              >
                Mark All Absent
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || students.length === 0}
                className="ml-auto bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Attendance'
                )}
              </Button>
            </div>

            <div className="space-y-2">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-2 rounded-lg border border-gray-700 bg-gray-900/50"
                >
                  <span className="text-gray-100">
                    {student.firstName} {student.lastName}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "w-24 text-gray-300",
                        student.status === 'present' && "bg-green-900/20 text-green-500"
                      )}
                      onClick={() => handleStatusChange(student.id, 'present')}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Present
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "w-24 text-gray-300",
                        student.status === 'absent' && "bg-red-900/20 text-red-500"
                      )}
                      onClick={() => handleStatusChange(student.id, 'absent')}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Absent
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "w-24 text-gray-300",
                        student.status === 'late' && "bg-yellow-900/20 text-yellow-500"
                      )}
                      onClick={() => handleStatusChange(student.id, 'late')}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Late
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}