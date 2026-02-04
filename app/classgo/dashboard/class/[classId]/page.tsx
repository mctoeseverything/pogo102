import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClassDetailContent } from "@/components/classgo/class-detail-content";

interface ClassPageProps {
  params: Promise<{ classId: string }>;
}

export default async function ClassPage({ params }: ClassPageProps) {
  const { classId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/classgo/auth/login");
  }

  // Fetch class details
  const { data: membership } = await supabase
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
    .eq("class_id", classId)
    .eq("user_id", user.id)
    .single();

  if (!membership || !membership.classes) {
    redirect("/classgo/dashboard");
  }

  return (
    <ClassDetailContent
      user={user}
      classData={membership.classes as any}
      userRole={membership.role as "teacher" | "student"}
    />
  );
}
