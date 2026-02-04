import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET - Fetch user's classes
export async function GET() {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get classes where user is a member
  const { data: memberships, error: membershipError } = await supabase
    .from("class_members")
    .select(`
      role,
      classes (
        id,
        name,
        description,
        subject,
        section,
        room,
        class_code,
        cover_color,
        teacher_id,
        created_at
      )
    `)
    .eq("user_id", user.id);

  if (membershipError) {
    console.error("Error fetching classes:", membershipError);
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 });
  }

  // Transform the data
  const classes = memberships?.map((m: any) => ({
    ...m.classes,
    userRole: m.role,
  })) || [];

  return NextResponse.json({ classes });
}

// POST - Create a new class
export async function POST(request: Request) {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, section, subject, room, description } = body;

  if (!name) {
    return NextResponse.json({ error: "Class name is required" }, { status: 400 });
  }

  // Generate a unique class code
  const classCode = generateClassCode();

  // Random cover color
  const colors = ["#4285F4", "#0F9D58", "#F4B400", "#DB4437", "#AB47BC", "#00ACC1"];
  const coverColor = colors[Math.floor(Math.random() * colors.length)];

  // Create the class
  const { data: newClass, error: classError } = await supabase
    .from("classes")
    .insert({
      name,
      section,
      subject,
      room,
      description,
      class_code: classCode,
      cover_color: coverColor,
      teacher_id: user.id,
    })
    .select()
    .single();

  if (classError) {
    console.error("Error creating class:", classError);
    return NextResponse.json({ error: "Failed to create class" }, { status: 500 });
  }

  // Add the teacher as a member
  const { error: memberError } = await supabase
    .from("class_members")
    .insert({
      class_id: newClass.id,
      user_id: user.id,
      role: "teacher",
    });

  if (memberError) {
    console.error("Error adding teacher as member:", memberError);
  }

  return NextResponse.json({ class: newClass }, { status: 201 });
}

function generateClassCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
