import { avatarFaces,avatarFill,faceAvatar } from "@/lib/avatar";

export function Avatar({config,label="Your avatar",round=true}:{config:unknown;label?:string;round?:boolean}){
  const state=faceAvatar(config),face=avatarFaces.find(face=>face.id===state.face)!;
  return <svg className={round?"avatar-circle":"avatar-face-tile"} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={label} viewBox="0 0 1000 1000">{round?<circle cx="500" cy="500" r="500" fill={state.color}/>:<rect width="1000" height="1000" fill={state.color}/>}<g transform={round?"translate(90 90) scale(0.82)":undefined}>{face.p.map(([role,d],i)=><path key={i} d={d} fill={avatarFill(role,state.color)}/>)}</g></svg>;
}
