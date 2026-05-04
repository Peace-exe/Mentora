import { Link } from "react-router-dom";
import {motion} from 'framer-motion';
import { RoughShadow } from "./RoughShadow";
export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
        <div className="flex flex-col justify-center">
          <span className="brutal-sm w-fit bg-accent px-3 py-1 text-xs font-black uppercase">
            For Gautam Buddha University
          </span>
          <h1 className="mt-5 text-5xl font-black leading-[0.95] md:text-7xl">
  <span className="relative z-10">Your campus.</span><br />
  <span className="relative inline-block px-2">
    <motion.span
      className="highlight absolute inset-0  -z-10 rounded-sm"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
      style={{ transformOrigin: "left center" }}
    />

    Answered.
  </span>
</h1>
          <p className="mt-6 max-w-lg text-lg font-medium text-muted-foreground">
            Mentora is a RAG-powered AI assistant that reads GBU's official handbooks,
            calendars and notices — so you don't have to. Ask anything, get sourced answers in seconds.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <RoughShadow offset={5} roughness={0.5} hachureGap={3}  >
            <Link
              to="/chat"
              className="border-foreground border-[3px]  bg-primary px-6 py-3 text-lg font-black"
            >
              Try the Chatbot →
            </Link>
            </RoughShadow>
            <RoughShadow offset={5} roughness={0.5} hachureGap={3}  >
            <a
              href="#how"
              className="border-foreground border-[3px] bg-background px-6 py-3 text-lg font-black"
            >
              How it works
            </a>
            </RoughShadow>
          </div>
          <div className="mt-6 flex items-center gap-3 text-sm font-bold">
            <div className="flex -space-x-2 overflow-hidden">
              {["bg-primary", "bg-secondary", "bg-accent"].map((c) => (
                <div key={c} className={`h-8 w-8 rounded-full border-[3px] border-foreground ${c}`} />
              ))}
            </div>
            <span>Built by students, for GBU students</span>
          </div>
        </div>

        <div className="relative">
          <div className="brutal-lg rotate-1 bg-background p-5">
            <div className="flex items-center gap-2 border-b-2 border-foreground pb-3">
              <div className="h-3 w-3 rounded-full bg-primary border-2 border-foreground" />
              <div className="h-3 w-3 rounded-full bg-accent border-2 border-foreground" />
              <div className="h-3 w-3 rounded-full bg-secondary border-2 border-foreground" />
              <span className="ml-2 text-xs font-black uppercase">Mentora · live</span>
            </div>
            <div className="mt-4 space-y-3">
              <div className="brutal-sm bg-primary p-3">
                <div className="text-[10px] font-black uppercase opacity-70">You</div>
                <p className="font-bold">When does the next semester begin?</p>
              </div>
              <div className="brutal-sm bg-secondary p-3">
                <div className="text-[10px] font-black uppercase opacity-70">Mentora</div>
                <p className="font-medium">
                  The odd semester begins late July. Exact dates are published in the academic calendar by the Dean's office.
                </p>
                <div className="mt-2 flex gap-1">
                  <span className="brutal-sm bg-background px-2 py-0.5 text-[10px] font-black">📄 Academic Calendar</span>
                </div>
              </div>
              <div className="brutal-sm bg-accent p-3">
                <div className="text-[10px] font-black uppercase opacity-70">You</div>
                <p className="font-bold">Hostel application process?</p>
              </div>
            </div>
          </div>
          <div className="brutal absolute -bottom-6 -left-6 -rotate-3 bg-accent px-4 py-2 font-black">
            ⚡ Sourced answers
          </div>
        </div>
      </div>
    </section>
  );
}