import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", enrollment: "", email: "", password: "" });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/chat");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b-[3px] border-foreground bg-background">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center bg-primary brutal-sm font-black">S</div>
            <span className="text-xl font-black">GBU SAGE</span>
          </Link>
          <Link to="/" className="brutal-sm brutal-hover bg-accent px-3 py-1.5 text-sm font-black">
            ← Home
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <span className="brutal-sm w-fit bg-primary px-3 py-1 text-xs font-black uppercase">
          Join SAGE
        </span>
        <h1 className="mt-4 text-5xl font-black leading-[0.95]">
          Create <span className="bg-secondary px-2">account.</span>
        </h1>
        <p className="mt-3 font-medium text-muted-foreground">
          Sign up with your GBU email — free for all students.
        </p>

        <form onSubmit={onSubmit} className="brutal mt-8 space-y-4 bg-background p-6">
          <div>
            <label className="text-xs font-black uppercase">Full name</label>
            <input
              required
              value={form.name}
              onChange={set("name")}
              placeholder="Aarav Sharma"
              className="brutal-sm mt-1 w-full bg-background px-3 py-2 font-bold outline-none placeholder:text-muted-foreground focus:bg-accent"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase">Enrollment ID</label>
            <input
              required
              value={form.enrollment}
              onChange={set("enrollment")}
              placeholder="GBU/2024/12345"
              className="brutal-sm mt-1 w-full bg-background px-3 py-2 font-bold outline-none placeholder:text-muted-foreground focus:bg-accent"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase">GBU email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={set("email")}
              placeholder="you@gbu.ac.in"
              className="brutal-sm mt-1 w-full bg-background px-3 py-2 font-bold outline-none placeholder:text-muted-foreground focus:bg-accent"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={set("password")}
              placeholder="At least 8 characters"
              className="brutal-sm mt-1 w-full bg-background px-3 py-2 font-bold outline-none placeholder:text-muted-foreground focus:bg-accent"
            />
          </div>
          <label className="flex items-start gap-2 text-sm font-bold">
            <input type="checkbox" required className="mt-0.5 h-4 w-4 accent-primary" />
            <span>I agree to SAGE's terms & privacy policy.</span>
          </label>
          <button
            type="submit"
            className="brutal brutal-hover w-full bg-secondary px-6 py-3 text-lg font-black"
          >
            Create account →
          </button>
        </form>

        <p className="mt-6 text-center font-bold">
          Already have one?{" "}
          <Link
            to="/login"
            className="bg-accent px-2 py-0.5 underline decoration-2 underline-offset-2"
          >
            Log in
          </Link>
        </p>
      </main>
    </div>
  );
}