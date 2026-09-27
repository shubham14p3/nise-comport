import type {MetadataRoute} from "next";
export default function robots():MetadataRoute.Robots{return{rules:{userAgent:"*",allow:"/",disallow:["/profile","/admin","/api/"]},sitemap:`${process.env.NEXT_PUBLIC_SITE_URL??"https://nisecomport.com"}/sitemap.xml`}}
