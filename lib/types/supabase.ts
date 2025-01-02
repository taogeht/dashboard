// lib/types/supabase.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          encrypted_password: string | null
          first_name: string
          last_name: string
          role: 'super_admin' | 'school_admin' | 'teacher'
          school_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          encrypted_password?: string | null
          first_name: string
          last_name: string
          role: 'super_admin' | 'school_admin' | 'teacher'
          school_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          encrypted_password?: string | null
          first_name?: string
          last_name?: string
          role?: 'super_admin' | 'school_admin' | 'teacher'
          school_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      schools: {
        Row: {
          id: string
          name: string
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          name: string
          description: string | null
          teacher_id: string
          school_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          teacher_id: string
          school_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          teacher_id?: string
          school_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      students: {
        Row: {
          id: string
          first_name: string
          last_name: string
          date_of_birth: string | null
          school_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          date_of_birth?: string | null
          school_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          date_of_birth?: string | null
          school_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      class_students: {
        Row: {
          class_id: string
          student_id: string
          created_at: string
        }
        Insert: {
          class_id: string
          student_id: string
          created_at?: string
        }
        Update: {
          class_id?: string
          student_id?: string
          created_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          class_id: string
          student_id: string
          date: string
          status: 'present' | 'absent' | 'late'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          class_id: string
          student_id: string
          date: string
          status: 'present' | 'absent' | 'late'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          student_id?: string
          date?: string
          status?: 'present' | 'absent' | 'late'
          created_at?: string
          updated_at?: string
        }
      }
      grades: {
        Row: {
          id: string
          class_id: string
          student_id: string
          assignment_name: string
          score: number
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          class_id: string
          student_id: string
          assignment_name: string
          score: number
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          student_id?: string
          assignment_name?: string
          score?: number
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for better type inference
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types for easier usage
export type Users = Tables<'users'>
export type Schools = Tables<'schools'>
export type Classes = Tables<'classes'>
export type Students = Tables<'students'>
export type ClassStudents = Tables<'class_students'>
export type Attendance = Tables<'attendance'>
export type Grades = Tables<'grades'>

// Additional type definitions for grades
export interface StudentGrade {
  student_id: string
  first_name: string
  last_name: string
  score: number | null
}

export interface GradeItem {
  id: string
  class_id: string
  assignment_name: string
  created_at: string
}

export interface GradeStats {
  average: number
  graded: number
  ungraded: number
}