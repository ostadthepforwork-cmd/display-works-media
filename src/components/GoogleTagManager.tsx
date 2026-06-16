'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

export default function GoogleTagManager() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const syncConsent = () => setEnabled(localStorage.getItem('pdpa_consent') === 'all')
    syncConsent()
    window.addEventListener('pdpa-consent-changed', syncConsent)
    return () => window.removeEventListener('pdpa-consent-changed', syncConsent)
  }, [])

  if (!enabled) return null

  return (
    <Script id="gtm-script" strategy="afterInteractive">
      {`
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','GTM-T7CKSG6N');
      `}
    </Script>
  )
}
