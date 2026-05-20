import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import Services from "@/components/Services";
import Portfolio from "@/components/Portfolio";
import WhyUs from "@/components/WhyUs";
import Process from "@/components/Process";
import Reviews from "@/components/Reviews";
import FAQ from "@/components/FAQ";
import QuoteForm from "@/components/QuoteForm";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import FloatingButtons from "@/components/FloatingButtons";
import BlogSection from "@/components/BlogSection";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <TrustBar />
      <Services />
      <Portfolio />
      <WhyUs />
      <Process />
      <Reviews />
      <BlogSection />
      <FAQ />
      <QuoteForm />
      <CTA />
      <Footer />
      <FloatingButtons />
    </main>
  );
}
