"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const darkRoutes = new Set(["/", "/plan"]);

export function usePageTheme() {
  const pathname = usePathname();
  useEffect(() => {
    const override = localStorage.getItem("techWeekThemeOverride");
    document.documentElement.dataset.theme = override || (darkRoutes.has(pathname) ? "dark" : "light");
  }, [pathname]);
}

export function ThemeToggle() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return darkRoutes.has(pathname) ? "dark" : "light";
    const saved = localStorage.getItem("techWeekThemeOverride");
    return (saved === "dark" || saved === "light") ? saved : (darkRoutes.has(pathname) ? "dark" : "light");
  });
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next); localStorage.setItem("techWeekThemeOverride", next); document.documentElement.dataset.theme = next;
  };
  return <button className="theme-toggle" onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title="Toggle color theme">{theme === "dark" ? "☼" : "◐"}</button>;
}
