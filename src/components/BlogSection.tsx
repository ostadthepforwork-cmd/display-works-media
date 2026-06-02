'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  category: string
  date: string
  slug: string
  cover?: string
  published?: boolean
  body: string
}

export default function BlogSection() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  // เริ่มต้นเป็น true เพื่อให้ server และ client render เหมือนกัน
  // ป้องกัน hydration mismatch ที่ทำให้ต้อง refresh 2 รอบ
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // สร้าง supabase client ภายใน function — ป้องกัน connection leak
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    async function fetchPosts() {
      const { data } = await supabase
        .from('posts')
        .select('id, title, excerpt, category, date, slug, cover, published, body')
        .eq('published', true)
        .order('date', { ascending: false })
        .limit(3)
      setPosts(data || [])
      setMounted(true)
    }
    fetchPosts()
  }, [])

  // render skeleton ที่มี DOM เหมือนกันทั้ง server และ client
  // แทนการ return null ซึ่งทำให้ hydration mismatch
  if (!mounted) {
    return (
      <section id="blog" style={{ background: '#0d0d0d', padding: '80px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '40px' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#f97316', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 500, margin: '0 0 8px', fontFamily: "'Kanit', sans-serif" }}>
                ความรู้และเทคนิค
              </p>
              <h2 style={{ fontSize: '34px', fontWeight: 700, color: '#ffffff', margin: '0', lineHeight: 1.2, fontFamily: "'Kanit', sans-serif" }}>
                บทความ<span style={{ color: '#f97316' }}>ล่าสุด</span>
              </h2>
              <div style={{ width: '44px', height: '3px', background: '#f97316', borderRadius: '99px', margin: '12px 0 10px' }} />
            </div>
          </div>
          {/* Skeleton cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ background: '#181818', border: '1px solid #2a2a2a', borderRadius: '14px', overflow: 'hidden', height: '280px', opacity: 0.4 }} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (posts.length === 0) return null

  return (
    <section id="blog" style={{ background: '#0d0d0d', padding: '80px 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '40px' }}>
          <div>
            <p style={{ fontSize: '12px', color: '#f97316', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 500, margin: '0 0 8px', fontFamily: "'Kanit', sans-serif" }}>
              ความรู้และเทคนิค
            </p>
            <h2 style={{ fontSize: '34px', fontWeight: 700, color: '#ffffff', margin: '0', lineHeight: 1.2, fontFamily: "'Kanit', sans-serif" }}>
              บทความ<span style={{ color: '#f97316' }}>ล่าสุด</span>
            </h2>
            <div style={{ width: '44px', height: '3px', background: '#f97316', borderRadius: '99px', margin: '12px 0 10px' }} />
            <p style={{ fontSize: '14px', color: '#888', margin: 0, fontFamily: "'Kanit', sans-serif" }}>
              เทคนิคและคำแนะนำจากทีมงานมืออาชีพ
            </p>
          </div>
          <Link href="/blog" style={{ fontSize: '13px', fontWeight: 500, color: '#f97316', border: '1px solid rgba(249,115,22,0.4)', padding: '9px 20px', borderRadius: '99px', background: 'transparent', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'Kanit', sans-serif", textDecoration: 'none' }}>
            ดูบทความทั้งหมด →
          </Link>
        </div>

        {/* Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {posts.map((post, index) => (
            <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
              <div
                style={{ background: '#181818', border: '1px solid #2a2a2a', borderRadius: '14px', overflow: 'hidden', transition: 'border-color 0.25s, transform 0.25s', cursor: 'pointer', height: '100%' }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#f97316'; el.style.transform = 'translateY(-5px)' }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#2a2a2a'; el.style.transform = 'translateY(0)' }}
              >
                {/* Thumbnail */}
                <div style={{ height: '155px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', background: index === 0 ? '#1a1208' : index === 1 ? '#121a12' : '#1a1218' }}>
                  {post.cover ? (
                    <img
                      src={post.cover}
                      alt={post.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  ) : (
                    <span style={{ fontSize: '44px', opacity: 0.55 }}>📄</span>
                  )}
                  {post.category && (
                    <span style={{ position: 'absolute', top: '12px', left: '12px', fontSize: '11px', fontWeight: 600, padding: '3px 11px', borderRadius: '99px', fontFamily: "'Kanit', sans-serif", background: index % 2 === 0 ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.08)', color: index % 2 === 0 ? '#f97316' : '#e5e5e5', border: index % 2 === 0 ? '1px solid rgba(249,115,22,0.35)' : '1px solid rgba(255,255,255,0.15)' }}>
                      {post.category}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f0f0f0', margin: '0 0 10px', lineHeight: 1.55, fontFamily: "'Kanit', sans-serif" }}>
                    {post.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.75, margin: '0 0 18px', fontFamily: "'Kanit', sans-serif" }}>
                    {(post.excerpt || '').substring(0, 100)}{post.excerpt?.length > 100 ? '...' : ''}
                  </p>
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
  )
}
