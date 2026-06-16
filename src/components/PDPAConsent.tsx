'use client'

import { useState, useEffect } from 'react'

export default function PDPAConsent() {
  const [visible, setVisible] = useState(false)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('pdpa_consent')
    if (!consent) {
      // Small delay so banner animates in after page load
      const timer = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const acceptAll = () => {
    localStorage.setItem('pdpa_consent', 'all')
    localStorage.setItem('pdpa_consent_date', new Date().toISOString())
    window.dispatchEvent(new Event('pdpa-consent-changed'))
    setVisible(false)
    // Fire tracking scripts after consent
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('consent', 'grant')
    }
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'granted',
      })
    }
  }

  const acceptNecessary = () => {
    localStorage.setItem('pdpa_consent', 'necessary')
    localStorage.setItem('pdpa_consent_date', new Date().toISOString())
    window.dispatchEvent(new Event('pdpa-consent-changed'))
    setVisible(false)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
      })
    }
  }

  if (!visible) return null

  return (
    <>
      {/* Backdrop for detail modal */}
      {showDetail && (
        <div
          className="pdpa-backdrop"
          onClick={() => setShowDetail(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99998,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#fff',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '520px',
            width: '90%',
            zIndex: 99999,
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
          }}
        >
          <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: '#111' }}>
            นโยบายคุกกี้
          </h2>
          <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#555', lineHeight: 1.7 }}>
            เราใช้คุกกี้เพื่อเพิ่มประสิทธิภาพการทำงานของเว็บไซต์และมอบประสบการณ์ที่ดีขึ้นให้แก่คุณ
            โปรดอ่านรายละเอียดด้านล่างและเลือกการตั้งค่าที่คุณต้องการ
          </p>

          {[
            {
              title: '🔒 คุกกี้ที่จำเป็น',
              desc: 'จำเป็นสำหรับการทำงานพื้นฐานของเว็บไซต์ เช่น ความปลอดภัย และฟังก์ชันหลักต่าง ๆ ไม่สามารถปิดได้',
              always: true,
            },
            {
              title: '📊 คุกกี้วิเคราะห์ข้อมูล',
              desc: 'ช่วยให้เราเข้าใจว่าผู้เยี่ยมชมใช้งานเว็บไซต์อย่างไร เช่น Google Analytics เพื่อปรับปรุงเนื้อหาและประสบการณ์',
              always: false,
            },
            {
              title: '🎯 คุกกี้การตลาด',
              desc: 'ใช้สำหรับการแสดงโฆษณาที่ตรงกับความสนใจของคุณ เช่น Facebook Pixel และ Google Ads',
              always: false,
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                background: '#f8f9fa',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '14px', color: '#111' }}>{item.title}</strong>
                {item.always ? (
                  <span style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>เปิดเสมอ</span>
                ) : (
                  <span
                    style={{
                      fontSize: '12px',
                      background: '#e8f5e9',
                      color: '#2e7d32',
                      padding: '2px 10px',
                      borderRadius: '99px',
                    }}
                  >
                    ยอมรับเมื่อกด "ยอมรับทั้งหมด"
                  </span>
                )}
              </div>
              <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#666', lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </div>
          ))}

          <div style={{ marginTop: '24px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={acceptNecessary}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '12px 16px',
                border: '2px solid #ddd',
                background: '#fff',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#555',
                cursor: 'pointer',
              }}
            >
              เฉพาะที่จำเป็น
            </button>
            <button
              onClick={acceptAll}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '12px 16px',
                border: 'none',
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              ยอมรับทั้งหมด
            </button>
          </div>

          <p style={{ margin: '16px 0 0', fontSize: '12px', color: '#aaa', textAlign: 'center' }}>
            การใช้งานเว็บไซต์ต่อเนื่องถือว่าคุณยอมรับ{' '}
            <a href="https://displayworksmedia.com/privacy-policy" style={{ color: '#555' }}>
              นโยบายความเป็นส่วนตัว
            </a>
          </p>
        </div>
      )}

      {/* Main Banner */}
      <div
        className="pdpa-banner-wrap"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 99997,
          padding: '0 16px 16px',
          animation: 'pdpa-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        <style>{`
          @keyframes pdpa-slide-up {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }

          @media (max-width: 640px) {
            .pdpa-banner-wrap {
              padding: 0 8px 8px !important;
            }

            .pdpa-banner-panel {
              gap: 10px !important;
              padding: 13px !important;
              border-radius: 14px !important;
            }

            .pdpa-banner-icon {
              display: none;
            }

            .pdpa-banner-copy {
              width: 100%;
              min-width: 0 !important;
            }

            .pdpa-banner-copy p,
            .pdpa-banner-copy button {
              font-size: 11px !important;
              line-height: 1.45 !important;
            }

            .pdpa-banner-actions {
              display: grid !important;
              grid-template-columns: minmax(0, 1fr);
              width: 100%;
              gap: 8px !important;
              flex-shrink: 1 !important;
            }

            .pdpa-banner-actions button {
              width: 100%;
              min-width: 0;
              padding: 10px 6px !important;
              white-space: normal !important;
              overflow-wrap: anywhere;
              font-size: 11px !important;
              line-height: 1.25;
            }
          }
        `}</style>

        <div
          className="pdpa-banner-panel"
          style={{
            background: 'rgba(15, 15, 25, 0.97)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '20px 24px',
            maxWidth: '900px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap',
            boxShadow: '0 -4px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06)',
          }}
        >
          {/* Icon */}
          <div className="pdpa-banner-icon" style={{ fontSize: '28px', flexShrink: 0 }}>🍪</div>

          {/* Text */}
          <div className="pdpa-banner-copy" style={{ flex: 1, minWidth: '200px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#e0e0e0', lineHeight: 1.6 }}>
              เว็บไซต์นี้ใช้คุกกี้เพื่อวิเคราะห์การใช้งาน (Google Analytics), ติดตามประสิทธิภาพโฆษณา (Facebook Pixel, GTM)
              และเพิ่มประสบการณ์ที่ดีขึ้นให้คุณ ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA){' '}
              <button
                onClick={() => setShowDetail(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#90cdf4',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '14px',
                }}
              >
                อ่านเพิ่มเติม
              </button>
            </p>
          </div>

          {/* Buttons */}
          <div className="pdpa-banner-actions" style={{ display: 'flex', gap: '10px', flexShrink: 0, flexWrap: 'wrap' }}>
            <button
              onClick={acceptNecessary}
              style={{
                padding: '10px 18px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#ccc',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              เฉพาะที่จำเป็น
            </button>
            <button
              onClick={acceptAll}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: 'linear-gradient(135deg, #4f9cf9 0%, #a78bfa 100%)',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#fff',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 15px rgba(79,156,249,0.4)',
              }}
            >
              ✓ ยอมรับทั้งหมด
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
