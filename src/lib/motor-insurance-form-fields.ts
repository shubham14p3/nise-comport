/**
 * Real field list for the motor-insurance POSP (Point of Sale Person) issuance screen —
 * the insurer/broker backend form staff fill in after a customer agrees to buy, to actually
 * issue the policy. Matches the real agent-portal screen shared by the owner: Vehicle →
 * Previous Policy → Plans → Discounts → Customer Details → Vehicle Details → POSP Details →
 * Document Details → Payment.
 *
 * This is separate from src/lib/motor-insurance.ts, whose `checkInsuranceForm` runs the simple
 * customer-facing enquiry form on /insurance. This file is the next step: what staff fill in
 * with the insurer once the customer's enquiry is picked up. Reuses the same field/validation
 * shape as src/lib/gov-form-fields.ts so one "fill this form" screen can read either.
 */

import { type GovFormField as InsuranceFormField, validateField } from "./gov-form-fields";

export type { InsuranceFormField };
export { validateField };

export type InsuranceFormSection = { id: string; title: string; fields: InsuranceFormField[] };

export type InsuranceForm = {
  serviceSlug: "bike-insurance" | "car-insurance";
  formName: string;
  portal: "Insurer / broker POSP portal";
  sections: InsuranceFormSection[];
};

const PRODUCT_TYPES = {
  bike: ["Two Wheeler Comprehensive", "Two Wheeler SAOD", "Two Wheeler Third Party", "Two Wheeler Standalone CPA"],
  car: ["Four Wheeler Comprehensive", "Four Wheeler SAOD", "Four Wheeler Third Party", "Commercial Vehicle Comprehensive", "Commercial Vehicle Third Party", "Four Wheeler Standalone CPA"],
};

const TENURES = ["1 Year OD + 1 Year TP", "1 Year OD + 3 Year TP (new car)", "1 Year OD + 5 Year TP (new bike)", "Multi-year (as quoted)"];

function vehicleSections(vehicle: "bike" | "car"): InsuranceFormSection[] {
  return [
    {
      id: "vehicle",
      title: "Vehicle",
      fields: [
        { id: "journeyType", label: "Vehicle with Registration / Brand new vehicle / Renewal", type: "radio", options: ["Vehicle with Registration", "Brand new vehicle", "Renewal"], required: true },
        { id: "productType", label: "Select Product Type", type: "select", options: PRODUCT_TYPES[vehicle], required: true },
        { id: "tenure", label: "Policy Tenure", type: "select", options: TENURES, required: true },
        { id: "ownershipType", label: "Ownership Type", type: "radio", options: ["Individual", "Corporate"], required: true },
        { id: "bharatSeries", label: "Is Bharat Series Registered vehicle?", type: "radio", options: ["Yes", "No"], required: true },
        { id: "regNo", label: "Registration Number", type: "text", required: true, hint: "Not needed for \"Brand new vehicle\"", validate: { pattern: "^[A-Z0-9]{8,11}$", message: "Enter the number plate without spaces, e.g. JH05AB1234." } },
        { id: "regYearMonth", label: "Registration year & month", type: "text", required: true },
        { id: "vehicleBrand", label: "Vehicle Brand", type: "text", required: true },
        { id: "fuelType", label: "Fuel Type", type: "select", options: ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"], required: true },
        { id: "vehicleVariant", label: "Vehicle Variant", type: "text", required: true },
        { id: "city", label: "City", type: "text", required: true },
        { id: "pincode", label: "Pincode", type: "text", required: true, validate: { pattern: "^[0-9]{6}$", message: "PIN code must be 6 digits." } },
      ],
    },
    {
      id: "previousPolicy",
      title: "Previous Policy Details",
      fields: [
        { id: "usedVehicleFreshPolicy", label: "Customer purchased a used vehicle and is looking for a fresh policy", type: "radio", options: ["Yes", "No"] },
        { id: "nameTransfer", label: "Name transfer on previous policy", type: "radio", options: ["Yes", "No"] },
        { id: "prevDetailsUnknown", label: "Previous policy details are not known", type: "radio", options: ["Yes", "No"] },
        { id: "prevPolicyType", label: "Previous Policy Type", type: "select", options: ["Comprehensive", "Third Party", "SAOD", "Not applicable (new vehicle)"] },
        { id: "prevPolicyExpiry", label: "Previous Policy Expiry Date", type: "date" },
        { id: "expiringNcb", label: "Expiring Policy NCB", type: "select", options: ["0%", "20%", "25%", "35%", "45%", "50%"] },
        { id: "claimLastYear", label: "Any claim last year?", type: "radio", options: ["Yes", "No"], required: true },
        { id: "prevInsurerName", label: "Previous Insurer Name", type: "text" },
        { id: "prevPolicyNumber", label: "Previous Policy Number", type: "text" },
      ],
    },
    {
      id: "plansDiscounts",
      title: "Plans & Discounts",
      fields: [
        { id: "idv", label: "IDV (Insured Declared Value)", type: "number", hint: "Insurer calculates/suggests this; confirm with customer before locking." },
        { id: "addOns", label: "Add-ons selected", type: "textarea", hint: "e.g. Zero depreciation, RSA, engine protect, NCB protect, key replacement" },
        { id: "voluntaryDeductible", label: "Voluntary Deductible", type: "select", options: ["None", "₹500", "₹1,000", "₹1,500", "₹2,000", "₹2,500"] },
        { id: "antiTheftDiscount", label: "Approved Anti-Theft Device Discount", type: "radio", options: ["Yes", "No"] },
        { id: "automobileAssociationDiscount", label: "Automobile Association Member Discount", type: "radio", options: ["Yes", "No"] },
      ],
    },
    {
      id: "customerDetails",
      title: "Customer Details",
      fields: [
        { id: "customerName", label: "Customer Name (as per ID/RC)", type: "text", required: true },
        { id: "dob", label: "Date of Birth", type: "date", required: true, validate: { notFuture: true, message: "Date of birth cannot be in the future." } },
        { id: "mobile", label: "Mobile Number", type: "text", required: true, validate: { pattern: "^[6-9][0-9]{9}$", message: "Mobile number must be 10 digits, starting 6-9." } },
        { id: "email", label: "Email", type: "text", validate: { pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", message: "Enter a valid email address." } },
        { id: "aadhaarOrPan", label: "Aadhaar or PAN (KYC)", type: "text", required: true },
        { id: "address", label: "Address (as per RC / KYC)", type: "textarea", required: true },
        { id: "nomineeName", label: "Nominee Name (for standalone CPA cover)", type: "text" },
      ],
    },
    {
      id: "pospDetails",
      title: "POSP Details",
      fields: [
        { id: "pospCode", label: "POSP / Agent Code", type: "text", required: true, hint: "NISE COMPORT's registered POSP code with the insurer." },
        { id: "pospName", label: "POSP / Agent Name", type: "text", required: true },
        { id: "floatAccount", label: "Float account used for this transaction", type: "text", hint: "Check float balance before confirming the quote to the customer." },
      ],
    },
    {
      id: "documentDetails",
      title: "Document Details",
      fields: [
        { id: "rcUpload", label: "RC (Registration Certificate) copy", type: "file", required: true, hint: "Not required for \"Brand new vehicle\" — use the invoice instead." },
        { id: "invoiceUpload", label: "Dealer Invoice (for a new vehicle)", type: "file" },
        { id: "prevPolicyUpload", label: "Previous Policy copy", type: "file", hint: "Needed to confirm NCB on a renewal." },
        { id: "idUpload", label: "Aadhaar / PAN copy", type: "file", required: true },
        { id: "pucUpload", label: "PUC Certificate", type: "file" },
        { id: "inspectionPhotos", label: "Vehicle Inspection Photos", type: "file", hint: "Needed if renewing after expiry, or if the insurer asks for a video/photo inspection." },
      ],
    },
    {
      id: "payment",
      title: "Payment",
      fields: [
        { id: "premiumQuoted", label: "Final Premium Quoted (₹)", type: "number", required: true, validate: { min: 0, message: "Enter the premium amount in rupees." } },
        { id: "paymentMode", label: "Payment Mode", type: "select", options: ["Float balance", "Customer online payment link", "Cash collected at desk, paid to insurer online"], required: true },
      ],
    },
  ];
}

export const motorInsuranceForms: InsuranceForm[] = [
  { serviceSlug: "bike-insurance", formName: "Two-Wheeler Insurance — POSP Issuance Form", portal: "Insurer / broker POSP portal", sections: vehicleSections("bike") },
  { serviceSlug: "car-insurance", formName: "Four-Wheeler / Commercial Vehicle Insurance — POSP Issuance Form", portal: "Insurer / broker POSP portal", sections: vehicleSections("car") },
];

export function motorInsuranceFormFor(serviceSlug: string) {
  return motorInsuranceForms.find((form) => form.serviceSlug === serviceSlug);
}

/** Flat field list across all sections — handy for a single validation pass. */
export function motorInsuranceFieldsFor(serviceSlug: string): InsuranceFormField[] {
  return motorInsuranceFormFor(serviceSlug)?.sections.flatMap((section) => section.fields) ?? [];
}

/** Validate all sections of a POSP form at once ({ fieldId: value }) → { fieldId: errorMessage } for only the problems. */
export function validateInsuranceForm(serviceSlug: string, values: Record<string, string | number | null | undefined>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of motorInsuranceFieldsFor(serviceSlug)) {
    const error = validateField(field, values[field.id]);
    if (error) errors[field.id] = error;
  }
  return errors;
}
