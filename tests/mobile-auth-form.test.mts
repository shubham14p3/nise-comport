import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
const fixture = { states: [] as unknown[], index: 0, requests: [] as { operation: string; body: Record<string, unknown> }[], done: 0 };
(globalThis as unknown as { __mobileForm: unknown }).__mobileForm = fixture;
const dir = await mkdtemp(resolve('node_modules/.cache/mobile-form-'));
const file = join(dir, 'form.mjs');
await build({ entryPoints: ['src/components/mobile-auth-form.tsx'], outfile: file, bundle: true, platform: 'node', format: 'esm', packages: 'external', jsx: 'automatic', plugins: [{ name: 'form-io', setup(builder) {
 builder.onResolve({ filter: /^(react|lucide-react|next\/link|@\/lib\/secure-api-client)$/ }, args => ({ path: args.path, namespace: 'form-io' }));
 builder.onLoad({ filter: /.*/, namespace: 'form-io' }, args => ({ contents: args.path === 'react'
 ? 'export function useState(initial){const f=globalThis.__mobileForm;const i=f.index++;return [i<f.states.length?f.states[i]:initial,v=>{f.states[i]=v}]} export function useRef(value){return {current:value}}'
 : args.path === 'lucide-react' ? 'export const ArrowRight=()=>null,Check=()=>null,Copy=()=>null,Eye=()=>null,EyeOff=()=>null,LockKeyhole=()=>null,ShieldCheck=()=>null,UserRound=()=>null;'
 : args.path === 'next/link' ? 'export default function Link(){return null}'
 : 'export async function secureResult(operation,body){globalThis.__mobileForm.requests.push({operation,body});return {ok:true,result:{}}}' }));
} }] });
const { default: Form } = await import(pathToFileURL(file).href);
await rm(dir, { recursive: true, force: true });
for (const email of ['employee@nisecomport.com', 'shubham@example.com']) test(`Email + PIN submits a valid account email: ${email}`, async () => {
 fixture.states = ['', '582947', '', false, false, false, false, '', '', 'pin', 'email', email, '', {}, null, false, false];
 fixture.index = 0; fixture.requests = []; fixture.done = 0;
 const form = Form({ mode: 'signin', onDone: () => { fixture.done++; } });
 await form.props.onSubmit({ preventDefault() {} });
 assert.equal(fixture.requests.length, 1);
 assert.equal(fixture.requests[0].body.phone, email);
 assert.equal(fixture.requests[0].operation, 'K7m2Q9xV4cT8');
 assert.equal(fixture.done, 1);
});
