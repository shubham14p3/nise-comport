# Customer and staff WhatsApp messages

These are copy drafts, not Meta-approved templates. The website and API bot share the FAQ catalogue in `src/lib/whatsapp-faq.ts`: 18 topics, with 54 English, Hindi and Hinglish example questions covered by tests. Other questions offer help from the shop; the bot does not guess.

## Father’s share message / WhatsApp Business quick reply

🙏 *नमस्ते! NiSE COMPORT में आपका स्वागत है*
*आपका अपना CSC / प्रज्ञा केंद्र · Kharangajhar, Telco*

📋 PAN, प्रमाण पत्र, बीमा, प्रिंट और डिजिटल सेवाओं की जानकारी अब ऑनलाइन भी देखें।

🌐 *सेवा चुनें और आवेदन शुरू करें:*
https://nisecomport.com/services

🔎 *अपने आवेदन देखें:*
https://nisecomport.com/profile#requests

📎 दस्तावेज़ अपने आवेदन में उपलब्ध upload विकल्प से जोड़ें। विकल्प नहीं मिले तो हमसे पहले पूछें। Online assistant पर भेजी फोटो अभी website inbox में save नहीं होती।

📱 *दुकान से सीधे बात करें:* +91 97712 19893
☎️ 0657-2917622

💬 वेबसाइट का chat सहायक सामान्य सवालों के जवाब देता है। जवाब न मिले तो *Shop WhatsApp* दबाएँ—आपका सवाल भर जाएगा, भेजना आप तय करें।

❤️ आपके विश्वास और सहयोग के लिए धन्यवाद!
*🙏 NiSE COMPORT 🙏*

## Staff quick reply when an answer needs checking

🙏 नमस्ते! आपके सवाल की जाँच टीम को करनी होगी। अभी हम निश्चित जानकारी नहीं दे पा रहे हैं।

📱 दुकान की टीम से बात करें: https://wa.me/919771219893
कृपया सेवा का नाम और अपना सवाल लिखें। OTP, PIN या password न भेजें।

यह लिंक खोलने से chat history या files अपने-आप दूसरी chat में नहीं जातीं। काम पूरा होने या callback की पुष्टि तभी मानें जब टीम/website पुष्टि करे।

## Staff alert draft

🔔 *NiSE COMPORT · नया अनुरोध*
🧾 Reference: {{1}}
📋 सेवा: {{2}}
👤 ग्राहक: {{3}}
📝 विवरण: {{4}}
कृपया staff desk में अनुरोध खोलकर जाँचें। ग्राहक को कोई शुल्क या completion date बताने से पहले पुष्टि करें।

Meta submission: Utility category only for a genuine operational notification; use an approved recipient and keep variable order identical to the existing sender. Final category/approval is Meta’s decision. Promotional customer invitations are Marketing, not Utility. For API sends, submit the exact body and language in WhatsApp Manager and configure the approved name; see `whatsapp-templates.md`. Manual Business app quick replies do not create approved API templates.

## Boundaries and escalation

- Document upload, failed upload, payment failure, refund rules, timelines, lost PAN, corrections, callback, sign-in, missing OTP, fees, language, privacy, shop visits, services, missing reference and submission confirmation have shared answers.
- Service prices and authenticated request/payment status keep using existing live handlers; the FAQ cannot verify a payment or file a government application.
- Unmatched questions and human requests in the API chat link to the original shop number. The website also offers that button with the typed question.
- A handoff does not pause automation or transfer messages/files. Staff must open the relevant inbox.
- Media storage/preview is not implemented by this change. OTP delivery still needs a configured provider and an approved Authentication template for WhatsApp; a welcome reply does not prove OTP works.
