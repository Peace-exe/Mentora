import { Link } from "react-router-dom";
import { Nav } from "../components/Nav";
import  Footer  from "../components/Footer";
import FAQ from '../components/FAQ';
import Features from '../components/Features';
import Hero from '../components/Hero';
import Stats from '../components/Stats';
import HowItWorks from '../components/HowItWorks';
import CTA from '../components/CTA';


export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Nav />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}