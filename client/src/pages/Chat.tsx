import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../store/userStore";
import remarkGfm from "remark-gfm";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const WS_BASE = import.meta.env.VITE_WS_URL ?? "ws://localhost:8000";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "When does the next semester start?",
  "How do I apply for hostel accommodation?",
  "What clubs can I join in the School of ICT?",
  "Where is the library and what are its hours?",
];

export default function ChatPage() {
  const navigate = useNavigate();
  const { user, isLoggedIn, wsToken, setWsToken, clearUser } = useUserStore();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [wsReady, setWsReady] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // ── Logout handler ──────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE}/auth/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout API failed", err);
    } finally {
      wsRef.current?.close(); // clean WS
      clearUser();            // clear store
      navigate("/login");     // redirect
    }
  };

  // ── Auth guard ──────────────────────────────────────────────
  useEffect(() => {
    if (!user || !isLoggedIn()) {
      clearUser();
      navigate("/login");
    }
  }, []);

  // ── WS token + WebSocket setup ──────────────────────────────
  useEffect(() => {
    if (!user || !isLoggedIn()) return;

    const connectWs = (token: string) => {
      const ws = new WebSocket(`${WS_BASE}/retrieval/query?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => setWsReady(true);

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);

        if (!data.success) {
          setMessages((m) => [
            ...m,
            { role: "assistant", content: `⚠ ${data.error}` },
          ]);
          setThinking(false);
          return;
        }

        if (data.done) {
          setThinking(false);
          return;
        }

        setMessages((m) => {
          const last = m[m.length - 1];
          if (last?.role === "assistant") {
            return [
              ...m.slice(0, -1),
              { ...last, content: last.content + data.token },
            ];
          }
          return [...m, { role: "assistant", content: data.token }];
        });
      };

      ws.onerror = () => {
        setWsReady(false);
        setThinking(false);
      };

      ws.onclose = async () => {
        setWsReady(false);
        try {
          const { data } = await axios.get(`${API_BASE}/auth/ws-token`, {
            withCredentials: true,
          });
          setWsToken(data.ws_token);
        } catch {
          clearUser();
          navigate("/login");
        }
      };
    };

    const init = async () => {
      if (wsToken) {
        connectWs(wsToken);
      } else {
        try {
          const { data } = await axios.get(`${API_BASE}/auth/ws-token`, {
            withCredentials: true,
          });
          setWsToken(data.ws_token);
          connectWs(data.ws_token);
        } catch {
          clearUser();
          navigate("/login");
        }
      }
    };

    init();

    return () => wsRef.current?.close();
  }, [wsToken]);

  // ── Auto scroll ─────────────────────────────────────────────
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q || !wsReady || thinking) return;

    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setThinking(true);
    wsRef.current?.send(JSON.stringify({ query: q }));
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b-[3px] border-foreground bg-background">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center bg-primary brutal-sm font-black">
              M
            </div>
            <span className="text-xl font-black">MENTORA</span>
          </Link>

          <div className="flex items-center gap-2">
            <span
              className={`brutal-sm px-2 py-1 text-xs font-black ${
                wsReady ? "bg-green-300" : "bg-primary"
              }`}
            >
              {wsReady ? "● Connected" : "● Connecting..."}
            </span>

            {user?.role === "admin" && (
              <Link
                to="/admin"
                className="brutal-sm brutal-hover bg-yellow-300 px-3 py-1.5 text-sm font-black"
              >
                ⚙ Admin
              </Link>
            )}

            <Link
              to="/"
              className="brutal-sm brutal-hover bg-accent px-3 py-1.5 text-sm font-black"
            >
              ← Home
            </Link>

            <button
              onClick={handleLogout}
              className="brutal-sm brutal-hover bg-red-400 px-3 py-1.5 text-sm font-black"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-6">
        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto pb-4"
        >
          {messages.length === 0 && (
            <div className="brutal bg-accent p-6">
              <h1 className="text-3xl font-black">
                Hey, I'm Mentora 👋
              </h1>
              <p className="mt-2 font-medium">
                Your AI guide for Gautam Buddha University. Ask me anything —
                courses, hostels, exams, clubs, library, fees.
              </p>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="brutal-sm brutal-hover bg-background p-3 text-left text-sm font-bold"
                  >
                    {s}
                  </button>
                ))}
              </div>

              {!wsReady && (
                <p className="mt-4 text-xs font-bold uppercase opacity-70">
                  ⏳ Connecting to Mentora AI...
                </p>
              )}
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "flex justify-end"
                  : "flex justify-start"
              }
            >
              <div
                className={`max-w-[85%] brutal p-4 ${
                  m.role === "user"
                    ? "bg-primary"
                    : "bg-secondary"
                }`}
              >
                <div className="text-xs font-black uppercase opacity-70">
                  {m.role === "user" ? "You" : "Mentora"}
                </div>

                <div className="mt-1 font-medium">
                  {m.role === "user" ? (
                    <p className="whitespace-pre-wrap">
                      {m.content}
                    </p>
                  ) : (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {thinking && (
            <div className="flex justify-start">
              <div className="brutal bg-secondary p-4">
                <div className="text-xs font-black uppercase opacity-70">
                  Mentora
                </div>
                <div className="mt-2 flex gap-1">
                  <span
                    className="h-2 w-2 animate-bounce bg-foreground"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="h-2 w-2 animate-bounce bg-foreground"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="h-2 w-2 animate-bounce bg-foreground"
                    style={{ animationDelay: "300ms" }}
                  />
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
            placeholder={
              wsReady
                ? "Ask Mentora anything about GBU..."
                : "Connecting..."
            }
            disabled={!wsReady}
            className="flex-1 bg-transparent px-3 py-2 font-bold outline-none placeholder:text-muted-foreground disabled:opacity-50"
          />

          <button
            type="submit"
            className="brutal-sm brutal-hover bg-primary px-4 py-2 font-black disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={thinking || !wsReady}
          >
            Send
          </button>
        </form>
      </main>
    </div>
  );
}