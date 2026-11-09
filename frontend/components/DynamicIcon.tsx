import React from 'react';
import * as LucideIcons from 'lucide-react';

export interface DynamicIconProps extends LucideIcons.LucideProps {
  name?: string;
  fallback?: React.ElementType;
}

/**
 * Dynamically resolves a Lucide React icon by string name with fallback.
 */
export function resolveLucideIcon(
  name?: string,
  fallback: React.ElementType = LucideIcons.Settings
): React.ElementType {
  if (!name) return fallback;
  const icon = (LucideIcons as unknown as Record<string, React.ElementType>)[
    name
  ];
  return icon && typeof icon === 'function' ? icon : fallback;
}

/**
 * Dynamically renders Lucide React icons by string name with fallback (Issue #162).
 * Allows plugins to supply any valid Lucide icon name without hardcoding.
 */
export function DynamicIcon({
  name,
  fallback: Fallback = LucideIcons.Settings,
  ...props
}: DynamicIconProps) {
  return React.createElement(resolveLucideIcon(name, Fallback), props);
}

export default DynamicIcon;
