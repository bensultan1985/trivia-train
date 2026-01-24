import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get("count") || "15");

    // Get random questions from the database
    const questions = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TriviaQuestion"
      ORDER BY RANDOM()
      LIMIT ${count}
    `;

    // Transform questions to include shuffled answers
    const transformedQuestions = questions.map((q) => {
      // Create an array of all answers with their identifiers
      const answers = [
        { text: q.correctAnswer, isCorrect: true },
        { text: q.wrongAnswer1, isCorrect: false },
        { text: q.wrongAnswer2, isCorrect: false },
        { text: q.wrongAnswer3, isCorrect: false },
      ];

      // Shuffle the answers
      const shuffledAnswers = answers.sort(() => Math.random() - 0.5);

      return {
        id: q.id,
        question: q.question,
        answers: shuffledAnswers,
        category: q.category,
        categoryPath: q.categoryPath,
        difficulty: q.difficulty,
        // Calculate total responses for frequency calculation
        totalResponses:
          q.choice1Count + q.choice2Count + q.choice3Count + q.choice4Count,
        // We'll use choice1Count as a proxy for correct answer frequency
        // In a real implementation, this would track which choice was correct
        correctFrequency:
          q.choice1Count + q.choice2Count + q.choice3Count + q.choice4Count > 0
            ? Math.round(
                (q.choice1Count /
                  (q.choice1Count +
                    q.choice2Count +
                    q.choice3Count +
                    q.choice4Count)) *
                  100
              )
            : null,
      };
    });

    return NextResponse.json({ questions: transformedQuestions });
  } catch (error) {
    console.error("Error fetching trivia questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}
