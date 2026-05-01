export default function Stats() {
  const items = [
    { v: "10k+", l: "Pages indexed" },
    { v: "<2s", l: "Avg. response" },
    { v: "24/7", l: "Always on" },
    { v: "100%", l: "Sourced" },
  ];
  return (
    <section className="border-y-[3px] border-foreground bg-foreground text-background">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-background/20 md:grid-cols-4">
        {items.map((i) => (
          <div key={i.l} className="bg-foreground p-6 text-center">
            <div className="text-4xl font-black">{i.v}</div>
            <div className="mt-1 text-xs font-bold uppercase opacity-70">{i.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}