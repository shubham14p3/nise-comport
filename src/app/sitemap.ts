import type {MetadataRoute} from "next";
import {serviceCatalog} from "@/lib/services";
export default function sitemap():MetadataRoute.Sitemap{const base=process.env.NEXT_PUBLIC_SITE_URL??"https://nisecomport.com";const routes=["","/services","/print","/about","/contact","/faq","/privacy","/terms",...serviceCatalog.map(service=>`/services/${service.slug}`)];return routes.map(route=>({url:`${base}${route}`,lastModified:new Date(),changeFrequency:route===""?"weekly":"monthly",priority:route===""?1:route==="/services"?.9:route.startsWith("/services/")?.8:.6}))}
