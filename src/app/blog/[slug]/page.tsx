import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../../../../keystatic.config';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';

const reader = createReader(process.cwd(), keystaticConfig);

export async function generateStaticParams() {
  const slugs = await reader.collections.posts.list();
  return slugs.map((slug) => ({ slug }));
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await reader.collections.posts.read(slug);
  if (!post) return notFound();

  const allSlugs = await reader.collections.posts.list();
  const allPosts = await Promise.all(
    allSlugs.filter(s => s !== slug).slice(0, 3).map(async (s) => {
      const p = await reader.collections.posts.read(s);
      return { slug: s, title: p?.title ?? '', cover: p?.cover ?? null, category: p?.category ?? '', date: p?.date ?? '' };
    })
  );

  return (
    <>
      <Navbar />
      <main style={{ background: '#0B0F19', minHeight: '100vh', color: '#fff' }}>

        {/* Hero Cover */}
        <div style={{ position: 'relative', width: '100%', height: '480px', marginBottom: '0' }}>
          {post.cover ? (
            <Image src={post.cover} alt={post.title} fill style={{ objectFit: 'cover' }} priority />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#141A24' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(11,15,25,0.3), rgba(11,15,25,0.95))' }} />
          <div style={{ position: 'absolute', bottom: '48px', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '800px', padding: '0 24px' }}>
            <Link href="/" style={{ color: '#A8B0C0', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
              ← กลับหน้าหลัก
            </Link>
            {post.category && (
              <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 600, padding: '4px 14px', borderRadius: '99px', background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.35)', marginBottom: '16px' }}>
                {post.category}
              </span>
            )}
            <h1 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 700, margin: '0 0 16px', fontFamily: 'Kanit, sans-serif', lineHeight: 1.3, color: '#fff' }}>
              {post.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#A8B0C0', fontSize: '13px' }}>
              {post.date && <span>📅 {post.date}</span>}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px' }}>

          {/* Excerpt highlight */}
          {post.excerpt && (
            <div style={{ borderLeft: '3px solid #f97316', paddingLeft: '20px', marginBottom: '48px', color: '#ccc', fontSize: '17px', lineHeight: 1.8, fontStyle: 'italic', fontFamily: 'Kanit, sans-serif' }}>
              {post.excerpt}
            </div>
          )}

          {/* CTA */}
          <div style={{ background: 'linear-gradient(135deg, #1a1208, #141A24)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: '16px', padding: '32px', marginTop: '60px', textAlign: 'center' }}>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: '0 0 8px', fontFamily: 'Kanit, sans-serif' }}>สนใจสั่งงานพิมพ์?</p>
            <p style={{ fontSize: '14px', color: '#A8B0C0', margin: '0 0 24px', fontFamily: 'Kanit, sans-serif' }}>ประเมินราคาฟรี ตอบกลับภายใน 24 ชั่วโมง</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="https://lin.ee/O0nPl03" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', background: '#06C755', color: '#fff', fontWeight: 600, fontSize: '14px', textDecoration: 'none', fontFamily: 'Kanit, sans-serif' }}>
                💬 ติดต่อ LINE
              </a>
              <a href="/#quote" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', background: '#FF6B00', color: '#fff', fontWeight: 600, fontSize: '14px', textDecoration: 'none', fontFamily: 'Kanit, sans-serif' }}>
                📋 ขอใบเสนอราคา
              </a>
            </div>
          </div>
        </div>

        {/* Related Posts */}
        {allPosts.length > 0 && (
          <div style={{ background: '#0d0d0d', padding: '60px 24px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '32px', fontFamily: 'Kanit, sans-serif' }}>
                บทความ<span style={{ color: '#f97316' }}>อื่นๆ</span>
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                {allPosts.map((p) => (
                  <Link key={p.slug} href={`/blog/${p.slug}`} style={{ textDecoration: 'none' }}>
                    <div style={{ background: '#181818', border: '1px solid #2a2a2a', borderRadius: '14px', overflow: 'hidden' }}>
                      <div style={{ height: '160px', position: 'relative', background: '#1a1208' }}>
                        {p.cover && <Image src={p.cover} alt={p.title} fill style={{ objectFit: 'cover' }} />}
                      </div>
                      <div style={{ padding: '16px' }}>
                        {p.category && <span style={{ fontSize: '11px', color: '#f97316', fontFamily: 'Kanit, sans-serif' }}>{p.category}</span>}
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#f0f0f0', margin: '8px 0 0', fontFamily: 'Kanit, sans-serif', lineHeight: 1.5 }}>{p.title}</h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
      <Footer />
      <FloatingButtons />
    </>
  );
}