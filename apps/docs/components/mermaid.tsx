'use client';

import { useEffect, useId, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

function useIsDark() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
}

export function Mermaid({ chart }: { chart: string }) {
  const rawId = useId();
  const id = `mermaid-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const isDark = useIsDark();
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Zoom & Pan state for inline view
  const [inlineZoom, setInlineZoom] = useState(1);

  // Lightbox Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [modalZoom, setModalZoom] = useState(1);
  const [modalPan, setModalPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const cleanChart = chart.trim();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cleanChart);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, [cleanChart]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsOpen(false);
        if (e.key === '+' || e.key === '=')
          setModalZoom((z) => Math.min(5, +(z + 0.25).toFixed(2)));
        if (e.key === '-' || e.key === '_')
          setModalZoom((z) => Math.max(0.3, +(z - 0.25).toFixed(2)));
        if (e.key === '0') {
          setModalZoom(1);
          setModalPan({ x: 0, y: 0 });
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = prev;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!mounted || !cleanChart) return;

    let isCancelled = false;

    async function renderChart() {
      const renderId = `mermaid-svg-${id}-${Math.random().toString(36).slice(2, 8)}`;
      try {
        const { default: mermaid } = await import('mermaid');
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          fontFamily: 'inherit',
          theme: isDark ? 'dark' : 'neutral',
          themeVariables: isDark
            ? {
                primaryColor: '#6366f1',
                primaryTextColor: '#f8fafc',
                primaryBorderColor: '#818cf8',
                lineColor: '#94a3b8',
                secondaryColor: '#1e293b',
                tertiaryColor: '#0f172a',
                background: '#090d16'
              }
            : {
                primaryColor: '#e0e7ff',
                primaryTextColor: '#1e293b',
                primaryBorderColor: '#6366f1',
                lineColor: '#64748b',
                secondaryColor: '#f1f5f9',
                tertiaryColor: '#ffffff',
                background: '#ffffff'
              }
        });

        // Clean any stray containers
        try {
          document.getElementById(renderId)?.remove();
          document.getElementById(`d${renderId}`)?.remove();
        } catch {}

        const { svg: renderedSvg } = await mermaid.render(renderId, cleanChart);

        try {
          document.getElementById(`d${renderId}`)?.remove();
        } catch {}

        if (!isCancelled) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err: any) {
        console.error('Mermaid render error:', err);
        try {
          document.getElementById(`d${renderId}`)?.remove();
        } catch {}
        if (!isCancelled) {
          setError(err?.message || 'Failed to render diagram');
        }
      }
    }

    renderChart();

    return () => {
      isCancelled = true;
    };
  }, [cleanChart, id, isDark, mounted]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - modalPan.x,
      y: e.clientY - modalPan.y
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setModalPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    setModalZoom((z) => Math.min(5, Math.max(0.3, +(z * factor).toFixed(2))));
  };

  if (!mounted) {
    return (
      <div className="my-6 flex h-28 items-center justify-center rounded-xl border border-border/40 bg-card/30">
        <span className="text-xs text-muted-foreground">
          Loading diagram...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400">
        <div className="flex items-center gap-2 font-semibold text-red-500">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Mermaid Diagram Error
        </div>
        <pre className="mt-2 overflow-x-auto rounded bg-card/50 p-2 font-mono text-[11px] text-foreground/80">
          {cleanChart}
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-6 flex h-28 items-center justify-center rounded-xl border border-border/40 bg-card/30">
        <span className="text-xs text-muted-foreground animate-pulse">
          Rendering diagram...
        </span>
      </div>
    );
  }

  return (
    <>
      {/* Main Diagram Card */}
      <div className="group relative my-6 overflow-hidden rounded-xl border border-border/40 bg-card/30 shadow-sm transition-colors">
        {/* Header Toolbar */}
        <div className="flex items-center justify-between border-b border-border/30 bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium text-[11px] uppercase tracking-wider text-muted-foreground/80">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary/70"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
            Diagram
          </div>

          <div className="flex items-center gap-1">
            {/* Inline Zoom Controls */}
            <div className="flex items-center gap-0.5 rounded-md border border-border/40 bg-background/50 px-1 py-0.5">
              <button
                type="button"
                onClick={() =>
                  setInlineZoom((z) => Math.max(0.5, +(z - 0.2).toFixed(2)))
                }
                aria-label="Zoom out"
                title="Zoom out"
                className="flex h-5 w-5 items-center justify-center rounded text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                −
              </button>
              <button
                type="button"
                onClick={() => setInlineZoom(1)}
                title="Reset zoom"
                className="px-1 text-[10px] font-mono font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {Math.round(inlineZoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() =>
                  setInlineZoom((z) => Math.min(2.5, +(z + 0.2).toFixed(2)))
                }
                aria-label="Zoom in"
                title="Zoom in"
                className="flex h-5 w-5 items-center justify-center rounded text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                +
              </button>
            </div>

            {/* Expand / Lightbox Button */}
            <button
              type="button"
              onClick={() => {
                setModalZoom(1);
                setModalPan({ x: 0, y: 0 });
                setIsOpen(true);
              }}
              title="Expand & Fullscreen Zoom"
              className="flex items-center gap-1 rounded border border-border/40 bg-background/50 px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
              <span>Expand</span>
            </button>

            {/* Copy Source Code */}
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy mermaid source"
              title="Copy mermaid source"
              className="flex items-center gap-1 rounded border border-border/40 bg-background/50 px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {copied ? (
                <>
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* In-Card Diagram View */}
        <div
          onClick={() => {
            setModalZoom(1);
            setModalPan({ x: 0, y: 0 });
            setIsOpen(true);
          }}
          title="Click to view full screen with pan and zoom"
          className="group/viewer relative flex cursor-zoom-in justify-center overflow-x-auto p-6 transition-all"
        >
          <div
            style={{
              transform: `scale(${inlineZoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease-out'
            }}
            className="flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <div className="pointer-events-none absolute bottom-2 right-3 rounded-full bg-background/80 px-2 py-0.5 text-[10px] text-muted-foreground opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover/viewer:opacity-100">
            Click to expand
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md animate-in fade-in duration-200"
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) setIsOpen(false);
            }}
          >
            {/* Modal Header Toolbar */}
            <div className="flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">
                  Interactive Diagram Inspector
                </span>
                <span className="hidden sm:inline-block rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  Pan & Zoom Enabled
                </span>
              </div>

              {/* Floating Zoom Bar */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-lg border border-border bg-card/60 px-2 py-1 shadow-sm backdrop-blur">
                  <button
                    type="button"
                    onClick={() =>
                      setModalZoom((z) => Math.max(0.3, +(z - 0.25).toFixed(2)))
                    }
                    title="Zoom Out (-)"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    −
                  </button>
                  <span className="min-w-14 text-center font-mono text-xs font-medium text-foreground">
                    {Math.round(modalZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setModalZoom((z) => Math.min(5, +(z + 0.25).toFixed(2)))
                    }
                    title="Zoom In (+)"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    +
                  </button>
                  <div className="mx-1 h-4 w-[1px] bg-border" />
                  <button
                    type="button"
                    onClick={() => {
                      setModalZoom(1);
                      setModalPan({ x: 0, y: 0 });
                    }}
                    title="Reset Zoom (0)"
                    className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Reset
                  </button>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close (Esc)"
                  aria-label="Close diagram modal"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card/60 text-muted-foreground shadow-sm transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Canvas: Drag to Pan & Wheel to Zoom */}
            <div
              className={`relative flex flex-1 items-center justify-center overflow-hidden p-8 select-none ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onWheel={handleWheel}
              onDoubleClick={() => {
                setModalZoom(1);
                setModalPan({ x: 0, y: 0 });
              }}
            >
              <div
                style={{
                  transform: `translate(${modalPan.x}px, ${modalPan.y}px) scale(${modalZoom})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                }}
                className="pointer-events-none flex items-center justify-center [&_svg]:max-w-none [&_svg]:max-h-none"
                dangerouslySetInnerHTML={{ __html: svg }}
              />

              {/* Bottom Helper Hint */}
              <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-border/40 bg-background/80 px-3.5 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
                <span>
                  🖱️ Click & drag to pan &nbsp;•&nbsp; Scroll to zoom
                  &nbsp;•&nbsp; Double-click to reset
                </span>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
