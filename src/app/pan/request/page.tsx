import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site-header";
import PanRequestForm from "@/components/pan-request-form";
import { getCurrentUser } from "@/lib/auth";
import { panServices,type PanIntake } from "@/lib/pan-validation";
export const metadata:Metadata={title:"PAN assistance request",robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{type?:string}>}){const user=await getCurrentUser();const {type}=await searchParams;const service=panServices.includes(type as never)?type as PanIntake["service"]:"new";return <main><SiteHeader/><div className="container pan-page"><Link href="/pan">← PAN information hub</Link><header className="pan-hero"><h1>Let’s prepare your PAN request.</h1><p>Choose your service, complete the common form and review the information before sending.</p></header>{user?<PanRequestForm service={service} demo={user.role==="demo"}/>:<section className="pan-card"><h2>Sign in to keep your request private</h2><p>Your contact information will prefill from your profile after the encrypted workspace opens. You can review it before submitting.</p><Link className="button button-green" href="/login">Sign in to continue</Link> <Link href="/signup">Create an account</Link></section>}</div></main>;}
