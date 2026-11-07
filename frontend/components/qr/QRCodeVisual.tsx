'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeVisualProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCodeVisual({
  value,
  size = 160,
  className = ''
}: QRCodeVisualProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!value) return;

    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url);
        }
      })
      .catch((err) => {
        console.error('Failed to generate QR code:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center rounded-xl bg-white border border-border/80 p-2 shadow-xs ${className}`}
      >
        <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl bg-white p-2 border border-border shadow-sm overflow-hidden ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dataUrl}
        alt={`QR Code for ${value}`}
        width={size}
        height={size}
        className="rounded-lg object-contain block"
      />
    </div>
  );
}
