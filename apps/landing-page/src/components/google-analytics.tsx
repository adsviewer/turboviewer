import React from 'react';
import Script from 'next/script';

export default function GoogleAnalytics(): React.ReactNode {
  return (
    <>
      {/* Cookies Consent  */}
      <Script
        src="https://cdn.consentmanager.net/delivery/autoblocking/32116fec811f0.js"
        data-cmp-ab="1"
        data-cmp-host="b.delivery.consentmanager.net"
        data-cmp-cdn="cdn.consentmanager.net"
        data-cmp-codesrc="16"
        strategy="afterInteractive"
      />

      {/* Analytics */}
      <Script
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${String(process.env.NEXT_PUBLIC_MEASUREMENT_ID)}`}
      />

      <Script id="" strategy="lazyOnload">
        {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${String(process.env.NEXT_PUBLIC_MEASUREMENT_ID)}', {
              page_path: window.location.pathname,
              });
          `}
      </Script>
    </>
  );
}
