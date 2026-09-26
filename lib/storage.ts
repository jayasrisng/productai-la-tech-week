"use client";
import { useCallback, useEffect, useState } from "react";
export function useLocalStorage<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);
  useEffect(() => { try { const saved = localStorage.getItem(key); if (saved) setValue(JSON.parse(saved)); } finally { setReady(true); } }, [key]);
  useEffect(() => { if (ready) localStorage.setItem(key, JSON.stringify(value)); }, [key, ready, value]);
  const updateValue=useCallback((next:T)=>{setValue(next);localStorage.setItem(key,JSON.stringify(next))},[key]);
  return [value, updateValue, ready] as const;
}
