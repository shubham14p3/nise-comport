/**
 * Hardware parts and accessories shown on /hardware. No prices here: the latest price is
 * confirmed on WhatsApp or in the request desk, because part prices change often.
 * Add a photo later by setting `image` to a file in public/images/hardware/.
 */
export type HardwareItem = { name: string; note: string; image?: string };
export type HardwareGroup = { slug: string; title: string; items: HardwareItem[] };

export const hardwareCatalogue: HardwareGroup[] = [
  { slug: "ram", title: "RAM (memory)", items: [
    { name: "DDR4 RAM 8 GB", note: "Laptop and desktop upgrade" },
    { name: "DDR4 RAM 16 GB", note: "Study, office and multitasking" },
    { name: "DDR5 RAM 16 GB", note: "Newer desktop builds" },
    { name: "DDR5 RAM 32 GB", note: "Editing and heavy work" },
  ] },
  { slug: "storage", title: "SSD and hard disk", items: [
    { name: "SSD 256 GB", note: "Faster boot for older laptops" },
    { name: "SSD 512 GB", note: "Good everyday speed" },
    { name: "SSD 1 TB", note: "Large storage with speed" },
    { name: "Hard disk 1 TB", note: "Bulk storage, backups" },
  ] },
  { slug: "processor", title: "Processor and motherboard", items: [
    { name: "Processor (Intel or AMD)", note: "Tell us the socket or model you need" },
    { name: "Motherboard", note: "Matched to your processor" },
  ] },
  { slug: "graphics", title: "Graphics card", items: [
    { name: "Graphics card (entry level)", note: "Good for everyday and light games" },
    { name: "Graphics card (mid range)", note: "Gaming and video work" },
  ] },
  { slug: "power-cabinet", title: "Power supply and cabinet", items: [
    { name: "Power supply (PSU)", note: "Matched to your build" },
    { name: "PC cabinet", note: "Tower or compact" },
  ] },
  { slug: "display-input", title: "Monitor, keyboard and mouse", items: [
    { name: "Monitor 19 to 24 inch", note: "Office and home" },
    { name: "Keyboard and mouse", note: "Wired or wireless" },
  ] },
  { slug: "printer-supplies", title: "Printer ink and toner", items: [
    { name: "Printer ink (common models)", note: "Tell us the printer model" },
    { name: "Toner cartridge", note: "Tell us the printer model" },
  ] },
  { slug: "network-cctv", title: "Network and CCTV", items: [
    { name: "Wi-Fi router or extender", note: "Home and shop" },
    { name: "CCTV camera and DVR", note: "Installation enquiry available" },
  ] },
];
