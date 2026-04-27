"use client";

import { useEffect, useState } from "react";
import { Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-slate-500 hover:bg-transparent hover:text-slate-900"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      suppressHydrationWarning
    >
      {mounted ? (
        isDark ? (
          <SunMedium className="size-4" />
        ) : (
          <Moon className="size-4" />
        )
      ) : (
        <span className="size-4" aria-hidden="true" />
      )}
    </Button>
  );
}
