/**
 * Neighbourhoods we serve, shown on one "Areas we serve" page (not one thin page per area,
 * which Google treats as doorway pages). Each entry gets a directions link from that area.
 */
export type AreaZone = "Telco and nearby" | "Central Jamshedpur" | "East and south" | "Beyond the city";
export type Area = { slug: string; name: string; hindi: string; note: string; zone: AreaZone };

export const areas: Area[] = [
  { slug: "kharangajhar", name: "Kharangajhar", hindi: "खरंगाझार", note: "Our service desk is here, on Hanuman Mandir Road. Walk in during opening hours.", zone: "Telco and nearby" },
  { slug: "telco", name: "Telco", hindi: "टेल्को", note: "We’re in the Kharangajhar area of Telco, a short trip from most Telco colonies.", zone: "Telco and nearby" },
  { slug: "govindpur", name: "Govindpur", hindi: "गोविंदपुर", note: "Coming from Govindpur or Chhota Govindpur? Use the directions link and call if you need a landmark.", zone: "Telco and nearby" },
  { slug: "birsanagar", name: "Birsanagar", hindi: "बिरसानगर", note: "Residents of Birsanagar can check documents with us on WhatsApp before travelling.", zone: "Central Jamshedpur" },
  { slug: "golmuri", name: "Golmuri", hindi: "गोलमुरी", note: "From Golmuri, message us first for time-sensitive banking or certificate work.", zone: "East and south" },
  { slug: "bhalubasa", name: "Bhalubasa", hindi: "भालुबासा", note: "Bring originals for any application; we check them before submission.", zone: "East and south" },
  { slug: "sakchi", name: "Sakchi", hindi: "साकची", note: "Send a request online from Sakchi and we’ll confirm the checklist before you visit.", zone: "Central Jamshedpur" },
  { slug: "mango", name: "Mango", hindi: "मानगो", note: "From Mango, a quick call confirms whether your service needs an in-person visit.", zone: "East and south" },
  { slug: "jugsalai", name: "Jugsalai", hindi: "जुगसलाई", note: "Printing orders can be requested online and collected at a time that suits you.", zone: "Central Jamshedpur" },
  { slug: "bistupur", name: "Bistupur", hindi: "बिष्टुपुर", note: "Check the guide for your service first so you bring the right documents.", zone: "Central Jamshedpur" },
  { slug: "sonari", name: "Sonari", hindi: "सोनारी", note: "Track your request online after submitting it, instead of calling for updates.", zone: "Central Jamshedpur" },
  { slug: "kadma", name: "Kadma", hindi: "कदमा", note: "Pensioners from Kadma can ask about Jeevan Pramaan before travelling.", zone: "Central Jamshedpur" },
  { slug: "telco-colony", name: "Telco Colony", hindi: "टेल्को कॉलोनी", note: "From Telco Colony, a short trip brings you to our Kharangajhar desk. Send a request online to save a visit.", zone: "Telco and nearby" },
  { slug: "barinagar", name: "Barinagar", hindi: "बरीनागर", note: "From Barinagar, check the document list on the service page first, then call or WhatsApp us.", zone: "Telco and nearby" },
  { slug: "jyoti-nagar", name: "Jyoti Nagar", hindi: "ज्योति नगर", note: "Residents of Jyoti Nagar can confirm service availability on WhatsApp before travelling.", zone: "Telco and nearby" },
  { slug: "karandih", name: "Karandih", hindi: "करनडीह", note: "From Karandih, message us first for banking, certificate or printing work so we can confirm what to bring.", zone: "East and south" },
  { slug: "adityapur", name: "Adityapur", hindi: "आदित्यपुर", note: "From Adityapur (Seraikela-Kharsawan), confirm service availability by phone first.", zone: "Beyond the city" },
  { slug: "baridih", name: "Baridih", hindi: "बारीडीह", note: "From Baridih, send your request online first and we will confirm what to bring.", zone: "East and south" },
  { slug: "sidhgora", name: "Sidhgora", hindi: "सिदगोड़ा", note: "From Sidhgora, WhatsApp a photo of your documents and we will check them before you travel.", zone: "Central Jamshedpur" },
  { slug: "burmamines", name: "Burmamines", hindi: "बर्मामाइंस", note: "Burmamines residents can ask about certificates, PAN and printing on WhatsApp before visiting.", zone: "Central Jamshedpur" },
  { slug: "bhuiyadih", name: "Bhuiyadih", hindi: "भुइयाडीह", note: "From Bhuiyadih, call to confirm timings for banking and AEPS work.", zone: "Central Jamshedpur" },
  { slug: "parsudih", name: "Parsudih", hindi: "परसुडीह", note: "From Parsudih, start the request online and visit only for steps that need you in person.", zone: "East and south" },
  { slug: "azadnagar", name: "Azadnagar", hindi: "आज़ादनगर", note: "Azadnagar and Mango-side residents can confirm the document list with us on WhatsApp.", zone: "East and south" },
  { slug: "gamharia", name: "Gamharia", hindi: "गम्हरिया", note: "From Gamharia (Seraikela-Kharsawan), confirm service availability by phone, and send documents online to save a trip.", zone: "Beyond the city" },
  { slug: "ghatshila", name: "Ghatshila", hindi: "घाटशिला", note: "Living further out? Most services can start online from anywhere in Jharkhand; we tell you if a visit is needed.", zone: "Beyond the city" },
];
