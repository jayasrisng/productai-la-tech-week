"use client";

import { ChangeEvent, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { assetUrl } from "@/lib/assets";
import { eventsByCity } from "@/lib/events";
import { useLocalStorage } from "@/lib/storage";
import type { Preferences, TechWeekCity } from "@/types/event";

type Area = { name: string; x: number; y: number; people: number; avatars: string[] };
type Update = { id: string; name: string; avatar?: string; area: string; eventName: string; note: string; time: string; image?: string };

const emptyPrefs: Preferences = { name: "", city: "la", identity: [], goals: [], interests: [], formats: [], excludedFormats: [], locations: [] };

const areas: Record<TechWeekCity, Area[]> = {
  la: [
    { name: "Santa Monica", x: 15, y: 40, people: 42, avatars: ["🧑🏽‍💻", "👩🏻‍🎨", "🧔🏾"] },
    { name: "Venice", x: 19, y: 70, people: 31, avatars: ["👩🏽‍💼", "🧑🏻‍🚀", "👨🏿‍💻"] },
    { name: "Culver City", x: 41, y: 67, people: 27, avatars: ["🧑🏼‍🎨", "👩🏾‍💻", "🧔🏻"] },
    { name: "West Hollywood", x: 55, y: 34, people: 36, avatars: ["👩🏻‍💼", "🧑🏿‍💻", "👩🏼‍🚀"] },
    { name: "Downtown", x: 82, y: 53, people: 54, avatars: ["🧑🏽‍🚀", "👨🏻‍💼", "👩🏿‍🔬"] },
  ],
};

const mapTiles: Record<TechWeekCity, string[]> = {
  la: ["349-816", "350-816", "351-816", "352-816", "349-817", "350-817", "351-817", "352-817", "349-818", "350-818", "351-818", "352-818"],
};

const sampleUpdates: Record<TechWeekCity, Update[]> = {
  la: [
    { id: "la-1", name: "Maya", avatar: "👩🏽‍💻", area: "Culver City", eventName: "AI Founders & Operators Mixer", note: "Example update: the patio has space for small-group conversations.", time: "4m" },
    { id: "la-2", name: "Dev", avatar: "🧑🏻‍🚀", area: "Venice", eventName: "Consumer Tech Sunset Social", note: "The door line is 15 minutes. The courtyard has space.", time: "8m" },
    { id: "la-3", name: "Sara", avatar: "👩🏻‍🎨", area: "Santa Monica", eventName: "Women Building AI Breakfast", note: "Small-group conversations are happening near the back tables. Coffee is quick.", time: "12m", image: assetUrl("/brand/la-tech-week.jpg") },
    { id: "la-4", name: "Noah", avatar: "🧔🏾", area: "West Hollywood", eventName: "Future of Media Dinner", note: "Example update: parking is available near the entrance.", time: "16m" },
    { id: "la-5", name: "Lena", avatar: "👩🏿‍🔬", area: "Downtown", eventName: "Deep Tech Demo Night", note: "Demos have started. The hardware area on the east side is busiest.", time: "21m" },
  ],
};

export default function MissionHQPage() {
  const [prefs] = useLocalStorage<Preferences>("techWeekPreferences", emptyPrefs);
  const [lineupIds] = useLocalStorage<string[]>("techWeekLineup", []);
  const [updates, setUpdates] = useLocalStorage<Update[]>("neighborhoodUpdatesV2", []);
  const city = "la" as const;
  const cityName = "Los Angeles";
  const cityAreas = areas[city];
  const cityEvents = eventsByCity[city];
  const [selectedArea, setSelectedArea] = useState(cityAreas[0].name);
  const [eventName, setEventName] = useState("");
  const [note, setNote] = useState("");
  const [imageData, setImageData] = useState<string>();

  const activeArea = cityAreas.some((area) => area.name === selectedArea) ? selectedArea : cityAreas[0].name;
  const chooseArea = (area: string) => { setSelectedArea(area); setEventName(""); };

  const eventOptions = useMemo(() => {
    const saved = cityEvents.filter((event) => lineupIds.includes(event.id) && event.neighborhood === activeArea);
    const nearby = cityEvents.filter((event) => event.neighborhood === activeArea && event.access.status !== "Closed");
    return [...saved, ...nearby.filter((event) => !saved.some((item) => item.id === event.id))].slice(0, 18);
  }, [cityEvents, lineupIds, activeArea]);

  const currentEventName = eventName || eventOptions[0]?.name || "Neighborhood update";
  const visibleUpdates = [...updates, ...sampleUpdates[city]].filter((update) => update.area === activeArea);
  const selected = cityAreas.find((area) => area.name === activeArea) || cityAreas[0];

  const post = () => {
    if (!note.trim()) return;
    setUpdates([{ id: crypto.randomUUID(), name: prefs.name || "You", avatar: "🙂", area: activeArea, eventName: currentEventName, note: note.trim(), time: "Now", image: imageData }, ...updates]);
    setNote("");
    setImageData(undefined);
  };

  const chooseImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const photo = new window.Image();
      photo.onload = () => {
        const scale = Math.min(1, 1000 / photo.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(photo.width * scale);
        canvas.height = Math.round(photo.height * scale);
        canvas.getContext("2d")!.drawImage(photo, 0, 0, canvas.width, canvas.height);
        setImageData(canvas.toDataURL("image/jpeg", 0.78));
      };
      photo.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return <main>
    <SiteHeader />
    <section className="live-head wrap">
      <div><p className="mono-label">MISSION HQ MOCKUP / {city.toUpperCase()} / DEMO DATA</p><h1>Your week,<br />on the map.</h1><p>Concept only: demo people and reports are not connected to internal calendars or team data.</p></div>
      <div className="live-count"><strong>{cityAreas.reduce((sum, area) => sum + area.people, 0)}</strong><span>PEOPLE<br />IN THIS MOCKUP</span></div>
    </section>

    <section className="live-dashboard wrap">
      <div className="city-map">
        <div className="map-topline"><span>{cityName.toUpperCase()} / MISSION MAP</span><b>● MOCKUP</b></div>
        <div className="map-surface real-map">
          <div className="map-tiles" aria-label={`${cityName} street map`}>{mapTiles[city].map((tile) => <Image src={assetUrl(`/maps/${city}/${tile}.png`)} alt="" width={256} height={256} unoptimized key={tile} />)}</div>
          <div className="map-tint" />
          {cityAreas.map((area) => <button className={`neighborhood-pin avatar-pin ${activeArea === area.name ? "selected" : ""}`} style={{ left: `${area.x}%`, top: `${area.y}%` }} onClick={() => chooseArea(area.name)} key={area.name}>
            <span className="map-avatar-stack">{area.avatars.map((avatar, index) => <i key={`${avatar}-${index}`}>{avatar}</i>)}</span>
            <b>{area.name}<small>{area.people} here</small></b>
          </button>)}
          <div className="map-credit">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> · <a href="https://www.hotosm.org" target="_blank" rel="noreferrer">HOT style</a></div>
        </div>
        <div className="area-strip">{cityAreas.map((area) => <button className={activeArea === area.name ? "active" : ""} onClick={() => chooseArea(area.name)} key={area.name}><span>{area.name}</span><b>{area.people}</b></button>)}</div>
      </div>

      <aside className="area-panel">
        <p className="panel-title">SELECTED AREA / NOW</p>
        <h2>{activeArea}</h2>
        <div className="people-stack emoji-stack">{selected.avatars.map((avatar, index) => <span key={`${avatar}-${index}`}>{avatar}</span>)}<span>+{Math.max(0, selected.people - 3)}</span></div>
        <p>{selected.people} people across {Math.max(1, eventOptions.length)} nearby events.</p>
        <div className="nearby-events"><span>EVENTS NEARBY</span>{eventOptions.slice(0, 4).map((event) => <button onClick={() => setEventName(event.name)} key={event.id}>{event.name}<small>{event.startTimeDisplay}</small></button>)}</div>
      </aside>
    </section>

    <section className="neighborhood-feed wrap">
      <div className="feed-heading"><div><p className="mono-label">{activeArea.toUpperCase()} / SAMPLE UPDATES</p><h2>Example community updates.</h2></div><span>{visibleUpdates.length} REPORTS</span></div>
      <div className="feed-layout">
        <div className="update-composer location-composer">
          <div className="composer-route"><b>{prefs.name || "YOU"}</b><span>posting in</span><strong>{activeArea}</strong></div>
          <label>Event<select value={currentEventName} onChange={(event) => setEventName(event.target.value)}><option>Neighborhood update</option>{eventOptions.map((event) => <option value={event.name} key={event.id}>{event.name}</option>)}</select></label>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={`Share an update from ${activeArea}`} />
          {imageData && <div className="upload-preview"><Image src={imageData} alt="Update attachment preview" width={160} height={100} unoptimized /><button onClick={() => setImageData(undefined)}>Remove</button></div>}
          <div className="composer-actions"><label className="image-action" htmlFor="update-image">＋ Add image<input id="update-image" type="file" accept="image/*" onChange={chooseImage} /></label><button className="button primary small" disabled={!note.trim()} onClick={post}>Post update</button></div>
          <small>Demo posts are stored on this device.</small>
        </div>

        <div className="location-updates">{visibleUpdates.length ? visibleUpdates.map((update) => <article key={update.id}>
          <header><div className="update-avatar memoji-avatar">{update.avatar || "🙂"}</div><div><strong>{update.name}</strong><span>{update.area} · {update.time}</span></div></header>
          <button className="event-tag" onClick={() => setEventName(update.eventName)}>↳ {update.eventName}</button>
          <p>{update.note}</p>
          {update.image && <Image className="update-image" src={update.image} alt={`Update from ${update.eventName}`} width={720} height={420} unoptimized />}
        </article>) : <div className="quiet-feed"><b>No reports yet.</b><p>Share the first update from {activeArea}.</p></div>}</div>
      </div>
      <div className="mission-footer"><Link href="/lineup">← Back to lineup</Link><Link href="/events">Add more events →</Link></div>
    </section>
  </main>;
}
