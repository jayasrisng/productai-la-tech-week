"use client";
import { useSyncExternalStore } from "react";
const KEY="lineupV3DisplayName", EVENT="lineup-v3-name";
const subscribe=(callback:()=>void)=>{window.addEventListener("storage",callback);window.addEventListener(EVENT,callback);return()=>{window.removeEventListener("storage",callback);window.removeEventListener(EVENT,callback);};};
const snapshot=()=>{try{return localStorage.getItem(KEY)||"";}catch{return "";}};
export function usePulseName(){
  const name=useSyncExternalStore(subscribe,snapshot,()=>"");
  const setName=(value:string)=>{localStorage.setItem(KEY,value.replace(/[\x00-\x1f\x7f]/g,"").trim().slice(0,60));window.dispatchEvent(new Event(EVENT));};
  return [name,setName] as const;
}
