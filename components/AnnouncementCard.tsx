import { IconMegaphone } from "./icons";

interface AnnouncementCardProps {
  title: string;
  message: string;
  date?: string;
}

export default function AnnouncementCard({
  title,
  message,
  date,
}: AnnouncementCardProps) {
  return (
    <div className="rounded-lg border-l-4 border-green-500/20 bg-emerald-500 to-emerald-600 dark:bg-purple-950/30 p-4 shadow-md w-full mb-12">
      <div className="flex items-start gap-3">
        {/* <IconMegaphone className="h-6 w-6 text-purple-600 dark:text-purple-400 shrink-0 mt-1" /> */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-white dark:text-purple-100">
              {title}
            </h3>
            {date && (
              <span className="text-xs text-white dark:text-purple-300">
                {date}
              </span>
            )}
          </div>
          <p className="text-sm text-white dark:text-purple-200">{message}</p>
        </div>
      </div>
    </div>
  );
}
