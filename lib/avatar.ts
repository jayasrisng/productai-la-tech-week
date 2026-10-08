import suppliedFaces from "@/data/avatar-faces.json";
import { safeAvatar as safeLegacyAvatar, DEFAULT_AVATAR as LEGACY_DEFAULT, type AvatarConfig as LegacyAvatarConfig } from "./avatar-legacy";

export const avatarFaces=suppliedFaces;
export const avatarColors=[{name:"Violet",value:"#8B5CF6"},{name:"Sky",value:"#38BDF8"},{name:"Green",value:"#02BB64"},{name:"Amber",value:"#FBBF24"},{name:"Orange",value:"#FB923C"},{name:"Red",value:"#EF4444"},{name:"Pink",value:"#F472B6"}];
export type FaceAvatarConfig={v:2;face:string;color:string};
export type AvatarConfig=FaceAvatarConfig|LegacyAvatarConfig;
export const DEFAULT_AVATAR:FaceAvatarConfig={v:2,face:avatarFaces[0].id,color:avatarColors[0].value};
export function safeAvatar(raw:unknown):AvatarConfig {
  if(!raw||typeof raw!=="object")return DEFAULT_AVATAR;
  const x=raw as Record<string,unknown>;
  if(x.v===1){const legacy=safeLegacyAvatar(raw);return legacy===LEGACY_DEFAULT?DEFAULT_AVATAR:legacy;}
  if(x.v!==2||!avatarFaces.some(face=>face.id===x.face)||!avatarColors.some(color=>color.value===x.color))return DEFAULT_AVATAR;
  return {v:2,face:x.face as string,color:x.color as string};
}
// Old stored configs remain untouched. Only saving the new picker replaces one.
export function faceAvatar(raw:unknown):FaceAvatarConfig {const config=safeAvatar(raw);return config.v===2?config:DEFAULT_AVATAR;}
export function avatarFill(role:string,color:string){return role==="white"?"#FFFFFF":role==="accent"?(color==="#EF4444"||color==="#FB923C"?"#F472B6":"#EF4444"):"#18181B";}
