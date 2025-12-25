// src/constants/crypto.js

/* =====================================================
   KEY GENERATION (ALREADY USED BY PROFESSOR)
===================================================== */

export async function generateKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256"
    },
    true,
    ["encrypt", "decrypt"]
  );

  const publicKey = await window.crypto.subtle.exportKey(
    "spki",
    keyPair.publicKey
  );

  const privateKey = await window.crypto.subtle.exportKey(
    "pkcs8",
    keyPair.privateKey
  );

  return {
    publicKey: arrayBufferToBase64(publicKey),
    privateKey: arrayBufferToBase64(privateKey)
  };
}

/* =====================================================
   ENCRYPT CID (STUDENT SIDE)
===================================================== */

export async function encryptWithPublicKey(cid, base64PublicKey) {
  const publicKey = await importPublicKey(base64PublicKey);

  const encoded = new TextEncoder().encode(cid);

  const encrypted = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    encoded
  );

  return arrayBufferToBase64(encrypted);
}

/* =====================================================
   DECRYPT CID (PROFESSOR SIDE)
===================================================== */

export async function decryptWithPrivateKey(
  encryptedBase64,
  base64PrivateKey
) {
  const privateKey = await importPrivateKey(base64PrivateKey);

  const encryptedBuffer = base64ToArrayBuffer(encryptedBase64);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedBuffer
  );

  return new TextDecoder().decode(decrypted);
}

/* =====================================================
   HELPERS
===================================================== */

function arrayBufferToBase64(buffer) {
  return btoa(
    String.fromCharCode(...new Uint8Array(buffer))
  );
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

async function importPublicKey(base64Key) {
  const buffer = base64ToArrayBuffer(base64Key);

  return window.crypto.subtle.importKey(
    "spki",
    buffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256"
    },
    true,
    ["encrypt"]
  );
}

async function importPrivateKey(base64Key) {
  const buffer = base64ToArrayBuffer(base64Key);

  return window.crypto.subtle.importKey(
    "pkcs8",
    buffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256"
    },
    true,
    ["decrypt"]
  );
}
