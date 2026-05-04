import axios from "axios";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useUserStore } from "../store/userStore";

const MAX_ROWS = 8;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE as string,
  withCredentials: true,
});

type Doc = {
  id: string;
  name: string;
  category: string;
  mongoId: string;
  chunks: number;
  vectors: number;
  status: "Indexed" | "Processing" | "Failed";
};

const INITIAL_DOCS: Doc[] = [
  { id: crypto.randomUUID(), name: "Student Handbook 2025.pdf", category: "admission", mongoId: "683a1f2e4b0c9d001e2f3a10", chunks: 412, vectors: 1648, status: "Indexed" },
  { id: crypto.randomUUID(), name: "Academic Calendar 2025-26.pdf", category: "administration", mongoId: "683a1f2e4b0c9d001e2f3a11", chunks: 38, vectors: 152, status: "Indexed" },
  { id: crypto.randomUUID(), name: "Hostel Manual.pdf", category: "hostel", mongoId: "683a1f2e4b0c9d001e2f3a12", chunks: 96, vectors: 384, status: "Indexed" },
  { id: crypto.randomUUID(), name: "Fee Structure 2025.xlsx", category: "administration", mongoId: "683a1f2e4b0c9d001e2f3a13", chunks: 27, vectors: 0, status: "Processing" },
  { id: crypto.randomUUID(), name: "Library Handbook.pdf", category: "administration", mongoId: "683a1f2e4b0c9d001e2f3a14", chunks: 54, vectors: 216, status: "Indexed" },
  { id: crypto.randomUUID(), name: "Exam Notice March.pdf", category: "examination", mongoId: "683a1f2e4b0c9d001e2f3a15", chunks: 6, vectors: 0, status: "Failed" },
];

const CATEGORIES = ["admission", "hostel", "mess", "administration", "ICT", "examination"];

const TEXT_CATEGORIES = ["admission", "examination", "mess", "hostel", "ict"] as const;
const SOURCES = ["gbu website", "notice"] as const;
const LANGS = [
  { value: "en", label: "English (en)" },
  { value: "hin", label: "Hindi (hin)" },
] as const;

const STATUS_BG: Record<Doc["status"], string> = {
  Indexed: "bg-secondary",
  Processing: "bg-accent",
  Failed: "bg-primary",
};

function truncateId(id: string) {
  return id.length > 10 ? `${id.slice(0, 8)}…` : id;
}

export default function AdminPage() {
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState<Doc[]>(INITIAL_DOCS);
  const clearUser = useUserStore((s) => s.clearUser);

  // --- upload document dialog ---
  const [dialogOpen, setDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("");
  const [infoId, setInfoId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const optimisticIdRef = useRef<string | null>(null);

  // --- upload info manually dialog ---
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [infoText, setInfoText] = useState("");
  const [infoInfoId, setInfoInfoId] = useState("");
  const [infoCategory, setInfoCategory] = useState("");
  const [infoCategoryCustom, setInfoCategoryCustom] = useState("");
  const [infoSource, setInfoSource] = useState("");
  const [infoSourceCustom, setInfoSourceCustom] = useState("");
  const [infoLang, setInfoLang] = useState("en");
  const [infoUploading, setInfoUploading] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);

  const filtered = docs.filter((d) =>
    d.name.toLowerCase().includes(query.toLowerCase())
  );

  function addDoc(doc: Doc) {
    setDocs((prev) => [doc, ...prev].slice(0, MAX_ROWS));
  }

  function patchDoc(id: string, patch: Partial<Doc>) {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  // --- upload document handlers ---
  function openDialog() {
    setFile(null);
    setCategory("");
    setInfoId("");
    setError(null);
    setDialogOpen(true);
  }

  function closeDialog() {
    if (uploading) return;
    setDialogOpen(false);
  }

  async function handleUpload() {
    if (!file || !category || !infoId.trim()) {
      setError("All fields are required.");
      return;
    }

    setError(null);
    setUploading(true);

    const rowId = crypto.randomUUID();
    optimisticIdRef.current = rowId;

    addDoc({ id: rowId, name: file.name, category, mongoId: "—", chunks: 0, vectors: 0, status: "Processing" });
    setDialogOpen(false);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("infoId", infoId.trim());
      form.append("category", category);

      const { data } = await api.post("/injestion/storeNotice", form);
      const rawId = data.mongoId;
      const mongoId = Array.isArray(rawId) ? rawId[0] : rawId;

      patchDoc(rowId, { mongoId: mongoId ?? "—", chunks: data.totalChunks, vectors: data.totalVectors, status: "Indexed" });
    } catch (err: unknown) {
      patchDoc(rowId, { status: "Failed" });
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.detail ?? `Upload failed (${err.response?.status ?? "network error"})`)
        : "Upload failed.";
      setError(message);
    } finally {
      setUploading(false);
      optimisticIdRef.current = null;
    }
  }

  // --- upload info manually handlers ---
  function openInfoDialog() {
    setInfoText("");
    setInfoInfoId("");
    setInfoCategory("");
    setInfoCategoryCustom("");
    setInfoSource("");
    setInfoSourceCustom("");
    setInfoLang("en");
    setInfoError(null);
    setInfoDialogOpen(true);
  }

  function closeInfoDialog() {
    if (infoUploading) return;
    setInfoDialogOpen(false);
  }

  async function handleInfoUpsert() {
    const resolvedCategory = infoCategory === "other" ? infoCategoryCustom.trim() : infoCategory;
    const resolvedSource = infoSource === "other" ? infoSourceCustom.trim() : infoSource;

    if (!infoText.trim())       { setInfoError("Info content is required.");  return; }
    if (!infoInfoId.trim())     { setInfoError("Info ID is required.");        return; }
    if (!resolvedCategory)      { setInfoError("Category is required.");       return; }
    if (!resolvedSource)        { setInfoError("Source is required.");         return; }

    setInfoError(null);
    setInfoUploading(true);

    const rowId = crypto.randomUUID();
    optimisticIdRef.current = rowId;

    addDoc({
      id: rowId,
      name: `[Text] ${infoInfoId.trim()}`,
      category: resolvedCategory,
      mongoId: "—",
      chunks: 0,
      vectors: 0,
      status: "Processing",
    });

    setInfoDialogOpen(false);

    try {
      const { data } = await api.post("/injestion/upsertInfo", {
        info: infoText.trim(),
        infoId: infoInfoId.trim(),
        category: resolvedCategory,
        source: resolvedSource,
        lang: infoLang,
      });

      const rawId = data.mongoId;
      const mongoId = Array.isArray(rawId) ? rawId[0] : rawId;

      patchDoc(rowId, {
        mongoId: mongoId ?? "—",
        chunks: data.totalChunks,
        vectors: data.totalVectors,
        status: "Indexed",
      });
    } catch (err: unknown) {
      patchDoc(rowId, { status: "Failed" });
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.detail ?? `Upsert failed (${err.response?.status ?? "network error"})`)
        : "Upsert failed.";
      setInfoError(message);
    } finally {
      setInfoUploading(false);
      optimisticIdRef.current = null;
    }
  }

  return (
    <div className="flex min-h-screen flex-col">

      {/* ── backdrop ── */}
      {(dialogOpen || infoDialogOpen) && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40"
          onClick={dialogOpen ? closeDialog : closeInfoDialog}
        />
      )}

      {/* ── upload document dialog ── */}
      {dialogOpen && (
        <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 brutal bg-background p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black">Upload document</h2>
            <button onClick={closeDialog} className="brutal-sm brutal-hover bg-background px-2 py-1 text-sm font-black">✕</button>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase">
                File <span className="text-primary">*</span>
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`brutal-sm cursor-pointer border-2 border-dashed border-foreground px-4 py-5 text-center font-bold transition-colors hover:bg-accent ${file ? "bg-secondary" : "bg-background"}`}
              >
                {file
                  ? <span className="text-sm">📄 {file.name}</span>
                  : <span className="text-sm text-muted-foreground">Click to select · PDF, JPG, JPEG, PNG</span>
                }
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-black uppercase">
                Category <span className="text-primary">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="brutal-sm w-full bg-background px-3 py-2 font-bold outline-none focus:bg-accent capitalize"
              >
                <option value="" disabled>Select a category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-black uppercase">
                Info ID <span className="text-primary">*</span>
              </label>
              <input
                value={infoId}
                onChange={(e) => setInfoId(e.target.value)}
                placeholder="e.g. hostel_notice_2025"
                className="brutal-sm w-full bg-background px-3 py-2 font-bold outline-none placeholder:text-muted-foreground focus:bg-accent"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Multi-page files get <code>_p1</code>, <code>_p2</code>… appended automatically.
              </p>
            </div>

            {error && (
              <div className="brutal-sm bg-primary px-3 py-2 text-sm font-bold">⚠ {error}</div>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={closeDialog} className="brutal-sm brutal-hover flex-1 bg-background px-4 py-2 font-black">Cancel</button>
              <button onClick={handleUpload} disabled={uploading} className="brutal brutal-hover flex-1 bg-primary px-4 py-2 font-black disabled:opacity-50">
                {uploading ? "Uploading…" : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── upload info manually dialog ── */}
      {infoDialogOpen && (
        <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 brutal bg-background p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black">Upload info manually</h2>
            <button onClick={closeInfoDialog} className="brutal-sm brutal-hover bg-background px-2 py-1 text-sm font-black">✕</button>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {/* info */}
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase">
                Info <span className="text-primary">*</span>
              </label>
              <textarea
                value={infoText}
                onChange={(e) => setInfoText(e.target.value)}
                placeholder="Paste the full text content to ingest…"
                rows={5}
                className="brutal-sm w-full resize-y bg-background px-3 py-2 font-bold outline-none placeholder:text-muted-foreground focus:bg-accent"
              />
            </div>

            {/* infoId */}
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase">
                Info ID <span className="text-primary">*</span>
              </label>
              <input
                value={infoInfoId}
                onChange={(e) => setInfoInfoId(e.target.value)}
                placeholder="e.g. hostel_rules_2025"
                className="brutal-sm w-full bg-background px-3 py-2 font-bold outline-none placeholder:text-muted-foreground focus:bg-accent"
              />
            </div>

            {/* category */}
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase">
                Category <span className="text-primary">*</span>
              </label>
              <select
                value={infoCategory}
                onChange={(e) => { setInfoCategory(e.target.value); setInfoCategoryCustom(""); }}
                className="brutal-sm w-full bg-background px-3 py-2 font-bold outline-none focus:bg-accent capitalize"
              >
                <option value="" disabled>Select a category</option>
                {TEXT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value="other">other — type below</option>
              </select>
              {infoCategory === "other" && (
                <input
                  value={infoCategoryCustom}
                  onChange={(e) => setInfoCategoryCustom(e.target.value)}
                  placeholder="Enter custom category"
                  className="brutal-sm mt-2 w-full bg-background px-3 py-2 font-bold outline-none placeholder:text-muted-foreground focus:bg-accent"
                />
              )}
            </div>

            {/* source */}
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase">
                Source <span className="text-primary">*</span>
              </label>
              <select
                value={infoSource}
                onChange={(e) => { setInfoSource(e.target.value); setInfoSourceCustom(""); }}
                className="brutal-sm w-full bg-background px-3 py-2 font-bold outline-none focus:bg-accent capitalize"
              >
                <option value="" disabled>Select a source</option>
                {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                <option value="other">other — type below</option>
              </select>
              {infoSource === "other" && (
                <input
                  value={infoSourceCustom}
                  onChange={(e) => setInfoSourceCustom(e.target.value)}
                  placeholder="Enter custom source"
                  className="brutal-sm mt-2 w-full bg-background px-3 py-2 font-bold outline-none placeholder:text-muted-foreground focus:bg-accent"
                />
              )}
            </div>

            {/* lang */}
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase">
                Language <span className="text-primary">*</span>
              </label>
              <select
                value={infoLang}
                onChange={(e) => setInfoLang(e.target.value)}
                className="brutal-sm w-full bg-background px-3 py-2 font-bold outline-none focus:bg-accent"
              >
                {LANGS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>

            {infoError && (
              <div className="brutal-sm bg-primary px-3 py-2 text-sm font-bold">⚠ {infoError}</div>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={closeInfoDialog} className="brutal-sm brutal-hover flex-1 bg-background px-4 py-2 font-black">Cancel</button>
              <button onClick={handleInfoUpsert} disabled={infoUploading} className="brutal brutal-hover flex-1 bg-primary px-4 py-2 font-black disabled:opacity-50">
                {infoUploading ? "Uploading…" : "Upload info"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── header ── */}
      <header className="border-b-[3px] border-foreground bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center bg-primary brutal-sm font-black">M</div>
            <span className="text-xl font-black">Mentora</span>
            <span className="brutal-sm ml-2 bg-foreground px-2 py-0.5 text-xs font-black uppercase text-background">Admin</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/chat" className="brutal-sm brutal-hover bg-accent px-3 py-1.5 text-sm font-black">Chat</Link>
            <button onClick={clearUser} className="brutal-sm brutal-hover bg-background px-3 py-1.5 text-sm font-black">Sign out</button>
          </div>
        </div>
      </header>

      {/* ── main ── */}
      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="brutal-sm w-fit bg-accent px-3 py-1 text-xs font-black uppercase">Knowledge base</span>
            <h1 className="mt-3 text-5xl font-black leading-[0.95]">
              Admin <span className="bg-primary px-2">dashboard.</span>
            </h1>
            <p className="mt-3 max-w-xl font-medium text-muted-foreground">
              Manage documents, monitor indexing, and review what Mentora knows.
            </p>
          </div>

          {/* ── action buttons ── */}
          <div className="flex items-center gap-3">
            <button onClick={openInfoDialog} className="brutal brutal-hover bg-accent px-6 py-3 text-lg font-black">
              + Upload info manually
            </button>
            <button onClick={openDialog} className="brutal brutal-hover bg-primary px-6 py-3 text-lg font-black">
              + Upload document
            </button>
          </div>
        </div>

        {/* ── stat cards ── */}
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {[
            { v: String(docs.length), l: "Documents", bg: "bg-primary" },
            { v: docs.reduce((a, d) => a + d.chunks, 0).toLocaleString(), l: "Total chunks", bg: "bg-secondary" },
            { v: docs.reduce((a, d) => a + d.vectors, 0).toLocaleString(), l: "Total vectors", bg: "bg-accent" },
            { v: `${docs.filter((d) => d.status === "Indexed").length}/${docs.length}`, l: "Indexed", bg: "bg-primary" },
          ].map((s) => (
            <div key={s.l} className={`brutal ${s.bg} p-5`}>
              <div className="text-3xl font-black">{s.v}</div>
              <div className="mt-1 text-xs font-black uppercase opacity-80">{s.l}</div>
            </div>
          ))}
        </div>

        {/* ── documents table ── */}
        <section className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-3xl font-black">
              Documents
              <span className="ml-3 text-base font-medium text-muted-foreground">{docs.length}/{MAX_ROWS}</span>
            </h2>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documents..."
              className="brutal-sm bg-background px-3 py-2 font-bold outline-none placeholder:text-muted-foreground focus:bg-accent"
            />
          </div>

          <div className="brutal mt-4 overflow-hidden bg-background">
            <div className="grid grid-cols-12 gap-2 border-b-[3px] border-foreground bg-foreground px-4 py-3 text-xs font-black uppercase text-background">
              <div className="col-span-4">File name</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Mongo ID</div>
              <div className="col-span-1 text-right">Chunks</div>
              <div className="col-span-1 text-right">Vectors</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1 text-right">·</div>
            </div>

            {filtered.map((d) => (
              <div key={d.id} className="grid grid-cols-12 items-center gap-2 border-b-2 border-foreground px-4 py-3 last:border-b-0">
                <div className="col-span-4 truncate font-bold" title={d.name}>📄 {d.name}</div>
                <div className="col-span-2 font-medium capitalize truncate">{d.category}</div>
                <div className="col-span-2 font-mono text-xs text-muted-foreground truncate cursor-default" title={d.mongoId}>
                  {d.mongoId === "—" ? "—" : truncateId(d.mongoId)}
                </div>
                <div className="col-span-1 text-right font-medium tabular-nums">
                  {d.status === "Processing" ? "—" : d.chunks.toLocaleString()}
                </div>
                <div className="col-span-1 text-right font-medium tabular-nums">
                  {d.status === "Processing" ? "—" : d.vectors.toLocaleString()}
                </div>
                <div className="col-span-1">
                  <span className={`brutal-sm ${STATUS_BG[d.status]} px-2 py-0.5 text-xs font-black`}>
                    {d.status}
                  </span>
                </div>
                <div className="col-span-1 text-right">
                  <button className="brutal-sm brutal-hover bg-background px-2 py-1 text-xs font-black">⋯</button>
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

        {/* ── bottom panels ── */}
        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="brutal bg-secondary p-6">
            <h3 className="text-2xl font-black">Recent queries</h3>
            <ul className="mt-4 space-y-2">
              {["When does the next semester begin?", "Hostel application process?", "Library opening hours?", "Re-evaluation form submission?"].map((q) => (
                <li key={q} className="brutal-sm bg-background px-3 py-2 font-bold">{q}</li>
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