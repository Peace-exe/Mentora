import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";



type Msg = { role: "user" | "assistant"; content: string; sources?: string[] };

const SUGGESTIONS = [
  "When does the next semester start?",
  "How do I apply for hostel accommodation?",
  "What clubs can I join in the School of ICT?",
  "Where is the library and what are its hours?",
];

const MOCK_REPLIES: Record<string, { content: string; sources: string[] }> = {
  default: {
    content:
      "Based on GBU's student handbook, here's what I found. (This is a demo response — connect Lovable AI to enable real RAG-powered answers.)",
    sources: ["Student Handbook 2025", "Academic Calendar"],
  },
  hostel: {
    content:
      "Hostel applications open through the GBU student portal at the start of each semester. You'll need your enrollment ID, fee receipt, and a recent photograph. Allotment is usually based on distance from home and academic year.",
    sources: ["Hostel Manual §2.1", "Student Portal FAQ"],
  },
  library: {
    content:
      "The Central Library is in the academic block, open Mon–Sat 9:00 AM – 8:00 PM. You can borrow up to 4 books for 14 days using your student ID. Digital resources (IEEE, Springer, Elsevier) are accessible 24/7 via the campus VPN.",
    sources: ["Library Handbook", "Campus Map"],
  },
  semester: {
    content:
      "The odd semester typically begins in late July; the even semester begins in early January. Exact dates are notified each year in the academic calendar published by the Dean's office.",
    sources: ["Academic Calendar 2025-26"],
  },
  clubs: {
    content:
      "The School of ICT hosts several active clubs: Coding Club (CodeChef GBU), Robotics Club, AI/ML Society, and the Open Source Cell. Most clubs run weekly meetings and host inter-college hackathons.",
    sources: ["Student Activities Brochure"],
  },
};

function pickReply(q: string) {
  const s = q.toLowerCase();
  if (s.includes("hostel")) return MOCK_REPLIES.hostel;
  if (s.includes("library")) return MOCK_REPLIES.library;
  if (s.includes("semester") || s.includes("calendar")) return MOCK_REPLIES.semester;
  if (s.includes("club") || s.includes("society")) return MOCK_REPLIES.clubs;
  return MOCK_REPLIES.default;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q) return;
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      const reply = pickReply(q);
      setMessages((m) => [...m, { role: "assistant", content: reply.content, sources: reply.sources }]);
      setThinking(false);
    }, 900);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b-[3px] border-foreground bg-background">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center bg-primary brutal-sm font-black">S</div>
            <span className="text-xl font-black">GBU SAGE</span>
          </Link>
          <Link to="/" className="brutal-sm brutal-hover bg-accent px-3 py-1.5 text-sm font-black">← Home</Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-6">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pb-4">
          {messages.length === 0 && (
            <div className="brutal bg-accent p-6">
              <h1 className="text-3xl font-black">Hey, I'm SAGE 👋</h1>
              <p className="mt-2 font-medium">
                Your AI study buddy for Gautam Buddha University. Ask me anything — courses, hostels, exams, clubs, library, fees.
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="brutal-sm brutal-hover bg-background p-3 text-left text-sm font-bold"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-xs font-bold uppercase opacity-70">
                Demo mode · responses are mocked
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={`max-w-[85%] brutal p-4 ${
                  m.role === "user" ? "bg-primary" : "bg-secondary"
                }`}
              >
                <div className="text-xs font-black uppercase opacity-70">
                  {m.role === "user" ? "You" : "SAGE"}
                </div>
                <p className="mt-1 whitespace-pre-wrap font-medium">{m.content}</p>
                {m.sources && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.sources.map((src) => (
                      <span key={src} className="brutal-sm bg-background px-2 py-1 text-xs font-bold">
                        📄 {src}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {thinking && (
            <div className="flex justify-start">
              <div className="brutal bg-secondary p-4">
                <div className="text-xs font-black uppercase opacity-70">SAGE</div>
                <div className="mt-2 flex gap-1">
                  <span className="h-2 w-2 animate-bounce bg-foreground" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce bg-foreground" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce bg-foreground" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="brutal sticky bottom-4 flex gap-2 bg-background p-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask SAGE anything about GBU..."
            className="flex-1 bg-transparent px-3 py-2 font-bold outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            className="brutal-sm brutal-hover bg-primary px-4 py-2 font-black"
            disabled={thinking}
          >
            Send
          </button>
        </form>
      </main>
    </div>
  );
}