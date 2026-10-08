"use client";
import { useMemo, useSyncExternalStore } from "react";
import { DEFAULT_AVATAR, safeAvatar, type AvatarConfig } from "@/lib/avatar";

const KEY="lineupV3Avatar", EVENT="lineup-v3-avatar";
const subscribe=(callback:()=>void)=>{window.addEventListener("storage",callback);window.addEventListener(EVENT,callback);return()=>{window.removeEventListener("storage",callback);window.removeEventListener(EVENT,callback);};};
const snapshot=()=>{try{return localStorage.getItem(KEY)||"";}catch{return "";}};
export function useAvatar() {
  const raw=useSyncExternalStore(subscribe,snapshot,()=>"");
  const avatar=useMemo(()=>{try{return safeAvatar(JSON.parse(raw));}catch{return DEFAULT_AVATAR;}},[raw]);
  const setAvatar=(config:AvatarConfig)=>{localStorage.setItem(KEY,JSON.stringify(safeAvatar(config)));window.dispatchEvent(new Event(EVENT));};
  // Presence publishing is opt-in elsewhere. This only says whether the person
  // deliberately saved an AvatarConfig in this browser.
  return [avatar,setAvatar,Boolean(raw)] as const;
}
