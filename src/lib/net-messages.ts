import { isAppPath, isLocale, LANG_COOKIE, localeFromPath, type Locale } from "./i18n.ts";

type Kind = "offline" | "timeout" | "clock" | "secure" | "busy" | "server" | "unavailable" | "tooLarge" | "generic";

const TEXT: Record<Kind, Record<Locale, string>> = {
  offline: { en: "You seem to be offline. Check your internet connection and try again.", hi: "आप ऑफ़लाइन लगते हैं। इंटरनेट जाँचें और फिर कोशिश करें।", bn: "আপনি অফলাইন মনে হচ্ছে। ইন্টারনেট দেখে আবার চেষ্টা করুন।" },
  timeout: { en: "This is taking too long. Please check your connection and try again.", hi: "इसमें बहुत समय लग रहा है। कनेक्शन जाँचकर फिर कोशिश करें।", bn: "এতে অনেক সময় লাগছে। সংযোগ দেখে আবার চেষ্টা করুন।" },
  clock: { en: "We couldn’t complete that securely. Check that your phone or computer shows the correct date and time, refresh the page and try again.", hi: "यह सुरक्षित रूप से पूरा नहीं हो सका। अपने फ़ोन/कंप्यूटर की तारीख और समय सही रखें, पेज रिफ़्रेश करें और फिर कोशिश करें।", bn: "এটি নিরাপদে সম্পন্ন করা যায়নি। ফোন/কম্পিউটারের তারিখ ও সময় ঠিক আছে কিনা দেখুন, পেজ রিফ্রেশ করে আবার চেষ্টা করুন।" },
  secure: { en: "The secure connection could not be completed. Reload the page and try again.", hi: "सुरक्षित कनेक्शन पूरा नहीं हो सका। पेज रीफ़्रेश करके फिर कोशिश करें।", bn: "সুরক্ষিত সংযোগ সম্পূর্ণ হয়নি। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।" },
  busy: { en: "Too many attempts. Please wait a minute and try again.", hi: "बहुत ज़्यादा कोशिशें हुईं। एक मिनट रुककर फिर कोशिश करें।", bn: "অনেকবার চেষ্টা হয়েছে। এক মিনিট অপেক্ষা করে আবার চেষ্টা করুন।" },
  server: { en: "Something went wrong on our side. Please try again in a moment.", hi: "हमारी तरफ़ से कुछ गड़बड़ हुई। थोड़ी देर बाद फिर कोशिश करें।", bn: "আমাদের দিকে কিছু সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন।" },
  unavailable: { en: "The service is busy or restarting. Please try again in a minute.", hi: "सेवा अभी व्यस्त है या दोबारा शुरू हो रही है। एक मिनट बाद फिर कोशिश करें।", bn: "পরিষেবা এখন ব্যস্ত বা আবার চালু হচ্ছে। এক মিনিট পরে আবার চেষ্টা করুন।" },
  tooLarge: { en: "That file or request is too large. Try a smaller one.", hi: "यह फ़ाइल या अनुरोध बहुत बड़ा है। छोटा चुनें।", bn: "ফাইল বা অনুরোধটি খুব বড়। ছোট কিছু বেছে নিন।" },
  generic: { en: "That didn’t work. Please try again.", hi: "यह नहीं हो पाया। फिर कोशिश करें।", bn: "এটি হয়নি। আবার চেষ্টা করুন।" },
};

/** The visitor's language for messages shown outside React (network errors): page URL, then saved choice. */
export function currentLocale(): Locale {
  try {
    const path = window.location.pathname;
    const fromPath = localeFromPath(path);
    if (fromPath !== "en") return fromPath;
    if (isAppPath(path)) {
      const value = document.cookie.split("; ").find((part) => part.startsWith(`${LANG_COOKIE}=`))?.slice(LANG_COOKIE.length + 1);
      if (isLocale(value)) return value;
    }
  } catch { /* server or blocked cookies */ }
  return "en";
}

export function networkMessage(kind: Kind) { return TEXT[kind][currentLocale()]; }

/** Plain-language message for a failed HTTP status when the response itself has no readable message. */
export function messageForStatus(status: number): { kind: Kind; message: string; code: string } {
  if (status === 0) return { kind: "offline", message: networkMessage("offline"), code: "offline" };
  if (status === 408 || status === 504) return { kind: "timeout", message: networkMessage("timeout"), code: "timeout" };
  if (status === 429) return { kind: "busy", message: networkMessage("busy"), code: "rate_limited" };
  if (status === 413) return { kind: "tooLarge", message: networkMessage("tooLarge"), code: "too_large" };
  if (status === 404 || status === 400 || status === 403) return { kind: "secure", message: networkMessage("secure"), code: "secure_failed" };
  if (status === 502 || status === 503) return { kind: "unavailable", message: networkMessage("unavailable"), code: "unavailable" };
  if (status >= 500) return { kind: "server", message: networkMessage("server"), code: "server_error" };
  return { kind: "generic", message: networkMessage("generic"), code: "failed" };
}
