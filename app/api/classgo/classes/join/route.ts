import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST - Join a class with code
export async function POST(request: Request) {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { classCode } = body;

  if (!classCode) {
    return NextResponse.json({ error: "Class code is required" }, { status: 400 });
  }

  // Find the class by code
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("*")
    .eq("class_code", classCode.toUpperCase())
    .single();

  if (classError || !classData) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from("class_members")
    .select("*")
    .eq("class_id", classData.id)
    .eq("user_id", user.id)
    .single();

  if (existingMember) {
    return NextResponse.json({ error: "Already a member of this class" }, { status: 400 });
  }

  // Add user as a student member
  const { error: memberError } = await supabase
    .from("class_members")
    .insert({
      class_id: classData.id,
      user_id: user.id,
      role: "student",
    });

  if (memberError) {
    console.error("Error joining class:", memberError);
    return NextResponse.json({ error: "Failed to join class" }, { status: 500 });
  }

  return NextResponse.json({ class: classData }, { status: 200 });
}
