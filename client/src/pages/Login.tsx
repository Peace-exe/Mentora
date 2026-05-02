import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useUserStore((s) => s.setUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail ?? "Something went wrong.");
        return;
      }

      if (data.success) {
        setUser(data.data, data.expires_at);
        navigate("/chat");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b-[3px] border-foreground bg-background">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center bg-primary brutal-sm font-black">M</div>
            <span className="text-xl font-black">Mentora</span>
          </Link>
          <Link to="/" className="brutal-sm brutal-hover bg-accent px-3 py-1.5 text-sm font-black">
            ← Home
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <span className="brutal-sm w-fit bg-accent px-3 py-1 text-xs font-black uppercase">
          Welcome back
        </span>
        <h1 className="mt-4 text-5xl font-black leading-[0.95]">
          Log <span className="bg-primary px-2">in.</span>
        </h1>
        <p className="mt-3 font-medium text-muted-foreground">
          Sign in with your GBU credentials to continue chatting with Mentora.
        </p>

        <form onSubmit={onSubmit} className="brutal mt-8 space-y-4 bg-background p-6">
          <div>
            <label className="text-xs font-black uppercase">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@gbu.ac.in"
              className="brutal-sm mt-1 w-full bg-background px-3 py-2 font-bold outline-none placeholder:text-muted-foreground focus:bg-accent"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="brutal-sm mt-1 w-full bg-background px-3 py-2 font-bold outline-none placeholder:text-muted-foreground focus:bg-accent"
            />
          </div>
          <div className="flex items-center justify-between text-sm font-bold">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 accent-primary" />
              Remember me
            </label>
            <a href="#" className="underline decoration-2 underline-offset-2 hover:bg-accent">
              Forgot?
            </a>
          </div>

          {error && (
            <div className="brutal-sm bg-primary px-3 py-2 text-sm font-black">
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="brutal brutal-hover w-full bg-primary px-6 py-3 text-lg font-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Log in →"}
          </button>
        </form>

        <p className="mt-6 text-center font-bold">
          New to Mentora?{" "}
          <Link
            to="/signup"
            className="bg-secondary px-2 py-0.5 underline decoration-2 underline-offset-2"
          >
            Create an account
          </Link>
        </p>
      </main>
    </div>
  );
}