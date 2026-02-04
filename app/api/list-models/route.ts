import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error }, { status: response.status });
    }
    
    const data = await response.json();
    
    // Filter to show models that support generateContent
    const contentModels = data.models?.filter((model: { supportedGenerationMethods?: string[] }) => 
      model.supportedGenerationMethods?.includes("generateContent")
    );
    
    return NextResponse.json({
      allModels: data.models?.map((m: { name: string }) => m.name),
      generateContentModels: contentModels?.map((m: { name: string; displayName: string }) => ({
        name: m.name,
        displayName: m.displayName
      }))
    });
  } catch (error) {
    console.error("Error listing models:", error);
    return NextResponse.json({ error: "Failed to list models" }, { status: 500 });
  }
}
