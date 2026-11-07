'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { Maximize2, X, Copy, Check, Sun, Sparkles } from 'lucide-react';

interface QRCodeVisualProps {
  value: string;
  size?: number;
  className?: string;
  expandable?: boolean;
  title?: string;
  subtitle?: string;
  passCode?: string;
}

export function QRCodeVisual({
  value,
  size = 160,
  className = '',
  expandable = false,
  title,
  subtitle,
  passCode
}: QRCodeVisualProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [largeDataUrl, setLargeDataUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  // Generate thumbnail QR
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

  // Generate high-resolution enlarged QR for modal
  useEffect(() => {
    let isMounted = true;
    if (!value || !isModalOpen) return;

    QRCode.toDataURL(value, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then((url) => {
        if (isMounted) {
          setLargeDataUrl(url);
        }
      })
      .catch((err) => {
        console.error('Failed to generate large QR code:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [value, isModalOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const handleCopy = () => {
    const textToCopy = passCode || value;
    navigator.clipboard.writeText(textToCopy);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

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
    <>
      <div
        onClick={() => expandable && setIsModalOpen(true)}
        className={`relative inline-flex items-center justify-center rounded-xl bg-white p-2 border border-border shadow-sm overflow-hidden select-none ${
          expandable
            ? 'cursor-pointer group hover:border-primary/60 hover:shadow-md transition-all'
            : ''
        } ${className}`}
        title={expandable ? 'Click to enlarge QR pass' : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dataUrl}
          alt={`QR Code for ${value}`}
          width={size}
          height={size}
          className="rounded-lg object-contain block transition-transform group-hover:scale-105"
        />

        {/* Expandable hover overlay hint */}
        {expandable && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-1 rounded-xl pointer-events-none">
            <Maximize2 className="size-5 drop-shadow-md animate-pulse" />
            <span className="text-[10px] font-bold tracking-tight drop-shadow-md mt-1">
              Enlarge
            </span>
          </div>
        )}
      </div>

      {/* Fullscreen / Enlarged Modal Portaled to document.body */}
      {isModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/50">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
                    <Sparkles className="size-3.5" />
                    Digital Entrance Pass
                  </div>
                  <h3 className="font-extrabold text-lg text-foreground tracking-tight line-clamp-1 mt-0.5">
                    {title || 'Event Pass'}
                  </h3>
                  {subtitle && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
                  title="Close"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Giant Optical QR Pass */}
              <div className="my-5 flex flex-col items-center justify-center">
                <div className="relative rounded-2xl bg-white p-4 shadow-inner border border-zinc-200 flex items-center justify-center">
                  {largeDataUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={largeDataUrl}
                      alt={`High-Res QR Code for ${value}`}
                      width={260}
                      height={260}
                      className="rounded-xl object-contain block"
                    />
                  ) : (
                    <div className="size-[260px] flex items-center justify-center">
                      <div className="size-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Pass Code string */}
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-muted/60 px-3 py-1.5">
                  <span className="font-mono text-xs font-bold text-foreground tracking-wider select-all">
                    {passCode || value}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-lg p-1 text-muted-foreground hover:text-foreground transition cursor-pointer"
                    title="Copy pass code"
                  >
                    {hasCopied ? (
                      <Check className="size-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Helper tips */}
              <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-primary">
                  <Sun className="size-3.5" />
                  Display Tip
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Set screen brightness to 100% for rapid optical scanning at
                  the check-in desk.
                </p>
              </div>

              {/* Footer action */}
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="mt-4 w-full rounded-xl bg-secondary py-2.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 transition cursor-pointer"
              >
                Close Pass
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
