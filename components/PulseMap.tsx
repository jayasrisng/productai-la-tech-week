"use client";
import { displayTime } from "@/lib/display-copy";
import { useRef, useState } from "react";
import type { PointerEvent, CSSProperties } from "react";
import Image from "next/image";
import { assetUrl } from "@/lib/assets";
import { EventArtwork } from "./EventArtwork";
import { Avatar } from "./Avatar";
import type { PublicPresence } from "@/lib/visit-client";
import { NEIGHBORHOOD_LOCATIONS, PRODUCTAI_LOCATION, mapPosition, reliableLocation } from "@/lib/pulse";
import type { Coordinates, pulseNeighborhoods } from "@/lib/pulse";
import type { EventItem } from "@/types/event";

const tiles=["349-816","350-816","351-816","352-816","349-817","350-817","351-817","352-817","349-818","350-818","351-818","352-818"];
type Center={x:number;y:number};
function bound(value:number,zoom:number){return zoom<1?50:Math.max(50/zoom,Math.min(100-50/zoom,value));}
export function PulseMap({neighborhoods,active,visible,area,onArea,showProduct,onProduct,location,presence}:{neighborhoods:ReturnType<typeof pulseNeighborhoods>;active:EventItem[];visible:EventItem[];area:string;onArea:(area:string)=>void;showProduct:boolean;onProduct:()=>void;location:Coordinates|null;presence:readonly PublicPresence[]}){
  const [chosenZoom,setZoom]=useState<number|null>(null),[center,setCenter]=useState<Center>({x:50,y:50}),[opened,setOpened]=useState<string|null>(null);
  const drag=useRef<{x:number;y:number;center:Center;width:number;height:number}|null>(null);
  const markers=neighborhoods.flatMap(([name,info])=>{const point=NEIGHBORHOOD_LOCATIONS[name],position=point&&mapPosition(point,true);return position?[{name,info,position}]:[];});
  const overviewZoom=markers.some(({position})=>parseFloat(position.left)<0||parseFloat(position.left)>100||parseFloat(position.top)<0||parseFloat(position.top)>100)?.5:1;
  const zoom=chosenZoom??overviewZoom;
  const hqPosition=mapPosition(PRODUCTAI_LOCATION)!;
  const hqTarget={x:50+(parseFloat(hqPosition.left)-center.x)*zoom,y:50+(parseFloat(hqPosition.top)-center.y)*zoom};
  const peopleWithAvatars=presence.filter(person=>person.avatarConfig);
  const hasAvatars=peopleWithAvatars.length>0;
  const crowdedHQ=peopleWithAvatars.length>10;
  const clearOfPeople=(point:Center)=>!hasAvatars||Math.abs(point.x-hqTarget.x)>=28||Math.abs(point.y-(hqTarget.y-(crowdedHQ?20:0)))>=(crowdedHQ?28:22);
  const occupied:Center[]=[];
  let crowded=false;
  // Move callouts, never geographic anchors. Leader lines keep crowded areas legible.
  const laidOut=markers.map(marker=>{
    const target={x:50+(parseFloat(marker.position.left)-center.x)*zoom,y:50+(parseFloat(marker.position.top)-center.y)*zoom};
    const candidates=[{x:target.x,y:target.y},...[-20,20,-40,40].map(offset=>({x:target.x,y:target.y+offset})),...[-38,38].flatMap(offset=>[0,-20,20].map(dy=>({x:target.x+offset,y:target.y+dy}))),... [20,50,80].flatMap(y=>[22,78].map(x=>({x,y})))].map(point=>({x:Math.max(20,Math.min(80,point.x)),y:Math.max(12,Math.min(86,point.y))}));
    const free=candidates.find(point=>clearOfPeople(point)&&occupied.every(other=>Math.abs(point.x-other.x)>=39||Math.abs(point.y-other.y)>=19));
    if(!free)crowded=true;
    const label=free??candidates.at(-1)!;
    occupied.push(label);return {...marker,target,label};
  });
  const freeCells=[20,50,80].flatMap(y=>[22,78].map(x=>({x,y})));
  const callouts=(crowded?laidOut.map(marker=>{freeCells.sort((a,b)=>Number(!clearOfPeople(a))*1000000-Number(!clearOfPeople(b))*1000000+(a.x-marker.target.x)**2+(a.y-marker.target.y)**2-((b.x-marker.target.x)**2+(b.y-marker.target.y)**2));return {...marker,label:freeCells.shift()!};}):laidOut).filter(({target})=>target.x>=0&&target.x<=100&&target.y>=0&&target.y<=100);
  const exactPins=visible.flatMap((event,index)=>{const venue=reliableLocation(event),position=venue&&mapPosition(venue);return position?[{event,index,position}]:[];});
  const areaEvents=active.filter(event=>event.neighborhood===opened);
  const openArea=(name:string,position:{left:string;top:string})=>{onArea(name);setOpened(name);const outside=parseFloat(position.left)<0||parseFloat(position.left)>100||parseFloat(position.top)<0||parseFloat(position.top)>100;const nextZoom=outside?.5:Math.max(zoom,1.5);setZoom(nextZoom);setCenter({x:bound(parseFloat(position.left),nextZoom),y:bound(parseFloat(position.top),nextZoom)});};
  const changeZoom=(next:number)=>{setZoom(next);setCenter(old=>({x:bound(old.x,next),y:bound(old.y,next)}));};
  const startDrag=(event:PointerEvent<HTMLDivElement>)=>{if((event.target as HTMLElement).closest("button,a,section")||zoom===1)return;const box=event.currentTarget.getBoundingClientRect();drag.current={x:event.clientX,y:event.clientY,center,width:box.width,height:box.height};event.currentTarget.setPointerCapture(event.pointerId);};
  const moveDrag=(event:PointerEvent<HTMLDivElement>)=>{if(!drag.current)return;const start=drag.current;setCenter({x:bound(start.center.x-(event.clientX-start.x)/start.width*100/zoom,zoom),y:bound(start.center.y-(event.clientY-start.y)/start.height*100/zoom,zoom)});};
  return <div className="pulse-map" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
    <div className="pulse-map-world" data-zoom={zoom} style={{"--map-zoom":zoom,transform:`translate(${50-center.x*zoom}%,${50-center.y*zoom}%) scale(${zoom})`} as CSSProperties}>
      <div className="map-tiles">{tiles.map(tile=><Image key={tile} src={assetUrl(`/maps/la/${tile}.png`)} alt="" width={256} height={256} unoptimized draggable={false}/>)}</div>
      {markers.map(({name,position})=><span key={name} className="pulse-area-anchor" style={position}/>)}
      {exactPins.map(({event,index,position})=><a className="pulse-event-pin" key={event.id} style={position} href={`#pulse-${event.id}`} title={event.name}>{index+1}<span>{event.name}</span></a>)}
      <button className="pulse-hq-pin" style={mapPosition(PRODUCTAI_LOCATION)!} aria-label="Product.ai planned presence" aria-pressed={showProduct} onClick={()=>{setOpened(null);onProduct();}}>P<span>Product.ai HQ</span></button>
      {hasAvatars&&<ul className={`pulse-hq-people${crowdedHQ?" pulse-hq-people-crowded":""}`} style={hqPosition} aria-label="Planning to be at Product.ai HQ at selected time">{peopleWithAvatars.map((person,index)=><li key={`${person.displayName}-${person.startsAt}-${index}`} title={person.displayName}><Avatar config={person.avatarConfig} label={person.displayName}/></li>)}</ul>}
      {location&&mapPosition(location)&&<span className="pulse-you-pin" aria-label="Your approximate location" style={mapPosition(location)!}/>}
    </div>
    <svg className="pulse-map-leaders" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{callouts.map(({name,target,label})=><line key={name} x1={target.x} y1={target.y} x2={label.x} y2={label.y}/>)}</svg>
    {callouts.map(({name,info,position,label})=><button key={name} className="pulse-area-pin" style={{left:`${label.x}%`,top:`${label.y}%`}} aria-label={`${name} · ${info.count.replace(/ live$/, " on")}`} aria-pressed={area===name} onClick={()=>openArea(name,position)}><strong>{info.active}</strong><span>{name}<small>{info.count.replace(/ live$/, " on")}</small></span></button>)}
    <div className="pulse-zoom" aria-label="Map zoom controls"><button aria-label="Zoom in" disabled={zoom>=4} onClick={()=>changeZoom(Math.min(4,zoom+.5))}>＋</button><button aria-label="Zoom out" disabled={zoom<=.5} onClick={()=>changeZoom(Math.max(.5,zoom-.5))}>−</button><button className="pulse-map-reset" aria-label="Reset map" onClick={()=>{setZoom(null);setCenter({x:50,y:50});setOpened(null);}}>↺</button></div>
    {opened&&area===opened&&<section className="pulse-area-popup" aria-label={`${opened} events on at selected time`}><header><div><h3>{opened}</h3><p>{areaEvents.length} event{areaEvents.length===1?"":"s"} on at this time</p></div><button aria-label="Close area events" onClick={()=>setOpened(null)}>×</button></header>{areaEvents.length?<ul>{areaEvents.slice(0,5).map(event=><li key={event.id}><EventArtwork eventId={event.id} title={event.name}/><a href={`#pulse-${event.id}`}>{event.name}<small>{displayTime(event.startTimeDisplay)} · View in feed ↓</small></a></li>)}</ul>:<p>Nothing on here at this time.</p>}</section>}
    <div className="map-credit">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> · HOT style</div>
  </div>;
}
