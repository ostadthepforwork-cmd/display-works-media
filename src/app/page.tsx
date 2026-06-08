import nextDynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import Services from "@/components/Services";
import Portfolio from "@/components/Portfolio";
import WhyUs from "@/components/WhyUs";
import { getCmsSettings } from "@/lib/cms-settings";

// Below-the-fold components — lazy loaded to reduce initial JS bundle
const Process      = nextDynamic(() => import("@/components/Process"));
const Reviews      = nextDynamic(() => import("@/components/Reviews"));
const BlogSection  = nextDynamic(() => import("@/components/BlogSection"));
const FAQ          = nextDynamic(() => import("@/components/FAQ"));
const QuoteForm    = nextDynamic(() => import("@/components/QuoteForm"));
const CTA          = nextDynamic(() => import("@/components/CTA"));
const Footer       = nextDynamic(() => import("@/components/Footer"));
const FloatingButtons = nextDynamic(() => import("@/components/FloatingButtons"));

export const dynamic = "force-dynamic";

export default async function Home() {
  const cms = await getCmsSettings();

  return (
    <main>
      <Navbar />
      <Hero settings={cms.hero} />
      <TrustBar />
      <Services items={cms.services} />
      <Portfolio items={cms.portfolio} />
      <WhyUs />
      <Process />
      <Reviews items={cms.reviews} />
      <BlogSection />
      <FAQ />
      <QuoteForm contact={cms.contact} />
      <CTA />
      <Footer />
      <FloatingButtons />
    </main>
  );
}
