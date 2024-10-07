import React from 'react';
import Script from 'next/script';

export default function CookiesConsent(): React.ReactNode {
  return (
    <Script
      src="https://cdn.consentmanager.net/delivery/autoblocking/32116fec811f0.js"
      data-cmp-ab="1"
      data-cmp-host="b.delivery.consentmanager.net"
      data-cmp-cdn="cdn.consentmanager.net"
      data-cmp-codesrc="16"
      strategy="afterInteractive"
    />
  );
}
