import { of as hashOf } from "ipfs-only-hash";

export async function computeCID(file) {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  return await hashOf(uint8Array); // CIDv0
}
