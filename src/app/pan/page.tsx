import { permanentRedirect } from "next/navigation";

/** The PAN help centre now lives on the PAN card service page. */
export default function PanHub() {
  permanentRedirect("/services/pan-card#pan-help");
}
