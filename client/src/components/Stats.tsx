

import { motion } from "framer-motion";

function Text3DFlip({ text, className = "" }: { text: string; className?: string }) {
  return (
    <motion.span
      className={`inline-flex cursor-default ${className}`}
      style={{ perspective: "500px" }}
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      {text.split("").map((char, i) => (
        <span
          key={i}
          className="relative inline-block"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* front */}
          <motion.span
            className="inline-block"
            variants={{
              rest:  { rotateX: 0,   opacity: 1, transition: { delay: i * 0.04, duration: 0.35, ease: "easeIn" } },
              hover: { rotateX: -90, opacity: 0, transition: { delay: i * 0.04, duration: 0.35, ease: "easeIn" } },
            }}
            style={{ display: "inline-block", transformOrigin: "top center" }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
          {/* back */}
          <motion.span
            className="absolute inset-0 inline-block"
            variants={{
              rest:  { rotateX: 90,  opacity: 0, transition: { delay: i * 0.04, duration: 0.35, ease: "easeOut" } },
              hover: { rotateX: 0,   opacity: 1, transition: { delay: i * 0.04, duration: 0.35, ease: "easeOut" } },
            }}
            style={{ display: "inline-block", transformOrigin: "bottom center" }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

export default function Stats() {
  const items = [
    { v: "10k+", l: "Pages indexed" },
    { v: "<2s",  l: "Avg. response" },
    { v: "24/7", l: "Always on" },
    { v: "100%", l: "Sourced" },
  ];

  return (
    <section className="border-y-[3px] border-foreground bg-foreground text-background">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-background/20 md:grid-cols-4">
        {items.map((i) => (
          <div key={i.l} className="bg-foreground p-6 text-center">
            <div className="text-4xl font-black overflow-hidden" style={{ perspective: "500px" }}>
              <Text3DFlip text={i.v} />
            </div>
            <div className="mt-1 text-xs font-bold uppercase opacity-70 overflow-hidden">
              <Text3DFlip text={i.l} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}