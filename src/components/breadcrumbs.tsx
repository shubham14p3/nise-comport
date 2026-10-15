import Link from "next/link";
import { ChevronRight } from "lucide-react";
import JsonLd from "@/components/json-ld";
import { breadcrumbLd, type Crumb } from "@/lib/structured-data";

/** Visible breadcrumb trail plus matching BreadcrumbList structured data. The last item is the current page. */
export default function Breadcrumbs({ items, label = "Breadcrumb" }: { items: Crumb[]; label?: string }) {
  return <>
    <nav className="breadcrumbs" aria-label={label}>
      <ol>
        {items.map((item, index) => <li key={item.path}>
          {index < items.length - 1 ? <><Link href={item.path}>{item.name}</Link><ChevronRight size={12} aria-hidden="true"/></> : <span aria-current="page">{item.name}</span>}
        </li>)}
      </ol>
    </nav>
    <JsonLd data={breadcrumbLd(items)}/>
  </>;
}
