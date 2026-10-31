/** General guidance only. Account-specific status, prices and payments use authenticated/live flows. */
export const WHATSAPP_FAQ = [
  { id: "start", questions: ["How to apply online?", "Online apply kaise kare", "ऑनलाइन आवेदन कैसे करें"], pattern: /how to apply online|online apply|apply online|ऑनलाइन आवेदन|online seva/iu,
    answer: "🙏 *ऑनलाइन आवेदन / Apply online*\n{site}/services पर सेवा चुनें → विवरण भरें → sign in करके preview देखें → उपलब्ध document upload का उपयोग करें।\nकेवल जानकारी चाहिए तो callback विकल्प चुनें। हर सेवा की प्रक्रिया अलग हो सकती है।" },
  { id: "upload", questions: ["Where can I send my files?", "Document kahan bheju", "दस्तावेज कहाँ भेजें"], pattern: /where.*(?:send|upload).*(?:file|document|photo)|(?:file|document|photo|pdf).*(?:upload|bhej|kahan|send)|दस्तावेज.*(?:भेज|अपलोड)|फोटो.*(?:भेज|अपलोड)/iu,
    answer: "📎 *दस्तावेज़ / Documents*\nअपने आवेदन में उपलब्ध upload विकल्प से फ़ाइल जोड़ें: {site}/profile#requests\nनया आवेदन: {site}/services\nWhatsApp पर भेजी फ़ाइल अभी website inbox में save या preview नहीं होती। Upload विकल्प नहीं दिखे तो 6 भेजकर टीम की मदद लें; दोबारा अनावश्यक दस्तावेज़ न भेजें।" },
  { id: "upload-error", questions: ["Upload failed", "File size too large", "फाइल अपलोड नहीं हो रही"], pattern: /upload (?:failed|error|not working)|file (?:size|too large)|अपलोड नहीं|फाइल.*बड़ी/iu,
    answer: "📎 फ़ाइल का format और size आवेदन में दिखाई गई सीमा के अनुसार जाँचें। Internet जाँचकर फिर प्रयास करें।\nसमस्या रहे तो सेवा और error का विवरण टीम को दें (6)। OTP, password या पहचान-पत्र की पूरी जानकारी error message में न भेजें।" },
  { id: "payment-error", questions: ["Money deducted but not updated", "Payment failed", "पैसे कट गए लेकिन अपडेट नहीं हुआ"], pattern: /money deducted|payment failed|paid.*not.*(?:updated|reflect)|paise kat|पैसे कट|भुगतान.*(?:असफल|अपडेट)/iu,
    answer: "💳 *Payment assistance*\nपैसे कटे लेकिन status नहीं बदला तो तुरंत दोबारा भुगतान न करें। अपने account में payment status देखें और टीम से जाँच करवाएँ (6)।\nUPI भुगतान के लिए वेबसाइट पर उपलब्ध UTR विकल्प का उपयोग करें। यहाँ PIN/OTP न भेजें।" },
  { id: "refund-policy", questions: ["What is your refund policy?", "Cancellation rules", "रिफंड नियम क्या हैं"], pattern: /refund policy|cancellation (?:rules|policy)|रिफंड.*नियम/iu,
    answer: "↩️ Refund/cancellation आपके आवेदन की स्थिति, किए गए काम और लागू नीति पर निर्भर है।\nवेबसाइट के footer में *Refund & Cancellation Policy* देखें: {site}\nव्यक्तिगत मामले की जाँच के लिए 6 भेजें। Bot refund मंजूर नहीं करता।" },
  { id: "timing", questions: ["How many days will it take?", "Kitne din lagenge", "कितने दिन लगेंगे"], pattern: /how (?:many days|long)|kitne din|kab tak|कितने दिन|कब तक/iu,
    answer: "⏳ समय सेवा, दस्तावेज़ों की जाँच और संबंधित विभाग/प्रदाता पर निर्भर है। निश्चित तारीख या approval की guarantee नहीं दी जा सकती।\nअपना reference देकर टीम से अनुमान पूछें, या status के लिए 2 भेजें।" },
  { id: "lost-pan", questions: ["My PAN card is lost", "PAN number yaad nahi", "पैन कार्ड खो गया"], pattern: /pan.*(?:lost|kho|yaad nahi)|lost.*pan|पैन.*(?:खो|याद नहीं)/iu,
    answer: "🪪 PAN खो गया है तो पहले यह देखें कि PAN number की पुरानी copy/record उपलब्ध है या नहीं। Number याद नहीं है तो टीम से पहले स्थिति समझें—नया PAN बनवाने का आवेदन जल्दबाज़ी में न करें।\nसेवा और आवश्यक दस्तावेज़: {site}/services/pan-card\nव्यक्तिगत सहायता: 6" },
  { id: "correction", questions: ["PAN name correction", "Wrong date of birth on PAN", "पैन में नाम गलत है"], pattern: /pan.*(?:name correction|wrong.*birth|dob correction)|wrong.*birth.*pan|पैन.*(?:नाम गलत|जन्म.*गलत)/iu,
    answer: "🪪 PAN correction के लिए किस विवरण में बदलाव चाहिए, यह आवेदन में चुनें। सही जानकारी के समर्थन में आवश्यक दस्तावेज़ सेवा पेज पर देखें।\n{site}/services/pan-card\nटीम जाँच के बाद अगला कदम बताएगी; bot बदलाव या approval नहीं करता।" },
  { id: "callback", questions: ["How to request a callback?", "Callback kaise milega", "वापस कॉल कैसे मिलेगी"], pattern: /how.*callback|callback kaise|request (?:a )?callback|वापस कॉल कैसे/iu,
    answer: "📞 सेवा चुनकर *Call me back* विकल्प भरें: {site}/services\nनाम, mobile और मांगी गई contact details दें। Website पर confirmation मिलने पर ही callback request दर्ज मानी जाए। केवल इस chat में पूछने से callback form submit नहीं होता।" },
  { id: "login", questions: ["How do I sign in?", "Account kaise banaye", "लॉगिन कैसे करें"], pattern: /how.*sign in|account kaise|login kaise|लॉगिन कैसे|खाता कैसे/iu,
    answer: "🔐 Sign in: {site}/login\nवेबसाइट पर mobile/email और उपलब्ध sign-in विकल्प चुनें। अपना OTP या password chat में न भेजें। नया account चाहिए तो sign-up विकल्प चुनें।" },
  { id: "otp", questions: ["OTP not received", "Code expired", "ओटीपी नहीं आया"], pattern: /otp.*(?:not|nahi|expired)|code expired|ओटीपी.*(?:नहीं|समाप्त)/iu,
    answer: "🔐 सही mobile/email जाँचें और resend timer खत्म होने दें। फिर वेबसाइट से नया code माँगें; पुराना code काम नहीं करेगा। उपलब्ध हो तो SMS/email विकल्प चुनें।\nWhatsApp OTP केवल configured और approved Authentication template होने पर उपलब्ध है। अपना code किसी को न भेजें।" },
  { id: "fees", questions: ["Are government fees included?", "Any hidden charges?", "सरकारी शुल्क शामिल है"], pattern: /government fees.*included|hidden charges|सरकारी शुल्क.*शामिल|extra charges/iu,
    answer: "💰 Service charge, सरकारी/प्रदाता शुल्क और लागू payment charges quote में जाँचें। कोई मद अस्पष्ट हो तो भुगतान से पहले टीम से पूछें।\nBot अनुमान से शुल्क नहीं बताता; किसी सेवा की कीमत के लिए उसका नाम और price भेजें।" },
  { id: "language", questions: ["Hindi please", "Can I speak in Hindi?", "हिंदी में बताइए"], pattern: /hindi please|speak in hindi|हिंदी में|हिन्दी में/iu,
    answer: "🙏 आप हिंदी, English या Hinglish में अपना प्रश्न लिख सकते हैं। Bot केवल पहचाने गए सवालों का उत्तर देता है। समझने में परेशानी हो तो 6 भेजकर टीम की मदद लें।" },
  { id: "privacy", questions: ["Should I share my OTP?", "Can I send my password?", "क्या ओटीपी भेजना है"], pattern: /share.*otp|send.*password|ओटीपी.*भेज|password.*bhej/iu,
    answer: "🔒 नहीं। OTP, PIN और password chat में कभी न भेजें। जरूरी दस्तावेज़ अपने आवेदन के निर्धारित upload में ही जोड़ें। टीम से सहायता लेने के लिए 6 भेजें।" },
  { id: "offline", questions: ["Can I visit the shop?", "Offline apply kar sakte", "दुकान आ सकते हैं"], pattern: /visit the shop|offline apply|दुकान आ|centre visit|center visit/iu,
    answer: "🏪 जी हाँ, दुकान पर सहायता ले सकते हैं। आने से पहले timings जाँचें—5 भेजें।\nदस्तावेज़ों की सूची सेवा पेज पर देखें: {site}/services\nमूल दस्तावेज़ कब चाहिए, यह टीम से confirm करें।" },
  { id: "services", questions: ["Which services are available?", "Sabhi services batao", "कौन सी सेवाएं हैं"], pattern: /which services|all services|sabhi services|कौन सी सेव|सभी सेव/iu,
    answer: "📋 उपलब्ध सेवाओं की पूरी सूची और प्रत्येक सेवा का विवरण यहाँ देखें:\n{site}/services\nपुराने प्रचार संदेश की हर सेवा आज ऑनलाइन उपलब्ध हो, यह जरूरी नहीं। संबंधित सेवा न मिले तो 6 भेजकर टीम से पुष्टि करें।" },
  { id: "reference", questions: ["I forgot my request reference", "Request number nahi mila", "आवेदन नंबर नहीं मिला"], pattern: /forgot.*reference|request number.*nahi|आवेदन नंबर.*नहीं/iu,
    answer: "🔎 उसी account में sign in करके *My requests* देखें:\n{site}/profile#requests\nReference न मिले तो सेवा और submission की तारीख के साथ टीम की सहायता लें (6)। दूसरे व्यक्ति का account उपयोग न करें।" },
  { id: "saved-request", questions: ["Did you submit my application?", "Form submit ho gaya kya", "आवेदन जमा हो गया क्या"], pattern: /did you submit|form submit ho|आवेदन जमा.*क्या/iu,
    answer: "📋 WhatsApp enquiry भेजना या QR scan करना आवेदन जमा करना नहीं है। Website पर successful submission के बाद reference और *My requests* में entry देखें।\n{site}/profile#requests\nअंतिम सरकारी filing/reference केवल टीम द्वारा दर्ज होने पर confirm होगा।" },
] as const;

export function whatsappFaqReply(raw: string, siteUrl: string): string | null {
  const found = WHATSAPP_FAQ.find(entry => entry.pattern.test(raw.trim()));
  return found ? found.answer.replaceAll("{site}", siteUrl.replace(/\/$/, "")) : null;
}

/** Explicit handoff: opens the shop chat with the question; sends nothing automatically. */
export function shopWhatsAppLink(number: string, question: string): string {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(`🙏 नमस्ते NiSE COMPORT, मुझे टीम की सहायता चाहिए।\n${question.slice(0, 1000)}`)}`;
}
