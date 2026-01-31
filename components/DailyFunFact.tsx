import { funFacts } from "@/app/strategy-guides/funFacts";

type DailyFunFactProps = {
  date?: Date;
  className?: string;
};

export function temporaryMapFunFactToDate(date: Date): number {
  // Jan 31, 2026 => 0, then +1 per day.
  const baseUtcMs = Date.UTC(2026, 0, 31);
  const dateUtcMs = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  return Math.floor((dateUtcMs - baseUtcMs) / 86_400_000);
}

export default function DailyFunFact({ date, className }: DailyFunFactProps) {
  const today = date ?? new Date();
  const dayIndex = Math.max(0, temporaryMapFunFactToDate(today));

  const factCount = funFacts.length;
  const fact = factCount > 0 ? funFacts[dayIndex % factCount] : "";

  if (!fact) return null;

  return (
    // <div className="rounded-lg ring-3 ring-red-500/30">
    <div
    //   className="
    // p-1 rounded-xl bg-linear-to-r from-pink-500 via-green-500 to-orange-500
    // "
    //   className="ring-3 rounded-lg ring-yellow-300"
    >
      <div
        className={
          "w-full rounded-lg bg-white/95 px-4 py-3 ring-black/5 dark:bg-gray-800/80 dark:ring-white/10 " +
          (className ?? "")
        }
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          {/* <div className="shrink-0 text-xs font-bold uppercase tracking-wide ">
            <span className="bg-linear-to-r from-pink-500 via-green-500 to-orange-500 bg-clip-text text-transparent">
              Fun fact of the
            </span>
            <span className="bg-linear-to-r from-orange-500  to-blue-500 bg-clip-text text-transparent">
              {" "}
              day:
            </span>
          </div> */}
          <div className="font-bold">
            <span className="p-0 text-red-500">Fun </span>
            <span className="p-0 text-orange-500">fact </span>
            <span className="text-green-500">of </span>
            <span className="text-blue-500">the </span>
            <span className="text-purple-500">day: </span>
          </div>
          <div className="font-semibold text-gray-600 dark:text-gray-100 leading-snug">
            {fact}
          </div>
        </div>
      </div>
    </div>
    // </div>
  );
}
