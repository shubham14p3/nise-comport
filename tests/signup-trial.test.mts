import assert from 'node:assert/strict';
import { test } from 'node:test';
import { localSignupTrial } from '../src/lib/mobile-login-core.ts';
test('signup exception is restricted to the requested number and local development', () => {
 assert.equal(localSignupTrial('+918092766575', 'development'), true);
 for (const runtime of ['production', 'test', '', undefined]) assert.equal(localSignupTrial('+918092766575', runtime), false);
 assert.equal(localSignupTrial('+919771219893', 'development'), false);
});
