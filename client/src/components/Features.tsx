import { Target, BookOpen, Zap, School, Lock, Gift } from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: Target,
      bg: "bg-primary",
      title: "Sourced Answers",
      desc: "Every response cites the GBU document it came from. No hallucinations.",
    },
    {
      icon: BookOpen,
      bg: "bg-secondary",
      title: "Knows the Handbook",
      desc: "Trained on syllabi, hostel rules, fee structure, academic calendar and notices.",
    },
    {
      icon: Zap,
      bg: "bg-accent",
      title: "Instant Responses",
      desc: "Skip the WhatsApp groups and senior chasing. Get answers in seconds.",
    },
    {
      icon: School,
      bg: "bg-primary",
      title: "Campus Aware",
      desc: "Library hours, mess menus, club events, exam schedules — all in one chat.",
    },
    {
      icon: Lock,
      bg: "bg-secondary",
      title: "Private by Design",
      desc: "Your queries aren't shared. Built with student privacy in mind.",
    },
    {
      icon: Gift,
      bg: "bg-accent",
      title: "Free for Students",
      desc: "Made by students for students. Always free with your GBU ID.",
    },
  ];

  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20">
      <div className="max-w-2xl">
        <h2 className="text-4xl font-black md:text-5xl">
          Why <span className="bg-secondary px-2">Mentora?</span>
        </h2>
        <p className="mt-4 text-lg font-medium text-muted-foreground">
          A campus assistant that actually knows your campus.
        </p>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className={`brutal brutal-hover ${f.bg} p-6`}>
              <div className="flex h-10 w-10 items-center justify-center border-2 border-foreground bg-background">
                <Icon size={20} strokeWidth={2.5} />
              </div>
              <h3 className="mt-3 text-xl font-black">{f.title}</h3>
              <p className="mt-2 font-medium">{f.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}