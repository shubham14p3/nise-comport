import { PartnerStrip } from "@/components/partner-marks";
import FooterBody from "@/components/footer-body";

/**
 * Shared footer on every page: the same name, address and phone (NAP) as the Google Business
 * Profile, plus links to the most important pages so every page passes link value to them.
 * The visible text follows the page language (see footer-body.tsx).
 */
export default function SiteFooter() {
  return <FooterBody year={new Date().getFullYear()} partners={<PartnerStrip/>}/>;
}
