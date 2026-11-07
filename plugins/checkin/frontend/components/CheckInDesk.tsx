'use client';

import { useState, useMemo, useEffect, useCallback, FormEvent } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  Search,
  QrCode,
  Download,
  Copy,
  Check,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import {
  fetchCheckIns,
  fetchAttendanceStats,
  scanQRCode,
  type CheckInRecord,
  type AttendanceStats
} from '../api';

interface RegistrationItem {
  id: string;
  userId?: string;
  attendeeName: string;
  attendeeEmail: string;
  createdAt: string;
  customResponses?: Record<string, any>;
}

interface CheckInDeskProps {
  eventId: string;
  eventTitle: string;
  initialRegistrations?: RegistrationItem[];
}

export function CheckInDesk({
  eventId,
  eventTitle,
  initialRegistrations = []
}: CheckInDeskProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'checked-in' | 'pending'
  >('all');
  const [scannerInput, setScannerInput] = useState('');
  const [scanMessage, setScanMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedAttendee, setSelectedAttendee] =
    useState<RegistrationItem | null>(null);

  // Self-contained data fetching
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const loadData = useCallback(async () => {
    if (!eventId) return;
    try {
      const [records, statistics] = await Promise.all([
        fetchCheckIns(eventId).catch(() => []),
        fetchAttendanceStats(eventId).catch(() => null)
      ]);
      setCheckIns(records);
      setStats(statistics);
    } catch {
      // Graceful error fallback
    }
  }, [eventId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Create lookup map of check-in records by userId or qrCode
  const checkInMap = useMemo(() => {
    const map = new Map<string, CheckInRecord>();
    checkIns.forEach((record) => {
      if (record.userId) {
        map.set(record.userId, record);
      }
      if (record.qrCode) {
        map.set(record.qrCode.toLowerCase(), record);
      }
    });
    return map;
  }, [checkIns]);

  // Combine event registrations with check-in records
  const attendeesWithStatus = useMemo(() => {
    return initialRegistrations.map((reg) => {
      const record = reg.userId ? checkInMap.get(reg.userId) : undefined;
      return {
        ...reg,
        checkInRecord: record,
        isCheckedIn: record?.status === 'checked-in',
        qrCode: record?.qrCode || '',
        checkedInAt: record?.checkedInAt || null
      };
    });
  }, [initialRegistrations, checkInMap]);

  // Dynamic metrics
  const totalCount = initialRegistrations.length;
  const checkedInCount = attendeesWithStatus.filter(
    (a) => a.isCheckedIn
  ).length;
  const pendingCount = Math.max(0, totalCount - checkedInCount);
  const turnoutRate =
    totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

  // Filter attendees
  const filteredAttendees = useMemo(() => {
    return attendeesWithStatus.filter((attendee) => {
      const matchesSearch =
        attendee.attendeeName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        attendee.attendeeEmail
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        attendee.qrCode.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'checked-in') return attendee.isCheckedIn;
      if (statusFilter === 'pending') return !attendee.isCheckedIn;
      return true;
    });
  }, [attendeesWithStatus, searchTerm, statusFilter]);

  // Handle QR / Pass code submission
  async function handleScanSubmit(e: FormEvent) {
    e.preventDefault();
    const rawCode = scannerInput.trim();
    if (!rawCode) return;

    // Clean code if user or scanner passed "PASS-..." prefix
    const cleanCode = rawCode.startsWith('PASS-')
      ? rawCode.replace('PASS-', '')
      : rawCode;

    setIsScanning(true);
    try {
      const result = await scanQRCode(cleanCode);
      setScanMessage({
        type: 'success',
        text: `Success! Attendee verified and checked in at ${new Date(result.checkedInAt || Date.now()).toLocaleTimeString()}`
      });
      setScannerInput('');
      await loadData();
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        'Invalid pass code or attendee is already checked in.';
      setScanMessage({
        type: 'error',
        text: errMsg
      });
    } finally {
      setIsScanning(false);
    }
  }

  // Handle 1-click manual check-in
  async function handleManualCheckIn(qrCode: string, attendeeName: string) {
    if (!qrCode) {
      setScanMessage({
        type: 'error',
        text: `No QR ticket found for ${attendeeName}.`
      });
      return;
    }

    setIsScanning(true);
    try {
      await scanQRCode(qrCode);
      setScanMessage({
        type: 'success',
        text: `✓ ${attendeeName} checked in successfully!`
      });
      await loadData();
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setScanMessage({
        type: 'error',
        text:
          error?.response?.data?.message ||
          error?.message ||
          `Unable to check in ${attendeeName}.`
      });
    } finally {
      setIsScanning(false);
    }
  }

  // Export CSV
  function exportCSV() {
    const headers = [
      'Attendee Name',
      'Email',
      'Registration Date',
      'Check-In Status',
      'Checked-In At',
      'Pass Code'
    ];
    const rows = attendeesWithStatus.map((a) => [
      `"${a.attendeeName}"`,
      `"${a.attendeeEmail}"`,
      `"${new Date(a.createdAt).toISOString()}"`,
      `"${a.isCheckedIn ? 'Checked-In' : 'Pending'}"`,
      `"${a.checkedInAt ? new Date(a.checkedInAt).toISOString() : ''}"`,
      `"${a.qrCode}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${eventTitle.toLowerCase().replace(/\s+/g, '_')}_attendance.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Registered
            </span>
            <Users className="size-4 text-primary" />
          </div>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
            {totalCount}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Enrolled attendees
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Checked In
            </span>
            <CheckCircle2 className="size-4" />
          </div>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-950 dark:text-emerald-100">
            {checkedInCount}
          </p>
          <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-300/80">
            Present at venue
          </p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Pending Check-in
            </span>
            <Clock className="size-4" />
          </div>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-amber-950 dark:text-amber-100">
            {pendingCount}
          </p>
          <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-300/80">
            Yet to arrive
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Attendance Rate
            </span>
            <span className="text-xs font-bold text-primary">
              {turnoutRate}%
            </span>
          </div>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
            {turnoutRate}%
          </p>
          <div className="mt-2 w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${turnoutRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Scanner & Verification Bar */}
      <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <QrCode className="size-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">
              Attendance Check-In Scanner
            </h3>
            <p className="text-xs text-muted-foreground">
              Scan barcode/QR ticket or enter pass code to instantly check in an
              attendee.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleScanSubmit}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={scannerInput}
              onChange={(e) => setScannerInput(e.target.value)}
              placeholder="Scan or paste student QR code / ticket pass (e.g. PASS-8F4B1A2C...)"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 font-mono text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={isScanning || !scannerInput.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
          >
            {isScanning ? 'Verifying...' : 'Verify & Check In'}
          </button>
        </form>

        {scanMessage ? (
          <div
            className={`flex items-center justify-between rounded-xl px-4 py-3 text-xs font-medium border ${
              scanMessage.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-900 dark:text-emerald-100'
                : 'border-rose-500/30 bg-rose-500/15 text-rose-900 dark:text-rose-100'
            }`}
          >
            <div className="flex items-center gap-2">
              {scanMessage.type === 'success' ? (
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="size-4 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span>{scanMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setScanMessage(null)}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Dismiss
            </button>
          </div>
        ) : null}
      </div>

      {/* Attendee Roster Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by attendee name, email, or pass code..."
            className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2 text-sm text-foreground outline-none transition focus:border-primary"
          />
        </div>

        {/* Filter Tabs & Export */}
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-border bg-muted/30 p-1">
            {(
              [
                { id: 'all', label: `All (${totalCount})` },
                { id: 'checked-in', label: `Checked In (${checkedInCount})` },
                { id: 'pending', label: `Pending (${pendingCount})` }
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === tab.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={exportCSV}
            disabled={totalCount === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground transition hover:bg-muted disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <Download className="size-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Attendees Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {filteredAttendees.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center">
              <Users className="size-6 text-muted-foreground" />
            </div>
            <h4 className="font-semibold text-base text-foreground">
              No attendees found
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm">
              {searchTerm
                ? 'No participants matched your search term.'
                : 'No attendees have registered for this event yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-3.5">Attendee</th>
                  <th className="px-6 py-3.5">Ticket Pass Code</th>
                  <th className="px-6 py-3.5">Registration Time</th>
                  <th className="px-6 py-3.5">Check-In Status</th>
                  <th className="px-6 py-3.5 text-right">Desk Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredAttendees.map((attendee) => (
                  <tr
                    key={attendee.id}
                    className="transition hover:bg-muted/20"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">
                        {attendee.attendeeName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {attendee.attendeeEmail}
                      </div>
                      {attendee.customResponses &&
                        Object.keys(attendee.customResponses).length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedAttendee(attendee)}
                            className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer"
                          >
                            <FileSpreadsheet className="size-3" /> View Form
                            Answers
                          </button>
                        )}
                    </td>

                    <td className="px-6 py-4">
                      {attendee.qrCode ? (
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-bold text-foreground">
                            {attendee.qrCode.substring(0, 12).toUpperCase()}
                          </code>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(attendee.qrCode, attendee.id)
                            }
                            className="text-muted-foreground hover:text-foreground transition"
                            title="Copy Code"
                          >
                            {copiedCode === attendee.id ? (
                              <Check className="size-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          No code assigned
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {new Date(attendee.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>

                    <td className="px-6 py-4">
                      {attendee.isCheckedIn ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-3.5" />
                          Checked In
                          {attendee.checkedInAt && (
                            <span className="text-[10px] opacity-80">
                              (
                              {new Date(
                                attendee.checkedInAt
                              ).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                              )
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                          <Clock className="size-3.5" /> Pending
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {attendee.isCheckedIn ? (
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          Verified
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            handleManualCheckIn(
                              attendee.qrCode,
                              attendee.attendeeName
                            )
                          }
                          disabled={isScanning || !attendee.qrCode}
                          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                        >
                          Check In
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custom Responses Modal */}
      {selectedAttendee && selectedAttendee.customResponses && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg text-foreground">
                  Registration Answers
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Attendee:{' '}
                  <strong className="text-foreground">
                    {selectedAttendee.attendeeName}
                  </strong>{' '}
                  ({selectedAttendee.attendeeEmail})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAttendee(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {Object.entries(selectedAttendee.customResponses).map(
                ([fieldKey, answer]) => (
                  <div
                    key={fieldKey}
                    className="rounded-xl border border-border bg-muted/20 p-3 space-y-1"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {fieldKey}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {Array.isArray(answer)
                        ? answer.join(', ')
                        : typeof answer === 'boolean'
                          ? answer
                            ? 'Yes'
                            : 'No'
                          : String(answer || 'N/A')}
                    </p>
                  </div>
                )
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAttendee(null)}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
