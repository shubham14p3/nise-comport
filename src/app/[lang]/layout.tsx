import { notFound } from "next/navigation";
import { langFromParam, LANG_PARAMS } from "@/lib/tr";

export const dynamicParams = false;
export function generateStaticParams() { return LANG_PARAMS; }

/** /hi/… and /bn/… : the same pages in Hindi and Bengali. */
export default async function LanguageLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!langFromParam(lang)) notFound();
  return children;
}
