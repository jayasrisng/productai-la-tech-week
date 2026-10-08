import type { Metadata } from "next";
import { OrganizerDashboard } from "@/components/OrganizerDashboard";
export const metadata:Metadata={title:"Registrations · Product.ai",robots:{index:false,follow:false}};
export default function RegistrationsPage(){return <OrganizerDashboard/>;}
