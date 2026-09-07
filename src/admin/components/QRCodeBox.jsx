import { useEffect, useRef } from 'react';

// Helper QR Code Component
export default function QRCodeBox({ value, size = 96 }) {
  const qrRef = useRef(null);

  useEffect(() => {
    if (qrRef.current) {
      qrRef.current.innerHTML = '';
      if (window.QRCode) {
        new window.QRCode(qrRef.current, {
          text: value,
          width: size,
          height: size,
          colorDark: '#0f172a',
          colorLight: '#ffffff',
          correctLevel: window.QRCode.CorrectLevel.H
        });
      }
    }
  }, [value, size]);

  return <div ref={qrRef} className="inline-block p-1 bg-white rounded border border-slate-300" />;
}
