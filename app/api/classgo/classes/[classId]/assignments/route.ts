import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET - Fetch assignments for a class
export async function GET(
  request: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  const { classId } = await params;
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user is a member of the class
  const { data: membership } = await supabase
    .from("class_members")
    .select("role")
    .eq("class_id", classId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Not a member of this class" }, { status: 403 });
  }

  // Fetch assignments
  const { data: assignments, error } = await supabase
    .from("assignments")
    .select("*")
    .eq("class_id", classId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }

  // If student, also fetch their submissions
  if (membership.role === "student") {
    const assignmentIds = assignments?.map(a => a.id) || [];
    
    if (assignmentIds.length > 0) {
      const { data: submissions } = await supabase
        .from("submissions")
        .select("*")
        .in("assignment_id", assignmentIds)
        .eq("student_id", user.id);

      // Merge submissions with assignments
      const assignmentsWithSubmissions = assignments?.map(assignment => ({
        ...assignment,
        submission: submissions?.find(s => s.assignment_id === assignment.id) || null,
      }));

      return NextResponse.json({ assignments: assignmentsWithSubmissions, userRole: membership.role });
    }
  }

  return NextResponse.json({ assignments, userRole: membership.role });
}

// POST - Create a new assignment
export async function POST(
  request: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  const { classId } = await params;
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user is a teacher of the class
  const { data: membership } = await supabase
    .from("class_members")
    .select("role")
    .eq("class_id", classId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "teacher") {
    return NextResponse.json({ error: "Only teachers can create assignments" }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, instructions, dueDate, points, assignmentType } = body;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const { data: assignment, error } = await supabase
    .from("assignments")
    .insert({
      class_id: classId,
      teacher_id: user.id,
      title,
      description,
      instructions,
      due_date: dueDate || null,
      points: points || 100,
      assignment_type: assignmentType || "assignment",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
  }

  return NextResponse.json({ assignment }, { status: 201 });
}
