import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-2 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">{/* © {year} BS Games */}</div>
        <nav
          aria-label="Footer"
          className="flex flex-wrap gap-x-4 gap-y-2 text-sm"
        >
          <div className="text-sm">© {year} BS Games</div>
          <div className="text-slate-300">|</div>
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
          <Link href="/about" className="hover:underline">
            About
          </Link>
          <Link href="/socials" className="hover:underline">
            Socials
          </Link>
          <Link href="/contact" className="hover:underline">
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  );
}
