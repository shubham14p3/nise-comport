/**
 * Service web addresses were shortened (e.g. /services/pan-card-jamshedpur → /services/pan-card).
 * Old addresses redirect permanently (308) to the new ones, so links and search rankings carry over.
 * No imports so it can be used by next.config and tests.
 */
import { FEATURES } from "./features.ts";

export const SERVICE_SLUG_RENAMES: Record<string, string> = {
  ...(FEATURES.billsAndRecharge ? { "fee-bill-recharge-jamshedpur": "bill-payment-recharge" } : {}),
  ...(FEATURES.travel ? { "train-flight-bus-booking-jamshedpur": "ticket-booking" } : {}),
  "pan-card-jamshedpur": "pan-card",
  // merged into other pages
  "photo-print": "photo-studio",
  "a4-a3-a2-printing": "printing-scanning",
  "xerox-photocopy": "printing-scanning",
  "aadhaar-assistance-jamshedpur": "aadhaar",
  "jharkhand-certificates-jamshedpur": "income-caste-residence-certificate",
  "voter-id-services-jamshedpur": "voter-id",
  "passport-driving-licence-help": "passport-driving-licence",
  "banking-aeps-money-transfer": "aeps-money-transfer",
  "bike-insurance-jamshedpur": "bike-insurance",
  "car-insurance-jamshedpur": "car-insurance",
  "health-life-insurance-help": "health-life-insurance",
  "student-scholarship-forms-jamshedpur": "scholarship-forms",
  "exam-form-filling-jamshedpur": "exam-forms",
  "itr-gst-form-assistance": "itr-gst",
  "printing-scanning-jamshedpur": "printing-scanning",
  "computer-sales-repair-jamshedpur": "computer-repair",
  "website-digital-services-jamshedpur": "website-design",
  "lic-policy-assistance-jamshedpur": "lic-policy",
  "sip-mutual-fund-enquiry-jamshedpur": "mutual-fund-sip",
  "rent-agreement-noc-help-jamshedpur": "rent-agreement",
  "fssai-food-license-assistance-jamshedpur": "fssai-license",
  "udyam-msme-registration-help-jamshedpur": "udyam-registration",
  "jeevan-pramaan-life-certificate-jamshedpur": "jeevan-pramaan",
  "birth-death-certificate-help-jamshedpur": "birth-death-certificate",
  "land-mutation-jharbhoomi-help": "land-mutation",
  "aadhaar-pvc-card-order-help": "aadhaar-pvc-card",
  "bank-account-opening-bc-jamshedpur": "bank-account-opening",
  "ayushman-card-abha-jamshedpur": "ayushman-card",
  "ration-card-help-jamshedpur": "ration-card",
  "abua-awas-yojana-help-jamshedpur": "abua-awas-yojana",
};

/** The current slug for an old or current one. */
export function currentServiceSlug(slug: string) {
  return SERVICE_SLUG_RENAMES[slug] ?? slug;
}
