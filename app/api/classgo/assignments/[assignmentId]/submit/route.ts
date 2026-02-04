import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST - Submit an assignment
export async function POST(
  request: Request,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const { assignmentId } = await params;
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { content } = body;

  // Check if assignment exists and user is a student in that class
  const { data: assignment } = await supabase
    .from("assignments")
    .select("*, classes!inner(id)")
    .eq("id", assignmentId)
    .single();

  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from("class_members")
    .select("role")
    .eq("class_id", assignment.class_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "student") {
    return NextResponse.json({ error: "Only students can submit assignments" }, { status: 403 });
  }

  // Upsert submission (create or update)
  const { data: submission, error } = await supabase
    .from("submissions")
    .upsert({
      assignment_id: assignmentId,
      student_id: user.id,
      content,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    }, {
      onConflict: "assignment_id,student_id",
    })
    .select()
    .single();

  if (error) {
    console.error("Error submitting assignment:", error);
    return NextResponse.json({ error: "Failed to submit assignment" }, { status: 500 });
  }

  return NextResponse.json({ submission }, { status: 200 });
}
