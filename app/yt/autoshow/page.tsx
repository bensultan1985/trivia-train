import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import AutoShowClient, { type AutoShowItem } from "./ui";

export const dynamic = "force-dynamic";

async function getAutoShowItems(): Promise<AutoShowItem[]> {
  try {
    // Prefer special questions for recording, but fall back to any.
    const special = await prisma.$queryRaw<any[]>`
      SELECT id, question, "correctAnswer" AS answer, "answerContext" AS context, category
      FROM "TriviaQuestion"
      WHERE "specialQuestion" = true
      ORDER BY RANDOM()
      LIMIT 10
    `;

    const normalizedSpecial: AutoShowItem[] = (special ?? [])
      .filter(Boolean)
      .map((q) => ({
        id: String(q.id),
        question: String(q.question),
        answer: String(q.answer),
        context: q.context ? String(q.context) : null,
        category: q.category ? String(q.category) : null,
      }));

    if (normalizedSpecial.length >= 10) return normalizedSpecial.slice(0, 10);

    const remaining = 10 - normalizedSpecial.length;
    const excludeIds = normalizedSpecial.map((q) => q.id);

    const filler = excludeIds.length
      ? await prisma.$queryRaw<any[]>`
          SELECT id, question, "correctAnswer" AS answer, "answerContext" AS context, category
          FROM "TriviaQuestion"
          WHERE id NOT IN (${Prisma.join(excludeIds)})
          ORDER BY RANDOM()
          LIMIT ${remaining}
        `
      : await prisma.$queryRaw<any[]>`
          SELECT id, question, "correctAnswer" AS answer, "answerContext" AS context, category
          FROM "TriviaQuestion"
          ORDER BY RANDOM()
          LIMIT ${remaining}
        `;

    const normalizedFiller: AutoShowItem[] = (filler ?? [])
      .filter(Boolean)
      .map((q) => ({
        id: String(q.id),
        question: String(q.question),
        answer: String(q.answer),
        context: q.context ? String(q.context) : null,
        category: q.category ? String(q.category) : null,
      }));

    const combined = [...normalizedSpecial, ...normalizedFiller].slice(0, 10);
    if (combined.length > 0) return combined;
  } catch (error) {
    console.warn("/yt/autoshow: failed to load trivia from DB", error);
  }

  // Minimal fallback (in case DB is unavailable during local dev).
  return [
    {
      id: "fallback-1",
      question: "What is the capital of France?",
      answer: "Paris",
      context: null,
      category: "Geography",
    },
    {
      id: "fallback-2",
      question: "What planet is known as the Red Planet?",
      answer: "Mars",
      context: null,
      category: "Science",
    },
    {
      id: "fallback-3",
      question: "Who wrote 'Romeo and Juliet'?",
      answer: "William Shakespeare",
      context: null,
      category: "Literature",
    },
  ];
}

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getFirstParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AutoShowPage({ searchParams }: PageProps) {
  const items = await getAutoShowItems();

  // Default to clean recording mode.
  // Turn UI back on via: /yt/autoshow?ui=1  (or /yt/autoshow?clean=0)
  const uiParam = getFirstParam(searchParams?.ui);
  const cleanParam = getFirstParam(searchParams?.clean);

  const cleanMode = !(
    uiParam === "1" ||
    cleanParam === "0" ||
    cleanParam === "false" ||
    cleanParam === "off"
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <AutoShowClient items={items} cleanMode={cleanMode} />
    </div>
  );
}
