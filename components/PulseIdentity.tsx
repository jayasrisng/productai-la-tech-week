"use client";
import { useState } from "react";
import { Avatar } from "./Avatar";
import { AvatarPicker } from "./AvatarPicker";
import { useAvatar } from "./useAvatar";
import { usePulseName } from "./usePulseName";
export function PulseIdentity(){
  const [avatar,setAvatar]=useAvatar(),[name,setName]=usePulseName();
  const [editing,setEditing]=useState(false),[draft,setDraft]=useState<string|null>(null),[saved,setSaved]=useState(false);
  return <section className="lineup-identity wrap" aria-label="Your name and avatar">
    {editing&&<AvatarPicker initial={avatar} onClose={()=>setEditing(false)} onDone={config=>{setAvatar(config);setEditing(false);}}/>}
    <button className="identity-avatar" onClick={()=>setEditing(true)} aria-label="Customize your avatar"><Avatar config={avatar}/><span>Edit avatar</span></button>
    <div className="identity-copy"><h2>Your name and avatar</h2><p>Saved in this browser. Don’t clear this site’s data.</p>
      <form onSubmit={event=>{event.preventDefault();setName(draft??name);setDraft(null);setSaved(true);}}><label>Display name<input value={draft??name} onChange={event=>{setDraft(event.target.value);setSaved(false);}} maxLength={60} autoComplete="nickname" placeholder="What should we call you?"/></label><button className="button small" type="submit">Save name</button>{saved&&<span role="status">Saved.</span>}</form>
    </div>
  </section>;
}
