import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { verify } from '@node-rs/argon2';
const owner = { id: 'owner', email: 'shubham14p3@gmail.com', phone: '+918092766575', role: 'admin', passwordHash: 'original-owner-password' };
const created: Record<string, unknown>[] = []; const signedIn: string[] = [];
let claims = 0;
const fixture = {
 createSession(id: string) { signedIn.push(id); }, ensureClaim() { claims++; return null; },
 db: { select() { return { from() { return this; }, where() { return this; }, async limit() { return [owner]; } }; },
 insert() { return { values(value: Record<string, unknown>) { return { async returning() { const row = { id: `trial-${created.length}`, role: 'customer', ...value }; created.push(row); return [row]; } }; } }; },
 update() { throw new Error('Signup must not update an existing account'); }, delete() { throw new Error('Signup must not delete an existing account'); } },
};
(globalThis as unknown as { __signupTrial: unknown }).__signupTrial = fixture;
const mocks: Record<string, string> = {
 '@/lib/db': 'export const db=globalThis.__signupTrial.db;',
 '@/lib/auth': 'export async function createSession(id){globalThis.__signupTrial.createSession(id)}',
 '@/lib/claims': 'export async function ensureClaim(){return globalThis.__signupTrial.ensureClaim()} export async function matchedRecordCount(){return 0} export async function endSessions(){}',
 '@/lib/activity': 'export async function logActivity(){}',
 '@/lib/vault': 'export function seal(value){return value}',
 '@/lib/rate-limit': 'export async function clearRate(){} export async function enforceRate(){} export async function hitRate(){return {count:0}} export function identity(){return "test"} export async function peekRate(){return 0} export const RATE_RULES={mobileSignupPerIpHour:{},passwordPerIp15m:{},pinFailuresPerPhone15m:{limit:5,windowSeconds:900}};',
};
const dir = await mkdtemp(resolve('node_modules/.cache/signup-trial-')); const out = join(dir, 'trial.mjs');
await build({entryPoints:['src/lib/mobile-auth.ts'],outfile:out,bundle:true,platform:'node',format:'esm',packages:'external',plugins:[{name:'signup-io',setup(builder){
 builder.onResolve({filter:/^@\/lib\//},args=>mocks[args.path]?{path:args.path,namespace:'signup-io'}:undefined);
 builder.onLoad({filter:/.*/,namespace:'signup-io'},args=>({contents:mocks[args.path]}));
}}]});
const { mobileSignUp } = await import(pathToFileURL(out).href); await rm(dir,{recursive:true,force:true});
test('local duplicate signup creates a separate customer without changing the owner, mobile identity or records', async () => {
 const originalRuntime = process.env.NODE_ENV;
 try {
  process.env.NODE_ENV = 'development';
  const result = await mobileSignUp({phone:'8092766575',name:'Shubham trial'},'local-test');
  assert.equal(created.length,1); const trial=created[0];
  assert.equal(trial.role,'customer'); assert.equal(trial.phone,null); assert.equal(trial.signupMethod,'local_test');
  assert.notEqual(trial.email,owner.email); assert.equal(result.testLoginEmail,trial.email);
  assert.equal(await verify(String(trial.loginPinHash),result.pin),true);
  assert.deepEqual(signedIn,[trial.id]); assert.equal(claims,0);
  assert.equal(owner.role,'admin'); assert.equal(owner.passwordHash,'original-owner-password'); assert.equal(owner.phone,'+918092766575');
  process.env.NODE_ENV='production'; await assert.rejects(()=>mobileSignUp({phone:'8092766575',name:'Trial'},'local-test'));
  assert.equal(created.length,1);
 } finally { if(originalRuntime===undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV=originalRuntime; }
});
