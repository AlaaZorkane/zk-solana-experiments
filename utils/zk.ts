import type { Groth16Proof } from "snarkjs";
import { bigIntToLeUint8Array } from "./helpers.ts";
// @ts-ignore - ffjavascript is not typed
import { utils } from "ffjavascript";

const { unstringifyBigInts, leInt2Buff } = utils;

export const proofToUint8Array = (proof: Groth16Proof) => {
  // Convert x and y coordinates (ignore the Z coordinate)
  const aX = bigIntToLeUint8Array(proof.pi_a[0]); // 32 bytes
  const aY = bigIntToLeUint8Array(proof.pi_a[1]); // 32 bytes

  // Concatenate them into a single Uint8Array (64 bytes)
  const proofA = new Uint8Array(64);
  proofA.set(aX, 0); // x occupies bytes 0-31
  proofA.set(aY, 32); // y occupies bytes 32-63

  // Convert the four necessary coordinates.
  // We use the first two subarrays of pi_b. The third subarray is usually just a marker.
  const bX0 = bigIntToLeUint8Array(proof.pi_b[0][0]); // 32 bytes
  const bY0 = bigIntToLeUint8Array(proof.pi_b[0][1]); // 32 bytes
  const bX1 = bigIntToLeUint8Array(proof.pi_b[1][0]); // 32 bytes
  const bY1 = bigIntToLeUint8Array(proof.pi_b[1][1]); // 32 bytes

  // Concatenate them to form a 128-byte array.
  const proofB = new Uint8Array(128);
  proofB.set(bX0, 0); // bytes 0-31
  proofB.set(bX1, 32); // bytes 32-63
  proofB.set(bY0, 64); // bytes 64-95
  proofB.set(bY1, 96); // bytes 96-127

  const cX = bigIntToLeUint8Array(proof.pi_c[0]); // 32 bytes
  const cY = bigIntToLeUint8Array(proof.pi_c[1]); // 32 bytes

  // Concatenate them into a 64-byte Uint8Array.
  const proofC = new Uint8Array(64);
  proofC.set(cX, 0);
  proofC.set(cY, 32);

  return { proofA, proofB, proofC };
};

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function g1Uncompressed(curve: any, p1Raw: any) {
  const p1 = curve.G1.fromObject(p1Raw);

  const buff = new Uint8Array(64); // 64 bytes for G1 uncompressed
  curve.G1.toRprUncompressed(buff, 0, p1);

  return Buffer.from(buff);
}

export function g2Uncompressed(curve: any, p2Raw: any) {
  const p2 = curve.G2.fromObject(p2Raw);

  const buff = new Uint8Array(128); // 128 bytes for G2 uncompressed
  curve.G2.toRprUncompressed(buff, 0, p2);

  return Buffer.from(buff);
}

export function to32ByteBuffer(bigInt: bigint) {
  const hexString = bigInt.toString(16).padStart(64, "0");
  const buffer = Buffer.from(hexString, "hex");
  return buffer;
}
