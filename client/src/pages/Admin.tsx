import { useState } from "react";

// If you're using React Router v6, import these instead:
import { Link } from "react-router-dom";
// and replace <a href="..."> with <Link to="...">

type Doc = {
  name: string;
  type: string;
  chunks: number;
  status: "Indexed" | "Processing" | "Failed";
};

const DOCS: Doc[] = [
  { name: "Student Handbook 2025.pdf", type: "Handbook", chunks: 412, status: "Indexed" },
  { name: "Academic Calendar 2025-26.pdf", type: "Calendar", chunks: 38, status: "Indexed" },
  { name: "Hostel Manual.pdf", type: "Hostel", chunks: 96, status: "Indexed" },
  { name: "Fee Structure 2025.xlsx", type: "Fees", chunks: 27, status: "Processing" },
  { name: "Library Handbook.pdf", type: "Library", chunks: 54, status: "Indexed" },
  { name: "Exam Notice March.pdf", type: "Notice", chunks: 6, status: "Failed" },
];

const STATUS_BG: Record<Doc["status"], string> = {
  Indexed: "bg-secondary",
  Processing: "bg-accent",
  Failed: "bg-primary",
};

export default function AdminPage() {
  const [query, setQuery] = useState("");
  const filtered = DOCS.filter((d) =>
    d.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b-[3px] border-foreground bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* Replace href with React Router <Link to="/"> if using react-router-dom */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center bg-primary brutal-sm font-black">
              S
            </div>
            <span className="text-xl font-black">GBU SAGE</span>
            <span className="brutal-sm ml-2 bg-foreground px-2 py-0.5 text-xs font-black uppercase text-background">
              Admin
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/chat" className="brutal-sm brutal-hover bg-accent px-3 py-1.5 text-sm font-black">
              Chat
            </Link>
            <Link to="/login" className="brutal-sm brutal-hover bg-background px-3 py-1.5 text-sm font-black">
              Sign out
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="brutal-sm w-fit bg-accent px-3 py-1 text-xs font-black uppercase">
              Knowledge base
            </span>
            <h1 className="mt-3 text-5xl font-black leading-[0.95]">
              Admin <span className="bg-primary px-2">dashboard.</span>
            </h1>
            <p className="mt-3 max-w-xl font-medium text-muted-foreground">
              Manage documents, monitor indexing, and review what SAGE knows.
            </p>
          </div>
          <button className="brutal brutal-hover bg-primary px-6 py-3 text-lg font-black">
            + Upload document
          </button>
        </div>

        {/* Stats */}
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {[
            { v: "6", l: "Documents", bg: "bg-primary" },
            { v: "633", l: "Total chunks", bg: "bg-secondary" },
            { v: "1,284", l: "Queries this week", bg: "bg-accent" },
            { v: "98%", l: "Answer rate", bg: "bg-primary" },
          ].map((s) => (
            <div key={s.l} className={`brutal ${s.bg} p-5`}>
              <div className="text-3xl font-black">{s.v}</div>
              <div className="mt-1 text-xs font-black uppercase opacity-80">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Documents table */}
        <section className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-3xl font-black">Documents</h2>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documents..."
              className="brutal-sm bg-background px-3 py-2 font-bold outline-none placeholder:text-muted-foreground focus:bg-accent"
            />
          </div>

          <div className="brutal mt-4 overflow-hidden bg-background">
            <div className="grid grid-cols-12 gap-2 border-b-[3px] border-foreground bg-foreground px-4 py-3 text-xs font-black uppercase text-background">
              <div className="col-span-5">Name</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Chunks</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1 text-right">·</div>
            </div>
            {filtered.map((d) => (
              <div
                key={d.name}
                className="grid grid-cols-12 items-center gap-2 border-b-2 border-foreground px-4 py-3 last:border-b-0"
              >
                <div className="col-span-5 truncate font-bold">📄 {d.name}</div>
                <div className="col-span-2 font-medium">{d.type}</div>
                <div className="col-span-2 font-medium">{d.chunks}</div>
                <div className="col-span-2">
                  <span
                    className={`brutal-sm ${STATUS_BG[d.status]} px-2 py-0.5 text-xs font-black`}
                  >
                    {d.status}
                  </span>
                </div>
                <div className="col-span-1 text-right">
                  <button className="brutal-sm brutal-hover bg-background px-2 py-1 text-xs font-black">
                    ⋯
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-4 py-10 text-center font-bold text-muted-foreground">
                No documents match "{query}".
              </div>
            )}
          </div>
        </section>

        {/* Bottom panels */}
        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="brutal bg-secondary p-6">
            <h3 className="text-2xl font-black">Recent queries</h3>
            <ul className="mt-4 space-y-2">
              {[
                "When does the next semester begin?",
                "Hostel application process?",
                "Library opening hours?",
                "Re-evaluation form submission?",
              ].map((q) => (
                <li key={q} className="brutal-sm bg-background px-3 py-2 font-bold">
                  {q}
                </li>
              ))}
            </ul>
          </div>
          <div className="brutal bg-accent p-6">
            <h3 className="text-2xl font-black">System status</h3>
            <ul className="mt-4 space-y-3 font-bold">
              <li className="flex items-center justify-between">
                <span>Vector store</span>
                <span className="brutal-sm bg-secondary px-2 py-0.5 text-xs font-black">Healthy</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Embedding worker</span>
                <span className="brutal-sm bg-secondary px-2 py-0.5 text-xs font-black">Healthy</span>
              </li>
              <li className="flex items-center justify-between">
                <span>LLM gateway</span>
                <span className="brutal-sm bg-primary px-2 py-0.5 text-xs font-black">Degraded</span>
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}