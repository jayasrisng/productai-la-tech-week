import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return <main><SiteHeader />
    <section className="hero wrap">
      <div className="hero-kicker"><span className="diamond" /> PRODUCT.AI × LA TECH WEEK <span>OCT 12—18 · LOS ANGELES</span></div>
      <div className="hero-grid"><div><h1>Make Tech Week<br />worth your time.</h1><p className="hero-copy">Hundreds of events. One week. We help you find the rooms actually worth showing up for.</p><div className="hero-actions"><Link className="button primary" href="/plan">Build my week</Link><Link className="text-link" href="/events">Explore all events →</Link></div></div>
        <div className="week-index" aria-label="Sample week overview"><p className="mono-label">WEEK / 42</p>{["MON 12", "TUE 13", "WED 14", "THU 15", "FRI 16"].map((day, index) => <div className={index === 1 ? "active" : ""} key={day}><span>{day}</span><b>{[4,7,9,6,8][index]} rooms</b></div>)}<p className="index-note">Signal, not noise. Ranked around what you came to LA to do.</p></div>
      </div>
    </section>
    <section className="how wrap"><div><span>01</span><h2>Tell us who you are.</h2></div><div><span>02</span><h2>Tell us what you want.</h2></div><div><span>03</span><h2>We rank the week around your goals.</h2></div></section>
    <footer className="wrap site-footer"><span>PRODUCT.AI / LA</span><p>A calmer way through a very busy week.</p></footer>
  </main>;
}
