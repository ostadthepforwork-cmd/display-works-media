import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../../../../keystatic.config';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';
import { DocumentRenderer } from '@keystatic/core/renderer';

const reader = createReader(process.cwd(), keystaticConfig);

export async function generateStaticParams() {
  const slugs = await reader.collections.posts.list();
  return slugs.map((slug) => ({ slug }));
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await reader.collections.posts.read(slug);
  if (!post) return notFound();
  const content = await post.content();
  return (
    <>
      <Navbar />
      <main style={{ background: '#0b0f19', minHeight: '100vh', color: '#fff', padding: '100px 24px 80px' }}>
        <article style={{ maxWidth: '800px', margin: '0 auto' }}>
          {post.cover && (
            <div style={{ position: 'relative', width: '100%', height: '420px', marginBottom: '40px', borderRadius: '16px', overflow: 'hidden' }}>
              <Image src={post.cover} alt={post.title} fill style={{ objectFit: 'cover' }} />
            </div>
          )}
          <p style={{ color: '#f97316', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>{post.category}</p>
          <h1 style={{ fontSize: '36px', fontWeight: 700, margin: '0 0 12px', fontFamily: 'Kanit, sans-serif', lineHeight: 1.3 }}>{post.title}</h1>
          <p style={{ color: '#666', fontSize: '13px', marginBottom: '48px', fontFamily: 'Kanit, sans-serif' }}>{post.date}</p>
          <div style={{ lineHeight: 1.9, fontSize: '16px', color: '#ccc', fontFamily: 'Kanit, sans-serif' }}>
            <DocumentRenderer document={content.document} />
          </div>
        </article>
      </main>
      <Footer />
      <FloatingButtons />
    </>
  );
}