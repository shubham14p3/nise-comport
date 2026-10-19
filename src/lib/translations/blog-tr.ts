import type { ArticleTr } from "./blog-types";
import { blogHi1 } from "./blog-hi-1";
import { blogHi10 } from "./blog-hi-10";
import { blogHi14 } from "./blog-hi-14";
import { blogHi18 } from "./blog-hi-18";
import { blogHi22 } from "./blog-hi-22";
import { blogBn1 } from "./blog-bn-1";
import { blogBn10 } from "./blog-bn-10";
import { blogBn14 } from "./blog-bn-14";
import { blogBn18 } from "./blog-bn-18";
import { blogBn22 } from "./blog-bn-22";

export const blogHi: Record<string, ArticleTr> = { ...blogHi1, ...blogHi10, ...blogHi14, ...blogHi18, ...blogHi22 };
export const blogBn: Record<string, ArticleTr> = { ...blogBn1, ...blogBn10, ...blogBn14, ...blogBn18, ...blogBn22 };

/** Category labels shown on the blog index and article pages. */
export const CATEGORY_LABELS: Record<string, { hi: string; bn: string }> = {
  "PAN services": { hi: "पैन सेवाएँ", bn: "প্যান পরিষেবা" },
  "Aadhaar guidance": { hi: "आधार मार्गदर्शन", bn: "আধার নির্দেশনা" },
  "Jharkhand certificates": { hi: "झारखंड प्रमाण पत्र", bn: "ঝাড়খণ্ড সার্টিফিকেট" },
  "Voter services": { hi: "मतदाता सेवाएँ", bn: "ভোটার পরিষেবা" },
  Insurance: { hi: "बीमा", bn: "বিমা" },
  "Application help": { hi: "आवेदन सहायता", bn: "আবেদনে সাহায্য" },
  Education: { hi: "शिक्षा", bn: "শিক্ষা" },
  Printing: { hi: "प्रिंटिंग", bn: "প্রিন্টিং" },
  "Pension assistance": { hi: "पेंशन सहायता", bn: "পেনশন সহায়তা" },
  Certificates: { hi: "प्रमाण पत्र", bn: "সার্টিফিকেট" },
  Banking: { hi: "बैंकिंग", bn: "ব্যাংকিং" },
  "Land records": { hi: "भूमि रिकॉर्ड", bn: "জমির রেকর্ড" },
  "Health & insurance": { hi: "स्वास्थ्य और बीमा", bn: "স্বাস্থ্য ও বিমা" },
  "Business & forms": { hi: "व्यवसाय और फ़ॉर्म", bn: "ব্যবসা ও ফর্ম" },
};
