'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  GraduationCap,
  ArrowLeft,
  Plus,
  LogOut,
  BookOpen,
  Users,
  Calendar,
  FileText,
  MoreVertical,
  Settings,
  ClipboardList,
  MessageSquare,
  Loader2,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CreateAssignmentDialog } from './create-assignment-dialog'

interface ClassData {
  id: string
  name: string
  description?: string
  subject?: string
  section?: string
  room?: string
  class_code: string
  cover_color: string
  teacher_id: string
  created_at: string
}

interface Assignment {
  id: string
  title: string
  description?: string
  instructions?: string
  due_date?: string
  points: number
  assignment_type: 'assignment' | 'quiz' | 'material'
  created_at: string
  submission?: {
    id: string
    status: string
    grade?: number
    submitted_at?: string
  }
}

interface ClassDetailContentProps {
  user: User
  classData: ClassData
  userRole: 'teacher' | 'student'
}

export function ClassDetailContent({ user, classData, userRole }: ClassDetailContentProps) {
  const router = useRouter()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

  const fetchAssignments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/classgo/classes/${classData.id}/assignments`)
      const data = await response.json()
      if (data.assignments) {
        setAssignments(data.assignments)
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [classData.id])

  const handleAssignmentCreated = () => {
    fetchAssignments()
    setIsCreateDialogOpen(false)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/classgo')
  }

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return 'No due date'
    const date = new Date(dateString)
    const now = new Date()
    const isOverdue = date < now
    
    return (
      <span className={isOverdue ? 'text-destructive' : ''}>
        Due {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </span>
    )
  }

  const getSubmissionStatus = (assignment: Assignment) => {
    if (!assignment.submission) {
      return <span className="text-muted-foreground">Not submitted</span>
    }
    if (assignment.submission.status === 'graded') {
      return <span className="text-green-600">{assignment.submission.grade}/{assignment.points}</span>
    }
    if (assignment.submission.status === 'submitted') {
      return <span className="text-blue-600">Submitted</span>
    }
    return <span className="text-muted-foreground">{assignment.submission.status}</span>
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/classgo/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-7 w-7 text-primary" />
              <span className="text-xl font-bold">ClassGo</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {userRole === 'teacher' && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Assignment
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Class Banner */}
      <div
        className="h-48 relative"
        style={{ backgroundColor: classData.cover_color || '#4285F4' }}
      >
        <div className="absolute bottom-6 left-6 right-6 max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white">{classData.name}</h1>
          <p className="text-white/80 mt-1">
            {classData.section && <span>{classData.section}</span>}
            {classData.section && classData.subject && <span> • </span>}
            {classData.subject && <span>{classData.subject}</span>}
          </p>
          {userRole === 'teacher' && (
            <p className="text-white/60 text-sm mt-2">Class code: {classData.class_code}</p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Tabs defaultValue="stream" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="stream">Stream</TabsTrigger>
            <TabsTrigger value="classwork">Classwork</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
          </TabsList>

          <TabsContent value="stream">
            <div className="grid gap-6 lg:grid-cols-4">
              {/* Class Info Card */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base">Class Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {classData.room && (
                    <div>
                      <span className="text-muted-foreground">Room:</span> {classData.room}
                    </div>
                  )}
                  {classData.subject && (
                    <div>
                      <span className="text-muted-foreground">Subject:</span> {classData.subject}
                    </div>
                  )}
                  {userRole === 'teacher' && (
                    <div>
                      <span className="text-muted-foreground">Class code:</span>{' '}
                      <span className="font-mono font-semibold">{classData.class_code}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <div className="lg:col-span-3 space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center py-8">
                      {classData.description || 'Welcome to the class! Check the Classwork tab for assignments.'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="classwork">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : assignments.length > 0 ? (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            {assignment.assignment_type === 'quiz' ? (
                              <ClipboardList className="h-5 w-5 text-primary" />
                            ) : assignment.assignment_type === 'material' ? (
                              <BookOpen className="h-5 w-5 text-primary" />
                            ) : (
                              <FileText className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold">{assignment.title}</h3>
                            {assignment.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {assignment.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {formatDueDate(assignment.due_date)}
                              </span>
                              <span className="text-muted-foreground">{assignment.points} points</span>
                            </div>
                          </div>
                        </div>
                        {userRole === 'student' && (
                          <div className="text-right">
                            {getSubmissionStatus(assignment)}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="py-16">
                <CardContent className="flex flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <CardTitle className="mb-2">No assignments yet</CardTitle>
                  <CardDescription className="mb-6 max-w-sm">
                    {userRole === 'teacher'
                      ? 'Create your first assignment to get started.'
                      : 'Your teacher has not posted any assignments yet.'}
                  </CardDescription>
                  {userRole === 'teacher' && (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create assignment
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="people">
            <Card>
              <CardContent className="py-8">
                <p className="text-muted-foreground text-center">
                  People list coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialog */}
      <CreateAssignmentDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        classId={classData.id}
        onSuccess={handleAssignmentCreated}
      />
    </div>
  )
}
