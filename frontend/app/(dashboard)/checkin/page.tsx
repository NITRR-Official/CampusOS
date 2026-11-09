'use client';

import { useState, useRef, FormEvent } from 'react';
import Link from 'next/link';
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  ScanLine,
  History,
  Sparkles,
  Camera
} from 'lucide-react';
import { apiClient } from '@campus-os/shared/api-client';

interface CheckInRecord {
  id?: string;
  status: 'checked-in' | 'pending';
  qrCode?: string;
  checkInTime?: string;
  eventId?: string;
  userId?: string;
  attendeeName?: string;
  eventTitle?: string;
}

async function scanQRCode(qrCode: string): Promise<CheckInRecord> {
  const data = await apiClient.post<
    { checkIn?: CheckInRecord } & CheckInRecord
  >('/checkins/scan', { qrCode });
  return data?.checkIn || data;
}
import { CameraScannerModal } from '@/components/qr/CameraScannerModal';

interface ScanLogItem {
  id: string;
  code: string;
  timestamp: string;
  status: 'success' | 'error';
  message: string;
  record?: CheckInRecord;
}

export default function FastCheckInKioskPage() {
  const [passInput, setPassInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeAlert, setActiveAlert] = useState<{
    type: 'success' | 'error';
    title: string;
    description: string;
  } | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanLogItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function processPassCode(rawCode: string) {
    if (!rawCode) return;

    // Clean PASS- prefix if present
    const cleanCode = rawCode.startsWith('PASS-')
      ? rawCode.replace('PASS-', '')
      : rawCode;

    setIsProcessing(true);
    setActiveAlert(null);

    try {
      const response = await scanQRCode(cleanCode);
      const timeStr = new Date().toLocaleTimeString();

      setActiveAlert({
        type: 'success',
        title: 'Check-In Verified!',
        description: `Pass verified and marked present at ${timeStr}.`
      });

      setScanHistory((prev) => [
        {
          id: Math.random().toString(),
          code: cleanCode.substring(0, 12).toUpperCase(),
          timestamp: timeStr,
          status: 'success',
          message: 'Verified & Checked In',
          record: response
        },
        ...prev.slice(0, 9)
      ]);

      setPassInput('');
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const timeStr = new Date().toLocaleTimeString();
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        'Invalid pass code or attendee is already checked in.';

      setActiveAlert({
        type: 'error',
        title: 'Verification Failed',
        description: errMsg
      });

      setScanHistory((prev) => [
        {
          id: Math.random().toString(),
          code: cleanCode.substring(0, 12).toUpperCase(),
          timestamp: timeStr,
          status: 'error',
          message: errMsg
        },
        ...prev.slice(0, 9)
      ]);
    } finally {
      setIsProcessing(false);
      // Keep autofocus for rapid consecutive scans
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  async function handleScan(e: FormEvent) {
    e.preventDefault();
    await processPassCode(passInput.trim());
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Events
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
          Scanner Active
        </span>
      </div>

      {/* Hero Header */}
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <ScanLine className="size-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <Sparkles className="size-3.5" />
              Entrance Desk Kiosk
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Express Event Check-In
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Rapid barcode / QR code verification desk for gate volunteers and
              event organizers.
            </p>
          </div>
        </div>

        {/* Scan Input Form */}
        <form onSubmit={handleScan} className="mt-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted-foreground">
                <QrCode className="size-6 text-primary" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                placeholder="Scan or paste student ticket pass code (e.g. 650DDF36DB...)"
                className="w-full rounded-2xl border-2 border-primary/30 bg-background py-4 pl-14 pr-36 font-mono text-base font-bold text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-sm"
                autoFocus
                disabled={isProcessing}
              />
              <div className="absolute inset-y-0 right-2 flex items-center">
                <button
                  type="submit"
                  disabled={isProcessing || !passInput.trim()}
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? 'Verifying...' : 'Verify Pass'}
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-primary/30 bg-primary/10 px-6 py-4 text-sm font-bold text-primary shadow-xs transition hover:bg-primary/20 cursor-pointer shrink-0"
            >
              <Camera className="size-5" />
              Camera Scan
            </button>
          </div>
        </form>

        {/* Real-Time Scan Feedback Banner */}
        {activeAlert && (
          <div
            className={`mt-6 rounded-2xl border p-5 transition-all animate-in fade-in zoom-in-95 ${
              activeAlert.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-950 dark:text-rose-100'
            }`}
          >
            <div className="flex items-center gap-3">
              {activeAlert.type === 'success' ? (
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm shrink-0">
                  <CheckCircle2 className="size-6" />
                </div>
              ) : (
                <div className="flex size-10 items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm shrink-0">
                  <AlertCircle className="size-6" />
                </div>
              )}
              <div>
                <h4 className="font-bold text-base">{activeAlert.title}</h4>
                <p className="text-xs opacity-90 mt-0.5">
                  {activeAlert.description}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Scan History */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2">
            <History className="size-4 text-muted-foreground" />
            <h3 className="font-bold text-base text-foreground">
              Recent Check-In Activity
            </h3>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            Showing last {scanHistory.length} scan
            {scanHistory.length === 1 ? '' : 's'}
          </span>
        </div>

        {scanHistory.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No recent scans yet. Scan a ticket pass above to begin entry
            verification.
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {scanHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-3 text-xs transition hover:bg-muted/20 px-2 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {item.status === 'success' ? (
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="size-4 text-rose-500 shrink-0" />
                  )}
                  <div>
                    <span className="font-mono font-bold text-foreground">
                      PASS-{item.code}
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {item.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="size-3.5" />
                  <span>{item.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Camera Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScan={async (decodedText) => {
          const clean = decodedText.startsWith('PASS-')
            ? decodedText.replace('PASS-', '')
            : decodedText;
          setPassInput(clean);
          await processPassCode(clean);
        }}
      />
    </div>
  );
}
