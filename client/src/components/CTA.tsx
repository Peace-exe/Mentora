import {Link} from 'react-router-dom';
export default function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="brutal-lg bg-primary p-10 text-center md:p-16">
        <h2 className="text-4xl font-black md:text-6xl">
          Stop guessing.<br />Start asking.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg font-medium">
          Try SAGE now — no signup, no setup. Just answers.
        </p>
        <Link
          to="/chat"
          className="brutal brutal-hover mt-8 inline-block bg-background px-8 py-4 text-xl font-black"
        >
          Open Chatbot →
        </Link>
      </div>
    </section>
  );
}
