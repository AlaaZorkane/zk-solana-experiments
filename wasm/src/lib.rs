use std::str::FromStr;

use ark_bn254::{Fq, G1Affine};
use ark_ff::{BigInt, PrimeField};
use ark_serialize::CanonicalSerialize;
use num_bigint::BigUint;
use proofs::{PreparedProof, RawProof};
use wasm_bindgen::prelude::*;

mod proofs;
mod utils;
#[wasm_bindgen]
pub fn prepare_g1_point(x_str: &str, y_str: &str) -> Result<Vec<u8>, JsValue> {
    console_error_panic_hook::set_once();

    let x_int =
        BigInt::from_str(x_str).map_err(|_| JsValue::from_str("Failed to parse x coordinate"))?;
    let y_int =
        BigInt::from_str(y_str).map_err(|_| JsValue::from_str("Failed to parse y coordinate"))?;

    let x = Fq::from_bigint(x_int);
    let y = Fq::from_bigint(y_int);

    match (x, y) {
        (Some(x), Some(y)) => {
            let g1_affine = G1Affine::new(x, y);

            let mut writer = Vec::new();
            g1_affine
                .serialize_uncompressed(&mut writer)
                .map_err(|_| JsValue::from_str("Failed to serialize g1 point"))?;

            Ok(writer)
        }
        _ => Err(JsValue::from_str("Failed to parse x or y coordinate")),
    }
}

/// Convert the snarkjs proof format into the format used by solana's syscall
///
/// The snarkjs proof format is:
/// {
///     pi_a: [x, y, z], (G1 point)
///     pi_b: [[x, y], [x, y], [z1, z2]], (G2 point)
///     pi_c: [x, y, z], (G1 point)
/// }
///
/// Since the syscall expects the pi_a to be negated, we need to negate both the x and y coordinates:
/// Everything else is left as is, we just need to do string to bigint conversion
#[wasm_bindgen]
pub fn prepare_proofs(raw_proof: JsValue) -> Result<JsValue, JsValue> {
    let mut prepared_proof = PreparedProof::new();

    let raw_proof: RawProof =
        serde_wasm_bindgen::from_value(raw_proof).map_err(|_| JsValue::null())?;

    let pi_a_x_bigint = BigUint::from_str(&raw_proof.pi_a[0]).map_err(|_| JsValue::null())?;
    let pi_a_y_bigint = BigUint::from_str(&raw_proof.pi_a[1]).map_err(|_| JsValue::null())?;

    prepared_proof.set_proof_a(pi_a_x_bigint, pi_a_y_bigint)?;

    let pi_c_x_bigint = BigUint::from_str(&raw_proof.pi_c[0]).map_err(|_| JsValue::null())?;
    let pi_c_y_bigint = BigUint::from_str(&raw_proof.pi_c[1]).map_err(|_| JsValue::null())?;

    prepared_proof.set_proof_c(pi_c_x_bigint, pi_c_y_bigint)?;

    let pi_b_x0_bigint = BigUint::from_str(&raw_proof.pi_b[0][0]).map_err(|_| JsValue::null())?;
    let pi_b_y0_bigint = BigUint::from_str(&raw_proof.pi_b[0][1]).map_err(|_| JsValue::null())?;
    let pi_b_x1_bigint = BigUint::from_str(&raw_proof.pi_b[1][0]).map_err(|_| JsValue::null())?;
    let pi_b_y1_bigint = BigUint::from_str(&raw_proof.pi_b[1][1]).map_err(|_| JsValue::null())?;

    prepared_proof.set_proof_b(
        pi_b_x0_bigint,
        pi_b_y0_bigint,
        pi_b_x1_bigint,
        pi_b_y1_bigint,
    )?;

    prepared_proof.try_into()
}

#[cfg(test)]
mod tests {
    use zk_factor::{Groth16Verifier, PUBLIC_INPUT, VERIFYINGKEY};

    const PROOF: [u8; 256] = [
        13, 182, 181, 4, 152, 215, 43, 245, 159, 20, 233, 21, 128, 249, 123, 6, 154, 203, 131, 37,
        28, 246, 82, 202, 26, 78, 41, 2, 123, 203, 8, 52, 33, 94, 84, 200, 172, 138, 44, 104, 79,
        218, 12, 82, 147, 30, 66, 186, 194, 46, 147, 44, 199, 176, 115, 51, 60, 214, 106, 59, 60,
        26, 6, 153, 25, 247, 151, 36, 61, 112, 225, 87, 150, 209, 32, 206, 173, 252, 237, 147, 61,
        221, 42, 156, 164, 122, 167, 69, 90, 165, 172, 77, 178, 119, 25, 123, 31, 110, 120, 167,
        144, 55, 212, 153, 108, 240, 83, 71, 250, 205, 4, 32, 143, 49, 35, 210, 118, 127, 47, 21,
        99, 197, 53, 228, 42, 215, 63, 51, 30, 168, 71, 154, 173, 15, 197, 54, 249, 174, 38, 51,
        45, 119, 88, 105, 117, 221, 68, 47, 210, 90, 43, 108, 174, 172, 139, 22, 192, 112, 220,
        170, 41, 167, 38, 58, 17, 188, 7, 182, 76, 170, 224, 133, 136, 59, 116, 66, 230, 32, 24,
        239, 136, 45, 218, 11, 235, 6, 75, 112, 79, 105, 250, 80, 22, 86, 186, 4, 145, 57, 152,
        186, 231, 118, 51, 150, 81, 245, 101, 127, 218, 110, 189, 246, 230, 198, 203, 110, 110,
        186, 26, 73, 67, 75, 6, 112, 27, 114, 22, 234, 174, 26, 68, 81, 125, 212, 103, 159, 70, 15,
        170, 221, 78, 88, 68, 176, 148, 207, 7, 49, 116, 58, 96, 193, 1, 137, 182, 135,
    ];

    #[test]
    fn proof_should_succeed() {
        let vk = VERIFYINGKEY;
        let pi = PUBLIC_INPUT;

        let proof_a = PROOF[0..64].try_into().unwrap();
        let proof_b = PROOF[64..192].try_into().unwrap();
        let proof_c = PROOF[192..256].try_into().unwrap();

        let mut verifier =
            Groth16Verifier::<'_, 1>::new(&proof_a, &proof_b, &proof_c, &pi, &vk).unwrap();

        verifier.prepare_inputs::<true>().unwrap();
        verifier.verify().unwrap();
    }
}
