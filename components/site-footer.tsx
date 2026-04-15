import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-white/10 py-8 text-sm text-gray-400">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} AI Career Mentor</p>

        <div className="flex flex-wrap gap-5">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <Link href="/how-it-works" className="transition hover:text-white">
            How it works
          </Link>
          <Link href="/practice" className="transition hover:text-white">
            Practice
          </Link>
        </div>
      </div>
    </footer>
  );
}