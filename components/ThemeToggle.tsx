"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

const subscribe=(callback:()=>void)=>{window.addEventListener("storage",callback);window.addEventListener("techweek-theme",callback);return()=>{window.removeEventListener("storage",callback);window.removeEventListener("techweek-theme",callback)}};
const readOverride=()=>{const saved=localStorage.getItem("techWeekThemeOverride");return saved==="dark"||saved==="light"?saved:null};
export function useTheme(){const path=usePathname().replace(/\/+$/,"")||"/";const override=useSyncExternalStore(subscribe,readOverride,()=>null);return override||(path==="/"||path.endsWith("/plan")?"dark":"light")}

export function usePageTheme() {
  const theme = useTheme();
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);
}

export function ThemeToggle() {
  const theme = useTheme();
  const override=useSyncExternalStore(subscribe,readOverride,()=>null);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    localStorage.setItem("techWeekThemeOverride", next);window.dispatchEvent(new Event("techweek-theme"));
  };
  return <><button className="theme-toggle" onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title="Toggle color theme">{theme === "dark" ? "☼" : "◐"}</button>{override&&<button className="theme-toggle" onClick={()=>{localStorage.removeItem("techWeekThemeOverride");window.dispatchEvent(new Event("techweek-theme"))}} aria-label="Use page theme defaults" title="Use page theme defaults">Auto</button>}</>;
}
