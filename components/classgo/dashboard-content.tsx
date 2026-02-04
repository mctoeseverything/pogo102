'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  GraduationCap, 
  Plus, 
  LogOut, 
  BookOpen, 
  Users, 
  Calendar,
  MoreVertical,
  Settings,
  Loader2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CreateClassDialog } from './create-class-dialog'
import { JoinClassDialog } from './join-class-dialog'
import { ThemeToggle } from '@/components/theme-toggle'

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
  userRole: 'teacher' | 'student'
  created_at: string
}

interface DashboardContentProps {
  user: User
}

export function DashboardContent({ user }: DashboardContentProps) {
  const router = useRouter()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [classes, setClasses] = useState<ClassData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const userRole = user.user_metadata?.role || 'student'
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

  const fetchClasses = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/classgo/classes')
      const data = await response.json()
      if (data.classes) {
        setClasses(data.classes)
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  const handleClassCreated = () => {
    fetchClasses()
    setIsCreateDialogOpen(false)
  }

  const handleClassJoined = () => {
    fetchClasses()
    setIsJoinDialogOpen(false)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/classgo')
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">ClassGo</span>
          </div>
          
          <div className="flex items-center gap-4">
            {userRole === 'teacher' ? (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Class
              </Button>
            ) : (
              <Button onClick={() => setIsJoinDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Join Class
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
                  <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
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

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {userName.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">
            {userRole === 'teacher' 
              ? 'Manage your classes and connect with students.' 
              : 'View your classes and assignments.'}
          </p>
        </div>

        {/* Classes Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : classes.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((cls) => (
              <Link key={cls.id} href={`/classgo/dashboard/class/${cls.id}`}>
                <Card className="group overflow-hidden transition-shadow hover:shadow-md cursor-pointer">
                  <div 
                    className="h-24 relative"
                    style={{ backgroundColor: cls.cover_color || '#4285F4' }}
                  >
                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="truncate text-lg font-semibold text-white">
                        {cls.name}
                      </h3>
                      <p className="truncate text-sm text-white/80">
                        {cls.section || cls.subject || 'No section'}
                      </p>
                    </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-2 top-2 text-white hover:bg-white/20"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View class</DropdownMenuItem>
                      <DropdownMenuItem>
                        Class code: {cls.class_code}
                      </DropdownMenuItem>
                      {cls.userRole === 'teacher' && (
                        <>
                          <DropdownMenuItem>Edit class</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            Delete class
                          </DropdownMenuItem>
                        </>
                      )}
                      {cls.userRole === 'student' && (
                        <DropdownMenuItem className="text-destructive">
                          Unenroll
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{cls.subject || 'General'}</span>
                    </div>
                    {cls.room && (
                      <span>Room: {cls.room}</span>
                    )}
                  </div>
                </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="py-16">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="mb-2">No classes yet</CardTitle>
              <CardDescription className="mb-6 max-w-sm">
                {userRole === 'teacher'
                  ? "You haven't created any classes yet. Create your first class to get started."
                  : "You haven't joined any classes yet. Join a class using a class code from your teacher."}
              </CardDescription>
              {userRole === 'teacher' ? (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first class
                </Button>
              ) : (
                <Button onClick={() => setIsJoinDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Join a class
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Dialogs */}
      <CreateClassDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
        onSuccess={handleClassCreated}
      />
      <JoinClassDialog 
        open={isJoinDialogOpen} 
        onOpenChange={setIsJoinDialogOpen}
        onSuccess={handleClassJoined}
      />
    </div>
  )
}
