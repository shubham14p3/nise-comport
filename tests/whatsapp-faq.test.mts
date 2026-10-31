import assert from 'node:assert/strict';
import { test } from 'node:test';
import { WHATSAPP_FAQ, whatsappFaqReply, shopWhatsAppLink } from '../src/lib/whatsapp-faq.ts';
import { detectIntent } from '../src/lib/whatsapp-bot-core.ts';
for (const entry of WHATSAPP_FAQ) for (const question of entry.questions) test(`FAQ ${entry.id}: ${question}`, () => {
  assert.equal(whatsappFaqReply(question, 'https://example.com/'), entry.answer.replaceAll('{site}', 'https://example.com'));
  assert.equal(detectIntent(question), 'faq');
});
test('unknown questions stay unanswered and handoff preserves question safely', () => {
  assert.equal(whatsappFaqReply('Something completely unexpected', 'https://example.com'), null);
  const link = new URL(shopWhatsAppLink('+91 97712 19893', 'Question & #हिंदी?'));
  assert.equal(link.pathname, '/919771219893');
  assert.ok(link.searchParams.get('text')?.includes('Question & #हिंदी?'));
});
