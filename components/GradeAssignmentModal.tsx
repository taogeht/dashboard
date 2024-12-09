'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2 } from 'lucide-react'
import { cn } from "@/lib/utils"

// Define the StudentGrade interface
interface StudentGrade {
  student_id: string
  first_name: string
  last_name: string
  score: number | null
}

interface GradeAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (grades: StudentGrade[]) => Promise<void>
  students: StudentGrade[]
  assignmentName: string
}

interface GradeStats {
  average: number
  graded: number
  ungraded: number
}

export default function GradeAssignmentModal({
  isOpen,
  onClose,
  onSave,
  students,
  assignmentName
}: GradeAssignmentModalProps) {
  const [grades, setGrades] = useState<StudentGrade[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<GradeStats>({
    average: 0,
    graded: 0,
    ungraded: 0
  })

  useEffect(() => {
    setGrades(students)
  }, [students])

  useEffect(() => {
    const gradedStudents = grades.filter(s => s.score !== null)
    const validScores = gradedStudents
      .map(s => s.score)
      .filter((score): score is number => score !== null)
    
    setStats({
      average: validScores.length > 0 
        ? validScores.reduce((a, b) => a + b, 0) / validScores.length 
        : 0,
      graded: gradedStudents.length,
      ungraded: grades.length - gradedStudents.length
    })
  }, [grades])

  const handleGradeChange = (studentId: string, scoreStr: string) => {
    setGrades(prev => prev.map(student => {
      if (student.student_id === studentId) {
        const score = scoreStr === '' ? null : parseFloat(scoreStr)
        return {
          ...student,
          score: isNaN(score as number) ? null : score
        }
      }
      return student
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      
      const invalidGrades = grades.filter(g => 
        g.score !== null && (g.score < 0 || g.score > 100)
      )

      if (invalidGrades.length > 0) {
        throw new Error('All grades must be between 0 and 100')
      }

      await onSave(grades)
      onClose()
    } catch (err) {
      console.error('Error saving grades:', err)
      setError(err instanceof Error ? err.message : 'Failed to save grades')
    } finally {
      setSaving(false)
    }
  }

  const handleBulkAction = (action: 'clear' | 'zero') => {
    setGrades(prev => prev.map(student => ({
      ...student,
      score: action === 'clear' ? null : action === 'zero' ? 0 : student.score
    })))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-800 text-gray-100 border-gray-700">
        <DialogHeader>
          <DialogTitle>Assign Grades - {assignmentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-900/50 p-3 rounded-lg flex items-center gap-2 text-red-200 border border-red-800">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900/50 p-3 rounded-lg">
              <Label className="text-gray-400">Class Average</Label>
              <p className="text-xl font-bold text-gray-100">
                {stats.average.toFixed(1)}%
              </p>
            </div>
            <div className="bg-gray-900/50 p-3 rounded-lg">
              <Label className="text-gray-400">Graded</Label>
              <p className="text-xl font-bold text-green-400">
                {stats.graded}
              </p>
            </div>
            <div className="bg-gray-900/50 p-3 rounded-lg">
              <Label className="text-gray-400">Ungraded</Label>
              <p className="text-xl font-bold text-yellow-400">
                {stats.ungraded}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('clear')}
              className="border-gray-300 hover:bg-gray-700 text-gray-700"
            >
              Clear All
            </Button>
   
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {grades.map((student) => (
              <div
                key={student.student_id}
                className="flex items-center justify-between p-2 rounded-lg border border-gray-700 bg-gray-900/50"
              >
                <span className="text-gray-100">
                  {student.first_name} {student.last_name}
                </span>
                <div className="w-24">
                  <Input
                    type="number"
                    value={student.score === null ? '' : student.score}
                    onChange={(e) => handleGradeChange(student.student_id, e.target.value)}
                    className={cn(
                      "bg-gray-700 border-gray-600 text-gray-100",
                      student.score === null && "text-gray-400"
                    )}
                    placeholder="-"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
            <Button
              variant="ghost"
              onClick={onClose}
              className="border-gray-600 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Grades'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export type { StudentGrade }