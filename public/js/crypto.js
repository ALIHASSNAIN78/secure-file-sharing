const PBKDF2_ITERATIONS = 250000;

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export function randomSalt() {
  return toBase64(crypto.getRandomValues(new Uint8Array(16)));
}

export function randomIv() {
  return toBase64(crypto.getRandomValues(new Uint8Array(12)));
}

async function deriveKey(passphrase, saltBase64) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new Uint8Array(fromBase64(saltBase64)),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptFile(file, passphrase, saltBase64, ivBase64) {
  const key = await deriveKey(passphrase, saltBase64);
  const plaintext = await file.arrayBuffer();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: new Uint8Array(fromBase64(ivBase64)) },
    key,
    plaintext
  );
  return new Blob([ciphertext], { type: "application/octet-stream" });
}

export async function decryptBlob(encryptedBlob, passphrase, saltBase64, ivBase64) {
  const key = await deriveKey(passphrase, saltBase64);
  const ciphertext = await encryptedBlob.arrayBuffer();
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(fromBase64(ivBase64)) },
    key,
    ciphertext
  );
  return plaintext;
}
