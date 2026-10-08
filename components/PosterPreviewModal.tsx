"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { DownloadSimple, ShareNetwork } from "@phosphor-icons/react";
import { ReviewDialog } from "./ReviewDialog";
const SHARE_TEXT="Here’s my 2026 LA TECH WEEK — create yours at lineup.product.ai";

export function PosterPreviewModal({ blob, name, onClose }: { blob:Blob; name?:string; onClose:()=>void }) {
  const [url,setUrl]=useState("");
  const [message,setMessage]=useState("");
  useEffect(()=>{const next=URL.createObjectURL(blob);const frame=requestAnimationFrame(()=>setUrl(next));return()=>{cancelAnimationFrame(frame);URL.revokeObjectURL(next);};},[blob]);
  const download=()=>{const link=document.createElement("a");link.href=url;link.download="la-tech-week-lineup.png";document.body.appendChild(link);link.click();link.remove();};
  const copyCaption=async()=>{try{await navigator.clipboard.writeText(SHARE_TEXT);setMessage("Caption copied.");}catch{setMessage(`Copy this caption: ${SHARE_TEXT}`);}};
  const share=async()=>{
    const file=new File([blob],"la-tech-week-lineup.png",{type:"image/png"});
    try {
      if(!navigator.share||!navigator.canShare?.({files:[file]})){setMessage(`File sharing isn’t supported here. Download the PNG and use this caption: ${SHARE_TEXT}`);return;}
      await navigator.share({files:[file],title:name?`${name}’s LA Tech Week lineup`:"My LA Tech Week lineup",text:SHARE_TEXT});
      setMessage("Poster handed to your device’s share service.");
    } catch(error) {
      if(error instanceof DOMException&&error.name==="AbortError")setMessage("Sharing cancelled. Your poster is still ready to download.");
      else setMessage("Sharing isn’t available right now. Download the PNG and upload it in your preferred app.");
    }
  };
  return <ReviewDialog title="Your lineup poster" onClose={onClose}>{url?<Image className="poster-preview-image" src={url} width={1080} height={1350} alt="Preview of your selected LA Tech Week lineup" unoptimized/>:<p role="status">Loading preview…</p>}<div className="dialog-actions"><button className="button primary" disabled={!url} onClick={download}><DownloadSimple size={20}/>Download</button><button className="button" onClick={share}><ShareNetwork size={20}/>Share</button><button className="button" onClick={copyCaption}>Copy caption</button></div><p className="sample-label">Share destinations depend on your device and installed apps. You can always download the PNG.</p>{message&&<p role="status">{message}</p>}</ReviewDialog>;
}
