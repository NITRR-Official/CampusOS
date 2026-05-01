'use client';

import { useTheme } from '@/lib/theme-provider';
import { Sun, Moon } from 'lucide-react';
import { Button } from './ui/button';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="h-10 w-10 p-0"
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5 text-neutral-700" />
      ) : (
        <Sun className="h-5 w-5 text-neutral-300" />
      )}
    </Button>
  );
}
