import React from 'react';
import * as LucideIcons from 'lucide-react';

export interface DynamicIconProps extends LucideIcons.LucideProps {
  name?: string;
  fallback?: React.ElementType;
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
  if (!name) {
    return <Fallback {...props} />;
  }

  const IconComponent = (
    LucideIcons as unknown as Record<string, React.ElementType>
  )[name];
  if (IconComponent && typeof IconComponent === 'function') {
    return <IconComponent {...props} />;
  }

  return <Fallback {...props} />;
}

export default DynamicIcon;
