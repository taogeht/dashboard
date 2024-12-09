'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react'
import { useSupabase } from '@/components/supabase-provider'
import type { Users } from '@/lib/types/supabase'
import { AddTeacherModal } from '@/components/AddTeacherModal'
import { EditTeacherModal } from '@/components/EditTeacherModal'
import { ManageTeacherClasses } from '@/components/ManageTeacherClasses'
import { useRouter } from 'next/navigation'

interface Teacher extends Users {
  role: 'teacher'
}

interface TeacherWithClasses extends Users {
  classes?: {
    id: string;
    name: string;
    class_students: [{
      count: number;
    }];
  }[];
}


export default function TeachersPage() {
  const { user } = useSupabase()
  const [teachers, setTeachers] = useState<TeacherWithClasses[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Users | null>(null)
  const [managingClassesFor, setManagingClassesFor] = useState<Users | null>(null)
  const router = useRouter()

  const fetchTeachers = async () => {
    setLoading(true)
    setError(null)
  
    try {
      const response = await fetch('/api/teachers')
      const data = await response.json()
  
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch teachers')
      }
  
      setTeachers(data.teachers)
    } catch (err) {
      console.error('Error fetching teachers:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch teachers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeachers()
  }, [])

  if (loading) {
    return <div className="text-gray-100">Loading teachers...</div>
  }

  if (error) {
    return (
      <div className="text-red-400">
        <p>{error}</p>
        <Button 
          onClick={fetchTeachers}
          className="mt-4"
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-100">Teachers</h1>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Teacher
        </Button>
      </div>
  
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teachers.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-12">
            No teachers found. Add your first teacher to get started.
          </div>
        ) : (
          teachers.map((teacher) => (
            <Card key={teacher.id} className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium text-gray-200">
                  {teacher.first_name} {teacher.last_name}
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-400 hover:text-gray-100"
                    onClick={() => setEditingTeacher(teacher)}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-400 hover:text-gray-100"
                    onClick={() => setManagingClassesFor(teacher)}
                  >
                    <BookOpen size={16} />
                  </Button>
                  <Button 
  variant="ghost" 
  size="icon" 
  className="text-gray-400 hover:text-red-400"
  onClick={async () => {
    if (!confirm('Are you sure you want to delete this teacher?')) {
      return;
    }

    try {
      console.log('Attempting to delete teacher:', teacher.id);
      
      const response = await fetch(`/api/teachers/${teacher.id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      console.log('Delete response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete teacher');
      }

      fetchTeachers();
    } catch (err) {
      console.error('Error deleting teacher:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete teacher');
    }
  }}
>
  <Trash2 size={16} />
</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">{teacher.email}</p>
                  {/* Add Classes Section */}
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">
                      Assigned Classes
                    </h4>
                    {teacher.classes && teacher.classes.length > 0 ? (
                      <div className="space-y-1.5">
                        {teacher.classes.map(cls => (
                      <div 
                      key={cls.id} 
                      className="text-sm text-gray-400 px-2.5 py-1.5 bg-gray-700/50 rounded-md flex items-center justify-between"
                      onClick={() => router.push(`/dashboard/classes?selected=${cls.id}`)}
                    >
                      <span>{cls.name}</span>
                    </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        No classes assigned
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
  
      <AddTeacherModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchTeachers}
      />
  
      <EditTeacherModal
        teacher={editingTeacher}
        isOpen={!!editingTeacher}
        onClose={() => setEditingTeacher(null)}
        onSuccess={fetchTeachers}
      />
  
      {managingClassesFor && (
        <ManageTeacherClasses
          teacher={managingClassesFor}
          isOpen={true}
          onClose={() => setManagingClassesFor(null)}
          onUpdate={fetchTeachers}
        />
      )}
    </div>
  );
}