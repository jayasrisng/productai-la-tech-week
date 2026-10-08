import parts from "@/data/avatar-parts.json";
export const skinTones=[{name:"Porcelain",value:"#FFE4D9"},{name:"Pale",value:"#FFCDBD"},{name:"Olive",value:"#C9935E"},{name:"Tan",value:"#D2834F"},{name:"Medium brown",value:"#B4683F"},{name:"Brown",value:"#8B4A2A"},{name:"Deep brown",value:"#5C2A22"},{name:"Very dark brown",value:"#3D1D18"}];
export const hairColors=[{name:"Black",value:"#1B1A1D"},{name:"Brown",value:"#6A3D24"},{name:"Blonde",value:"#F0CF84"},{name:"Red",value:"#A23B26"},{name:"Silver",value:"#B9B9BF"}];
export const backgrounds=[{name:"Sky",value:"#7DD3FC"},{name:"Coral",value:"#FDBA74"},{name:"Mint",value:"#68FFB8"},{name:"Gold",value:"#FBBF24"},{name:"Rose",value:"#F9A8D4"}];
export const avatarParts=parts.items;
export type AvatarConfig={v:1;preset:number;skin:number;hair:string|null;hairColor:number;mouth:string;eyewear:string|null;headwear:string|null;background:number};
const hair=parts.items.filter(item=>item.cat==="hair");
const mouth=parts.items.filter(item=>item.cat==="mouth");
const hats=parts.items.filter(item=>item.cat==="headwear");
const glasses=parts.items.filter(item=>item.cat==="eyewear");
export const avatarPresets:AvatarConfig[]=Array.from({length:15},(_,i)=>({v:1,preset:i,skin:i%skinTones.length,hair:i===12?null:hair[i%hair.length].id,hairColor:i%hairColors.length,mouth:mouth[i%mouth.length].id,eyewear:i===13?glasses[0].id:null,headwear:i===14?hats.find(item=>item.name==="Hijab")!.id:null,background:i%backgrounds.length}));
export const DEFAULT_AVATAR=avatarPresets[0];
export function safeAvatar(raw:unknown):AvatarConfig {
  if(!raw||typeof raw!=="object")return DEFAULT_AVATAR;
  const x=raw as AvatarConfig;
  const index=(n:number,length:number)=>Number.isInteger(n)&&n>=0&&n<length;
  const item=(id:string|null,cat:string)=>id===null||parts.items.some(p=>p.id===id&&p.cat===cat);
  if(x.v!==1||!index(x.preset,15)||!index(x.skin,skinTones.length)||!index(x.hairColor,hairColors.length)||!index(x.background,backgrounds.length)||!item(x.hair,"hair")||!item(x.mouth,"mouth")||!x.mouth||!item(x.eyewear,"eyewear")||!item(x.headwear,"headwear"))return DEFAULT_AVATAR;
  return {v:1,preset:x.preset,skin:x.skin,hair:x.hair,hairColor:x.hairColor,mouth:x.mouth,eyewear:x.eyewear,headwear:x.headwear,background:x.background};
}
