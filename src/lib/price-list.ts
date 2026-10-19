/**
 * Typical charges shown on /pricing. Edit the numbers here. Government fees are shown separately
 * from our charge, and final amounts are confirmed before work starts.
 */
export type PriceRow = { item: string; price: string; note?: string };
export type PriceGroup = { title: string; intro?: string; rows: PriceRow[] };

export const priceList: PriceGroup[] = [
  { title: "PAN card (new or correction)", intro: "Example breakdown of a typical ₹190 PAN order:", rows: [
    { item: "Government (NSDL / UTIITSL) fee", price: "₹106", note: "Paid to the department" },
    { item: "Courier of the physical card", price: "₹50 – ₹60", note: "Depends on the address" },
    { item: "Photo, printouts and our service charge", price: "₹20 – ₹30" },
  ] },
  { title: "Voter ID", intro: "The government does not charge for voter ID. You pay for our service.", rows: [
    { item: "Voter ID service (apply, correct, download)", price: "₹80 – ₹100", note: "Card handling ₹50–60 plus scanning and printing ₹20–30" },
    { item: "Laminated offline copy of your downloaded card", price: "+ ₹20" },
  ] },
  { title: "Lamination", rows: [
    { item: "A4 pouch lamination, standard", price: "₹20" },
    { item: "A4 pouch lamination, good brand and quality", price: "₹30" },
    { item: "Courier of laminated copies", price: "Extra, if needed", note: "Or collect from our centre" },
  ] },
  { title: "Printing", rows: [
    { item: "A4 printout (single pages)", price: "from ₹10 per page" },
    { item: "A4 printout in bulk", price: "down to ₹3 – ₹4 per page", note: "The more pages, the lower the rate" },
    { item: "Colour printout, A4", price: "from ₹3 per page in bulk" },
  ] },
  { title: "Photos", rows: [
    { item: "Passport-size photo, minimum order", price: "₹62" },
    { item: "Passport-size photos, 4 pieces", price: "₹25" },
    { item: "Passport-size photos, 8 pieces", price: "₹30" },
    { item: "A4 photo print", price: "₹50 / ₹60 / ₹80", note: "Depends on the paper or medium you choose" },
  ] },
  { title: "Insurance (first request with us)", rows: [
    { item: "Bike insurance", price: "Our service charge waived, up to ₹50" },
    { item: "Car insurance", price: "Our service charge waived, up to ₹100", note: "Insurer premium is always separate" },
  ] },
];
