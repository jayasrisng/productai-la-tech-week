"use client";
import { useState } from "react";
import Image from "next/image";
import { assetUrl } from "@/lib/assets";
import artwork from "@/data/event-artwork.json";
import { SampleArtwork } from "./SampleArtwork";
import { productExperiences } from "@/lib/product-experiences";

type ArtEntry = { src:string; alt:string; provenance:string };
export function EventArtwork({ eventId, title }: { eventId:string; title:string }) {
  const experience=productExperiences.find(item=>item.catalogId===eventId);
  const entry=(experience?.artwork?{src:experience.artwork,alt:experience.name,provenance:"Product.ai event artwork"}:undefined)??(artwork as Record<string,ArtEntry>)[eventId];
  const [failed,setFailed]=useState(false);
  return <figure className="event-artwork"><div className="poster-thumbnail">{entry&&!failed?<Image src={assetUrl(entry.src)} alt={entry.alt} fill sizes="(max-width: 760px) 100vw, 33vw" onError={()=>setFailed(true)}/>:<SampleArtwork title={title}/>}</div><figcaption>{entry&&!failed?(entry.provenance==="Tech Week event artwork"?"Image from the event listing":null):"LA Tech Week"}</figcaption></figure>;
}
