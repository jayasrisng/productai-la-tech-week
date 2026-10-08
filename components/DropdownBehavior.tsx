"use client";
import { useEffect } from "react";

export function DropdownBehavior() {
  useEffect(()=>{
    // Only overlay menus dismiss on outside clicks. Inline disclosures keep
    // their reading state while people interact elsewhere on the page.
    const overlays=".multi-filter details[open], .visit-guidance[open], .registration-disclosure[open], .rsvp-helper details[open]";
    const close=(event:PointerEvent)=>{
      document.querySelectorAll<HTMLDetailsElement>(overlays).forEach(details=>{
        if(event.target instanceof Node&&!details.contains(event.target))details.open=false;
      });
    };
    const escape=(event:KeyboardEvent)=>{
      if(event.key!=="Escape")return;
      const open=[...document.querySelectorAll<HTMLDetailsElement>(overlays)];
      open.forEach(details=>{details.open=false;});
      if(open.length){event.preventDefault();open.at(-1)?.querySelector("summary")?.focus();}
    };
    document.addEventListener("pointerdown",close);
    document.addEventListener("keydown",escape);
    return()=>{document.removeEventListener("pointerdown",close);document.removeEventListener("keydown",escape);};
  },[]);
  return null;
}
