'use client';

import React from 'react';
import { Badge } from '@campusos/design-system';
import { Database, Zap, Globe, Layout, ShieldAlert, Cpu } from 'lucide-react';

interface PluginCapabilityBadgeProps {
  capability: string;
  className?: string;
}

export function PluginCapabilityBadge({
  capability,
  className = ''
}: PluginCapabilityBadgeProps) {
  const cap = capability.toLowerCase();

  let icon = <Cpu className="size-3 mr-1" />;
  let colorClasses =
    'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20';

  if (cap === '*' || cap === 'all') {
    icon = <ShieldAlert className="size-3 mr-1 text-red-500" />;
    colorClasses =
      'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 font-semibold';
  } else if (cap.startsWith('db:')) {
    icon = <Database className="size-3 mr-1 text-amber-500" />;
    colorClasses =
      'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
  } else if (cap.startsWith('events:')) {
    icon = <Zap className="size-3 mr-1 text-purple-500" />;
    colorClasses =
      'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20';
  } else if (cap.startsWith('network:')) {
    icon = <Globe className="size-3 mr-1 text-blue-500" />;
    colorClasses =
      'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
  } else if (cap.startsWith('ui:')) {
    icon = <Layout className="size-3 mr-1 text-emerald-500" />;
    colorClasses =
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
  }

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full border ${colorClasses} ${className}`}
    >
      {icon}
      <span>{capability}</span>
    </Badge>
  );
}

export default PluginCapabilityBadge;
