import { type NextRequest } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// By default, the latest SDK uses the stable v1 endpoint. 
// This is what gives you the 1,500 RPD limit.
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

interface FileData {
  name: string;
  type: string;
  content: string | null;
  textContent: string | null;
}

interface QuizConfig {
  questionCount: number;
  types: ("multiple-choice" | "true-false" | "short-answer")[];
  difficulty: "easy" | "medium" | "hard";
}

export async function POST(req: NextRequest) {
  try {
    const { files, config } = (await req.json()) as {
      files: FileData[];
      config: QuizConfig;
    };

    const { questionCount, types, difficulty } = config;

    let combinedText = "";
    for (const file of files) {
      if (file.textContent) {
        combinedText += file.textContent + "\n\n";
      } else if (file.content) {
        if (file.type.startsWith("text/") || file.name.match(/\.(txt|md|csv|json|xml|html)$/i)) {
          try {
            const decoded = atob(file.content);
            combinedText += decoded + "\n\n";
          } catch { /* Skip failed decodes */ }
        }
      }
    }

    if (!combinedText.trim()) {
      return Response.json({ error: "Could not extract text from the uploaded files." }, { status: 400 });
    }

    const maxContentLength = 15000;
    const contentForAI = combinedText.length > maxContentLength 
      ? combinedText.slice(0, maxContentLength) + "\n\n[Content truncated...]" 
      : combinedText;

    const difficultyInstructions = {
      easy: "Create straightforward questions testing basic recall.",
      medium: "Create questions requiring conceptual understanding.",
      hard: "Create challenging questions requiring critical analysis."
    };

    // Use Gemini 1.5 Flash for the high RPD quota (1,500/day)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
    });

    const systemPrompt = `You are an expert educational quiz generator. Create a high-quality quiz.
    CRITICAL: 1. Questions must be self-contained. 2. Multiple choice must have 4 plausible options. 3. True/False must have options ["True", "False"].`;

    const userPrompt = `Generate a ${difficulty} quiz with ${questionCount} questions using these types: ${types.join(", ")}.
    
    ${difficultyInstructions[difficulty]}

    STUDY MATERIALS:
    ${contentForAI}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
        // This forces the model to return raw JSON so you don't have to parse markdown blocks
        responseMimeType: "application/json",
      },
    });

    const text = result.response.text();
    const quizData = JSON.parse(text);

    if (!quizData || !quizData.questions) {
      throw new Error("Invalid structure returned from AI");
    }

    const formattedQuestions = quizData.questions.map((q: any, index: number) => ({
      id: `q-${index + 1}`,
      type: q.type,
      question: q.question,
      options: q.type === "short-answer" ? undefined : (q.options || ["True", "False"]),
      correctAnswer: q.correctAnswer,
    }));

    return Response.json({
      quiz: {
        title: quizData.title || "Generated Quiz",
        questions: formattedQuestions,
      },
    });

  } catch (error) {
    console.error("Error generating quiz:", error);
    const isQuotaError = error instanceof Error && error.message.includes("429");
    
    return Response.json(
      { error: isQuotaError ? "Rate limit reached. Please wait a moment." : "Failed to generate quiz." },
      { status: isQuotaError ? 429 : 500 }
    );
  }
}
