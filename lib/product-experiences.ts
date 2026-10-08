import type { EventItem } from "@/types/event";
export const CLAYDATE_ID = "latw-48d71788ac93f283";
export const WOMEN_AI_ID="productai-women-ai-safety", HEADSHOTS_ID="productai-headshots";
export const isProductAiEvent = (id:string) => [CLAYDATE_ID,HEADSHOTS_ID].includes(id);
export const isSpotlightEvent = (id:string) => id===WOMEN_AI_ID;
export const productExperiences = [
  { id:"clay-date", catalogId:CLAYDATE_ID, name:"Claydate", note:"Tuesday, October 13 · 5:30–7:30 p.m. · Product.ai HQ", posterDate:"TUE · OCT 13 · 5:30 PM", artwork:null },
  { id:"headshots", catalogId:HEADSHOTS_ID, name:"Headshot experience", note:"Thursday, October 15 · 2–5 p.m. · Product.ai HQ", posterDate:"THU · OCT 15 · 2–5 PM", artwork:"/posters/headshot-experience.png" },
] as const;
// Organizer-provided experiences, separate from official-calendar imports.
export const productEditorialEvents:EventItem[]=[
  {id:WOMEN_AI_ID,name:"Women in AI Safety",date:"2026-10-12",dateLabel:"Monday, Oct 12",startTime:"17:00",startTimeDisplay:"5:00pm",endTime:"18:00",topics:["AI"],summary:"A panel at 18th Street Arts Center in Santa Monica."},
  {id:HEADSHOTS_ID,name:"Headshot experience",date:"2026-10-15",dateLabel:"Thursday, Oct 15",startTime:"14:00",startTimeDisplay:"2:00pm",endTime:"17:00",topics:[],summary:"Headshot experience at Product.ai. Thursday, October 15, 2–5 p.m."},
].map(event=>({...event,city:"Los Angeles",timezone:"America/Los_Angeles",neighborhood:event.id===WOMEN_AI_ID?"Santa Monica":"Brentwood",venueName:event.id===WOMEN_AI_ID?"18th Street Arts Center":"Product.ai HQ",address:event.id===WOMEN_AI_ID?null:"12100 Wilshire Blvd, Suite 950, Los Angeles, CA 90025",isVirtual:false,organizers:[event.id===WOMEN_AI_ID?"Alpha Team":"Product.ai"],hostDisplay:event.id===WOMEN_AI_ID?"Alpha Team Spotlight":"Product.ai",formats:[],audiences:[],goals:[],networkingStrength:1,descriptionSource:"Product.ai-provided schedule",access:{status:"Open",method:"Product.ai website; event-specific RSVP pending",requiresApproval:null},rsvpUrl:"https://product.ai",featured:true,inOfficialWeek:true,source:{provider:"Product.ai",cityCalendar:"https://product.ai",sourceRow:0,snapshotGeneratedAt:"2026-10-04T00:00:00Z"}}));
