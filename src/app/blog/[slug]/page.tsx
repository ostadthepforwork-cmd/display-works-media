import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../../../../keystatic.config';
import { notFound } from 'next/navigation';
import Image from 'next/image';

const reader = createReader(process.cwd(), keystaticConfig);

export async function generateStaticParams() {
  const slugs = await reader.collections.posts.list();
  return slugs.map((slug) => ({ slug }));
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await reader.collections.posts.read(slug);
  if (!post) return notFound();
  return (
    <main style={{ background: '#0b0f19', minHeight: '100vh', color: '#fff', padding: '80px 24px' }}>
      <article style={{ maxWidth: '800px', margin: '0 auto' }}>
        {post.cover && (
          <div style={{ position: 'relative', width: '100%', height: '400px', marginBottom: '40px', borderRadius: '16px', overflow: 'hidden' }}>
            <Image src={post.cover} alt={post.title} fill style={{ objectFit: 'cover' }} />
          </div>
        )}
        <p style={{ color: '#f97316', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase' }}>{post.category}</p>
        <h1 style={{ fontSize: '36px', fontWeight: 700, margin: '12px 0 8px', fontFamily: 'Kanit, sans-serif' }}>{post.title}</h1>
        <p style={{ color: '#666', fontSize: '13px', marginBottom: '40px' }}>{post.date}</p>
        <p style={{ lineHeight: 1.8, fontSize: '16px', color: '#ccc' }}>{post.excerpt}</p>
      </article>
    </main>
  );
}