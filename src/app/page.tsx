import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../../keystatic.config';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import TrustBar from '@/components/TrustBar';
import Services from '@/components/Services';
import Portfolio from '@/components/Portfolio';
import WhyUs from '@/components/WhyUs';
import Process from '@/components/Process';
import Reviews from '@/components/Reviews';
import BlogSection from '@/components/BlogSection';
import FAQ from '@/components/FAQ';
import QuoteForm from '@/components/QuoteForm';
import CTA from '@/components/CTA';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';

const reader = createReader(process.cwd(), keystaticConfig);

export default async function Home() {
  const postSlugs = await reader.collections.posts.list();
  const posts = await Promise.all(
    postSlugs.map(async (slug) => {
      const post = await reader.collections.posts.read(slug);
      return {
        id: slug,
        title: post?.title ?? '',
        excerpt: post?.excerpt ?? '',
        category: post?.category ?? '',
        date: post?.date ?? '',
        slug,
        cover: post?.cover ?? null,
      };
    })
  );

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
      <BlogSection posts={posts} />
      <FAQ />
      <QuoteForm />
      <CTA />
      <Footer />
      <FloatingButtons />
    </main>
  );
}