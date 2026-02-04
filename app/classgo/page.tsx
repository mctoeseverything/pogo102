"use client";

import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Users, ClipboardList, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function ClassGoPage() {
  const features = [
    {
      icon: BookOpen,
      title: "Course Management",
      description: "Create and organize courses with materials, assignments, and resources.",
    },
    {
      icon: Users,
      title: "Class Collaboration",
      description: "Connect students and teachers in a collaborative learning environment.",
    },
    {
      icon: ClipboardList,
      title: "Assignments & Grading",
      description: "Create assignments, collect submissions, and provide feedback.",
    },
    {
      icon: MessageSquare,
      title: "Announcements",
      description: "Keep everyone informed with class-wide announcements and updates.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-7xl px-6 pt-24 pb-16">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl">ClassGo</h1>
          <p className="mt-4 max-w-lg text-lg text-muted-foreground">
            Your complete classroom management solution. Create classes, share materials, 
            assign work, and connect with students - all in one place.
          </p>
          <div className="mt-8 flex gap-4">
            <Button asChild size="lg">
              <Link href="/classgo/auth/sign-up">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/classgo/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border bg-card p-6 text-left"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
