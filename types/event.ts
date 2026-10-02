export type EventAccess = { status:"Open"|"Waitlist"|"Closed"; method:string; requiresApproval:boolean|null };
export type TechWeekCity = "la";
export type EventItem = {
  id:string; name:string; city:"Los Angeles"|"San Francisco"; date:string; dateLabel:string; startTime:string; startTimeDisplay:string;
  timezone:"America/Los_Angeles"; neighborhood:string; venueName:string|null; address:string|null; isVirtual:boolean;
  organizers:string[]; hostDisplay:string; topics:string[]; formats:string[]; audiences:string[]; goals:string[];
  networkingStrength:number; summary:string; descriptionSource:string; access:EventAccess; rsvpUrl:string;
  endTime?:string; endDate?:string;
  featured:boolean; inOfficialWeek:boolean; source:{provider:string;cityCalendar:string;sourceRow:number;snapshotGeneratedAt:string};
};
export type EventCatalog = { schemaVersion:string; city:string; timezone:string; week:{startsOn:string;endsOn:string}; generatedAt:string; sourceSnapshotGeneratedAt:string; sourceUrl:string; officialCalendarUrl:string; eventCount:number; inWeekEventCount:number; notes:string; events:EventItem[] };
export type Preferences = { name:string; city:TechWeekCity; identity:string[]; goals:string[]; interests:string[]; formats:string[]; excludedFormats:string[]; locations:string[] };
export type EventMatch = { score:number;rawScore:number;eligible:boolean;evidenceStrength:number;breakdown:{key:"goals"|"formats"|"interests"|"role"|"location";weight:number;coverage:number;points:number}[]; reasons:string[]; cautions:string[]; matched:{goals:string[];interests:string[];audiences:string[];formats:string[];location:boolean}; coverage:{goals:number;formats:number;interests:number;role:number;location:number}; };
