import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Always-visible "Start now" pill, for people who want to skip the reading. */
export default function FloatingStart({ href, label = "Start now" }: { href: string; label?: string }) {
  return <Link className="floating-start" href={href}>{label}<ArrowRight size={17}/></Link>;
}
