'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button variant="ghost" size="sm" className="h-10 w-10 p-0" />;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
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
