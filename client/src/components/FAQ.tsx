export default function FAQ() {
  const items = [
    {
      q: "Is SAGE official?",
      a: "No — SAGE is a student-built tool. It uses publicly available GBU documents to help students navigate university life.",
    },
    {
      q: "What is RAG?",
      a: "Retrieval-Augmented Generation. SAGE retrieves relevant chunks from GBU documents, then generates an answer grounded in them. That's why every reply has sources.",
    },
    {
      q: "Will it replace my mentor?",
      a: "Nope. SAGE handles routine questions instantly so mentors and seniors can focus on the things that actually need a human.",
    },
    {
      q: "What can I ask?",
      a: "Anything from 'when do exams start' to 'where do I submit a re-evaluation form' to 'which clubs are active in ICT'.",
    },
  ];
  return (
    <section id="faq" className="mx-auto max-w-4xl px-4 py-20">
      <h2 className="text-4xl font-black md:text-5xl">
        Frequently <span className="bg-accent px-2">asked</span>
      </h2>
      <div className="mt-10 space-y-4">
        {items.map((i) => (
          <details key={i.q} className="brutal group bg-background p-5">
            <summary className="flex cursor-pointer items-center justify-between font-black text-lg">
              {i.q}
              <span className="brutal-sm flex h-8 w-8 items-center justify-center bg-primary group-open:rotate-45 transition-transform">
                +
              </span>
            </summary>
            <p className="mt-3 font-medium text-muted-foreground">{i.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}