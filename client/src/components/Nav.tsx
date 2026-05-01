import { Link } from "react-router-dom";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-foreground bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center bg-primary brutal-sm font-black">
            S
          </div>
          <span className="text-xl font-black tracking-tight">GBU SAGE</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <a href="/#features" className="px-3 py-2 font-bold hover:bg-accent">Features</a>
          <a href="/#how" className="px-3 py-2 font-bold hover:bg-accent">How it works</a>
          <a href="/#faq" className="px-3 py-2 font-bold hover:bg-accent">FAQ</a>
        </nav>
        <Link
          to="/chat"
          className="brutal brutal-hover bg-primary px-4 py-2 font-black text-primary-foreground"
        >
          Try SAGE →
        </Link>
      </div>
    </header>
  );
}