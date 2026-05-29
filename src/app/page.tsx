import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import Services from "@/components/Services";
import Portfolio from "@/components/Portfolio";
import WhyUs from "@/components/WhyUs";

// Below-the-fold components — lazy loaded to reduce initial JS bundle
const Process      = dynamic(() => import("@/components/Process"));
const Reviews      = dynamic(() => import("@/components/Reviews"));
const BlogSection  = dynamic(() => import("@/components/BlogSection"));
const FAQ          = dynamic(() => import("@/components/FAQ"));
const QuoteForm    = dynamic(() => import("@/components/QuoteForm"));
const CTA          = dynamic(() => import("@/components/CTA"));
const Footer       = dynamic(() => import("@/components/Footer"));
const FloatingButtons = dynamic(() => import("@/components/FloatingButtons"));

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
