/**
 * Neighbourhoods we serve, shown on one "Areas we serve" page (not one thin page per area,
 * which Google treats as doorway pages). Each entry gets a directions link from that area.
 */
export type Area = { slug: string; name: string; hindi: string; note: string };

export const areas: Area[] = [
  { slug: "kharangajhar", name: "Kharangajhar", hindi: "खरंगाझार", note: "Our service desk is here, on Hanuman Mandir Road. Walk in during opening hours." },
  { slug: "telco", name: "Telco", hindi: "टेल्को", note: "We’re in the Kharangajhar area of Telco, a short trip from most Telco colonies." },
  { slug: "govindpur", name: "Govindpur", hindi: "गोविंदपुर", note: "Coming from Govindpur or Chhota Govindpur? Use the directions link and call if you need a landmark." },
  { slug: "birsanagar", name: "Birsanagar", hindi: "बिरसानगर", note: "Residents of Birsanagar can check documents with us on WhatsApp before travelling." },
  { slug: "golmuri", name: "Golmuri", hindi: "गोलमुरी", note: "From Golmuri, message us first for time-sensitive banking or certificate work." },
  { slug: "bhalubasa", name: "Bhalubasa", hindi: "भालुबासा", note: "Bring originals for any application; we check them before submission." },
  { slug: "sakchi", name: "Sakchi", hindi: "साकची", note: "Send a request online from Sakchi and we’ll confirm the checklist before you visit." },
  { slug: "mango", name: "Mango", hindi: "मानगो", note: "From Mango, a quick call confirms whether your service needs an in-person visit." },
  { slug: "jugsalai", name: "Jugsalai", hindi: "जुगसलाई", note: "Printing orders can be requested online and collected at a time that suits you." },
  { slug: "bistupur", name: "Bistupur", hindi: "बिष्टुपुर", note: "Check the guide for your service first so you bring the right documents." },
  { slug: "sonari", name: "Sonari", hindi: "सोनारी", note: "Track your request online after submitting it, instead of calling for updates." },
  { slug: "kadma", name: "Kadma", hindi: "कदमा", note: "Pensioners from Kadma can ask about Jeevan Pramaan before travelling." },
  { slug: "adityapur", name: "Adityapur", hindi: "आदित्यपुर", note: "From Adityapur (Seraikela-Kharsawan), confirm service availability by phone first." },
];
