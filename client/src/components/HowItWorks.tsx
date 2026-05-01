export default function HowItWorks() {
  const steps = [
    { n: "01", t: "Ask", d: "Type any question — about courses, hostels, exams, anything." },
    { n: "02", t: "Retrieve", d: "SAGE searches GBU's indexed documents using vector embeddings." },
    { n: "03", t: "Answer", d: "You get a clear, sourced response. Click any source to verify." },
  ];
  return (
    <section id="how" className="bg-foreground text-background">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-4xl font-black md:text-5xl">How it works</h2>
        <p className="mt-3 max-w-2xl text-lg font-medium opacity-80">
          Retrieval-Augmented Generation, in plain English.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="brutal bg-background p-6 text-foreground">
              <div className="text-5xl font-black text-primary">{s.n}</div>
              <h3 className="mt-3 text-2xl font-black">{s.t}</h3>
              <p className="mt-2 font-medium">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}