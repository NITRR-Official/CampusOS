import Link from 'next/link';
import { ReactNode } from 'react';
import { Card } from '@campusos/design-system';

interface AuthShellProps {
  title: string;
  subtitle: string;
  alternateHref: string;
  alternateActionLabel: string;
  alternateActionText: string;
  children: ReactNode;
}

export default function AuthShell({
  title,
  subtitle,
  alternateHref,
  alternateActionLabel,
  alternateActionText,
  children
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_10%_20%,rgba(56,189,248,0.2),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(20,184,166,0.18),transparent_35%),linear-gradient(160deg,#020617_0%,#0f172a_45%,#111827_100%)] flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 bg-slate-900/70 backdrop-blur-lg border-slate-700/70 shadow-[0_20px_80px_rgba(2,6,23,0.55)]">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-100">
            {title}
          </h1>
          <p className="mt-2 text-sm text-slate-300">{subtitle}</p>
        </div>

        {children}

        <p className="mt-6 text-sm text-slate-300">
          {alternateActionLabel}{' '}
          <Link
            href={alternateHref}
            className="font-semibold text-cyan-300 hover:text-cyan-200"
          >
            {alternateActionText}
          </Link>
        </p>
      </Card>
    </div>
  );
}
