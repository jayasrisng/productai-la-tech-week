"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const subscribe=(callback:()=>void)=>{window.addEventListener("storage",callback);window.addEventListener("techweek-theme",callback);return()=>{window.removeEventListener("storage",callback);window.removeEventListener("techweek-theme",callback)}};
const readOverride=()=>{const saved=localStorage.getItem("techWeekThemeOverride");return saved==="dark"||saved==="light"?saved:null};
export function useTheme(){const override=useSyncExternalStore(subscribe,readOverride,()=>null);return override||"dark"}

export function usePageTheme() {
  const theme = useTheme();
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);
}

export function ThemeToggle() {
  const theme = useTheme();
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    localStorage.setItem("techWeekThemeOverride", next);window.dispatchEvent(new Event("techweek-theme"));
  };
  return <button className="theme-toggle" onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>{theme === "dark" ? <Sun size={18} aria-hidden="true"/> : <Moon size={18} aria-hidden="true"/>}</button>;
}
