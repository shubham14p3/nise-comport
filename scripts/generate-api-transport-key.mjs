import { randomBytes, webcrypto } from "node:crypto";

const kp = await webcrypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
const privateJwk = await webcrypto.subtle.exportKey("jwk", kp.privateKey);
const publicJwk = await webcrypto.subtle.exportKey("jwk", kp.publicKey);
console.log("Generate a fresh pair for every environment. Keep PRIVATE and INTERNAL_API_TOKEN server-only.");
console.log(`API_ENVELOPE_PRIVATE_JWK='${JSON.stringify(privateJwk)}'`);
console.log(`NEXT_PUBLIC_API_ENVELOPE_PUBLIC_JWK='${JSON.stringify(publicJwk)}'`);
console.log(`INTERNAL_API_TOKEN=${randomBytes(32).toString("base64url")}`);
