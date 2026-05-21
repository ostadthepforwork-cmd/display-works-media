'use client'
import Link from 'next/link'
import Image from 'next/image'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  category: string
  date: string
  slug: string
  cover?: string | null
}

interface BlogSectionProps {
  posts?: BlogPost[]
}

export default function BlogSection({ posts = [] }: BlogSectionProps) {
  if (posts.length === 0) return null;
  return (
    <section id="blog" style={{ background: '#0d0d0d', padding: '80px 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '40px' }}>
          <div>
            <p style={{ fontSize: '12px', color: '#f97316', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 500, margin: '0 0 8px', fontFamily: "'Kanit', sans-serif" }}>ความรู้และเทคนิค</p>
            <h2 style={{ fontSize: '34px', fontWeight: 700, color: '#ffffff', margin: '0', lineHeight: 1.2, fontFamily: "'Kanit', sans-serif" }}>บทความ<span style={{ color: '#f97316' }}>ล่าสุด</span></h2>
            <div style={{ width: '44px', height: '3px', background: '#f97316', borderRadius: '99px', margin: '12px 0 10px' }} />
            <p style={{ fontSize: '14px', color: '#888', margin: 0, fontFamily: "'Kanit', sans-serif" }}>เทคนิคและคำแนะนำจากทีมงานมืออาชีพ</p>
          </div>
          <Link href="/blog" style={{ fontSize: '13px', fontWeight: 500, color: '#f97316', border: '1px solid rgba(249,115,22,0.4)', padding: '9px 20px', borderRadius: '99px', background: 'transparent', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'Kanit', sans-serif", textDecoration: 'none' }}>ดูบทความทั้งหมด →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {posts.map((post) => (
            <Link key={post.id} href={/blog/} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#181818', border: '1px solid #2a2a2a', borderRadius: '14px', overflow: 'hidden', height: '100%' }}>
                <div style={{ height: '200px', position: 'relative', background: '#1a1208' }}>
                  {post.cover ? (
                    <Image src={post.cover} alt={post.title} fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '44px', opacity: 0.3 }}>📄</span>
                    </div>
                  )}
                  {post.category && (
                    <span style={{ position: 'absolute', top: '12px', left: '12px', fontSize: '11px', fontWeight: 600, padding: '3px 11px', borderRadius: '99px', fontFamily: "'Kanit', sans-serif", background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.35)' }}>{post.category}</span>
                  )}
                </div>
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f0f0f0', margin: '0 0 10px', lineHeight: 1.55, fontFamily: "'Kanit', sans-serif" }}>{post.title}</h3>
                  <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.75, margin: '0 0 18px', fontFamily: "'Kanit', sans-serif" }}>{post.excerpt}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #222', paddingTop: '14px' }}>
                    <span style={{ fontSize: '12px', color: '#555', fontFamily: "'Kanit', sans-serif" }}>📅 {post.date}</span>
                    <span style={{ fontSize: '12px', color: '#f97316', fontWeight: 600, fontFamily: "'Kanit', sans-serif" }}>อ่านต่อ →</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}