"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";

export function ReviewDialog({ title, onClose, children }: { title:string; onClose:()=>void; children:ReactNode }) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const dialog=ref.current;if(!dialog)return;const previous=document.activeElement as HTMLElement|null;dialog.showModal();const previousOverflow=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{dialog.close();document.body.style.overflow=previousOverflow;previous?.focus();};},[]);
  return <dialog ref={ref} className="review-dialog" aria-label={title} onCancel={event=>{event.preventDefault();onClose();}}><div className="dialog-header"><h2>{title}</h2><button onClick={onClose} aria-label="Close preview"><X size={20}/></button></div>{children}</dialog>;
}
