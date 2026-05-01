export default function Footer() {
  return (
    <footer className="mt-24 border-t-[3px] border-foreground bg-foreground text-background">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <div className="text-2xl font-black">GBU SAGE</div>
          <p className="mt-2 text-sm opacity-80">
            The unofficial student assistant for Gautam Buddha University.
          </p>
        </div>
        <div>
          <div className="font-black uppercase">Product</div>
          <ul className="mt-2 space-y-1 text-sm opacity-90">
            <li>Chat assistant</li>
            <li>Document Q&A</li>
            <li>Campus guide</li>
          </ul>
        </div>
        <div>
          <div className="font-black uppercase">Made for</div>
          <p className="mt-2 text-sm opacity-90">
            Students of Gautam Buddha University, Greater Noida.
          </p>
        </div>
      </div>
      <div className="border-t border-background/20 px-4 py-4 text-center text-xs opacity-70">
        © {new Date().getFullYear()} GBU SAGE. Not officially affiliated with the university.
      </div>
    </footer>
  );
}