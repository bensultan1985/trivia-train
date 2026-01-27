import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function GET(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // Get history with question details
    const historyQuery = {
      where: {
        clerkUserId: user.id,
      },
      skip,
      take: limit,
      orderBy: {
        answeredAt: "desc" as const,
      },
    };

    const [history, totalCount] = await Promise.all([
      prisma.questionHistory.findMany(historyQuery),
      prisma.questionHistory.count({
        where: { clerkUserId: user.id },
      }),
    ]);

    // Get question details for all history items
    const questionIds = history.map((h) => h.questionId);
    const questions = await prisma.triviaQuestion.findMany({
      where: {
        id: { in: questionIds },
      },
    });

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    // Combine history with question details and apply search filter
    let items = history.map((h) => {
      const question = questionMap.get(h.questionId);
      if (!question) return null;

      return {
        id: h.id,
        questionId: h.questionId,
        question: question.question,
        correctAnswer: question.correctAnswer,
        wrongAnswer1: question.wrongAnswer1,
        wrongAnswer2: question.wrongAnswer2,
        wrongAnswer3: question.wrongAnswer3,
        distractorChoice: question.distractorChoice,
        wrongAnswer1Context: question.wrongAnswer1Context,
        wrongAnswer2Context: question.wrongAnswer2Context,
        wrongAnswer3Context: question.wrongAnswer3Context,
        questionContext: question.questionContext,
        answerContext: question.answerContext,
        category: question.category,
        categoryPath: question.categoryPath,
        difficulty: question.difficulty,
        choiceKey: h.choiceKey,
        isCorrect: h.isCorrect,
        answeredAt: h.answeredAt,
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter((item) => 
        item.question.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower) ||
        item.correctAnswer.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const historyId = searchParams.get("id");

    if (historyId) {
      // Delete single history entry
      await prisma.questionHistory.delete({
        where: {
          id: historyId,
          clerkUserId: user.id, // Ensure user can only delete their own history
        },
      });
    } else {
      // Delete all history for user
      await prisma.questionHistory.deleteMany({
        where: {
          clerkUserId: user.id,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting history:", error);
    return NextResponse.json(
      { error: "Failed to delete history" },
      { status: 500 },
    );
  }
}
