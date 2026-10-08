"use client";
import { useState } from "react";
import { Avatar } from "./Avatar";
import { ReviewDialog } from "./ReviewDialog";
import { avatarFaces,avatarColors,faceAvatar,type FaceAvatarConfig } from "@/lib/avatar";

export function AvatarPicker({initial,onDone,onClose}:{initial:unknown;onDone:(config:FaceAvatarConfig)=>void;onClose:()=>void}){
  const [draft,setDraft]=useState(()=>faceAvatar(initial));
  return <ReviewDialog title="Pick a face and a color" onClose={onClose}><div className="face-picker"><section className="face-picker-preview" aria-label="Your avatar preview"><Avatar config={draft}/><button className="button primary" onClick={()=>onDone(draft)}>Done</button><p className="sample-label">Saved in this browser. Don’t clear this site’s data.</p></section><section className="face-picker-options" aria-label="Choose your avatar"><h3>Color</h3><div className="face-colors" role="group" aria-label="Avatar color">{avatarColors.map(color=><button key={color.value} aria-label={color.name} aria-pressed={draft.color===color.value} style={{background:color.value}} onClick={()=>setDraft(current=>({...current,color:color.value}))}/>)}</div><h3>Face</h3><div className="face-grid" role="group" aria-label="Avatar face">{avatarFaces.map((face,i)=><button key={face.id} aria-label={`Face ${i+1}`} aria-pressed={draft.face===face.id} onClick={()=>setDraft(current=>({...current,face:face.id}))}><Avatar config={{...draft,face:face.id}} label={`Face ${i+1}`} round={false}/></button>)}</div></section></div></ReviewDialog>;
}
