/** Hindi and Bengali text of a guide (the English original is in src/lib/content.ts). Image, dates, service and official links stay as in English. */
export type ArticleTr = {
  title: string; excerpt: string; seoTitle?: string; paragraphs: string[]; checklist: string[];
  sections?: { heading: string; paragraphs: string[] }[];
  faqs?: { question: string; answer: string }[];
  imageAlt?: string;
};
