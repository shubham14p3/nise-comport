import SiteHeader from "@/components/site-header";
import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight, MessageCircle, Play, Camera } from "lucide-react";
import { socialPosts } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
const icons=[MessageCircle,Camera,Play];
export const metadata:Metadata=pageMetadata("WhatsApp & Social Updates","Service announcements, reminders and explainers from NISE COMPORT for customers in Telco and Jamshedpur. WhatsApp us for direct questions.","/social");
export default function SocialPage(){return <main className="content-page"><SiteHeader/><section className="content-hero"><div className="container"><span className="eyebrow eyebrow-muted">FOLLOW LOCAL SERVICE UPDATES</span><h1>Useful updates for<br/><em>your next step.</em></h1><p>Find service reminders, customer announcements and explainer content. WhatsApp is open for direct enquiries; public channels are linked when available.</p></div></section><section className="container social-grid">{socialPosts.map((post,index)=>{const Icon=icons[index];return <article className="social-card" key={post.platform}><Image src={post.image} alt="" width={760} height={480}/><div className="social-card-copy"><span className="social-platform"><Icon size={15}/>{post.platform}</span><h2>{post.title}</h2><p>{post.text}</p><a className="arrow-link" href={post.href} target="_blank" rel="noreferrer">{post.platform==="WhatsApp"?"Message our team":"Visit channel"}<ArrowUpRight size={14}/></a></div></article>})}</section><section className="container provider-note"><p>Social links may lead to external services. A visible announcement is informational; confirm current prices, validity and service availability with our team.</p></section></main>}
