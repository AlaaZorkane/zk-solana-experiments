#![cfg(feature = "test-sbf")]

use ark_bn254::{Bn254, Fr};
use ark_circom::{CircomBuilder, CircomConfig};
use ark_crypto_primitives::snark::SNARK;
use ark_ff::BigInt;
use ark_groth16::Groth16;
use ark_std::rand::thread_rng;

type GrothBn = Groth16<Bn254>;
type BigIntFr = BigInt<4>;

#[tokio::test]
#[cfg(feature = "circom-2")]
async fn success_initialize() {
    use ark_ff::{BigInt, PrimeField};
    let cfg = CircomConfig::<Fr>::new(
        "../../circuits/factor.wasm",
        // --
        "../../circuits/factor.r1cs",
    )
    .unwrap();

    let mut builder = CircomBuilder::new(cfg);
    // N = 1337
    // p = 7
    // q = 191
    builder.push_input("p", 7);
    builder.push_input("q", 191);

    let circom = builder.setup();

    let mut rng = thread_rng();
    let params = GrothBn::generate_random_parameters_with_reduction(circom, &mut rng).unwrap();

    let circom = builder.build().unwrap();
    let inputs = circom.get_public_inputs().unwrap();
    let n_public = inputs[0].into_bigint();
    let n: BigIntFr = BigInt::from(1337u64);

    assert_eq!(n_public, n);

    let proof = GrothBn::prove(&params, circom, &mut rng).unwrap();
    let pvk = GrothBn::process_vk(&params.vk).unwrap();
    let verified = GrothBn::verify_with_processed_vk(&pvk, &inputs, &proof).unwrap();
    assert!(verified);
}

#[tokio::test]
async fn arkworks_example() {
    use ark_bn254::{Fq, G1Affine};
    use ark_ff::PrimeField;
    use ark_serialize::CanonicalSerialize;
    use std::str::FromStr;

    let x_str = "9808577567423814999024089682704297605796107367531073075437292778173924515132";
    let y_str = "18221916093791992241288896717840648349385542774204272380483868650892920292903";
    let x = BigInt::from_str(x_str).expect("Failed to parse x coordinate");
    let y = BigInt::from_str(y_str).expect("Failed to parse y coordinate");

    // Convert the strings to field elements of type Fq.
    // (Make sure that Fq implements FromStr; if not, use an appropriate method to construct Fq.)
    let x = Fq::from_bigint(x).expect("Failed to parse x coordinate");
    let y = Fq::from_bigint(y).expect("Failed to parse y coordinate");

    // Since the third coordinate is 1, the point is in affine form.
    // Create the G1 point in affine coordinates.
    let g1_affine = G1Affine::new(x, y);

    // (Optional) Check that the point is on the curve.
    assert!(g1_affine.is_on_curve(), "Point is not on the curve!");

    // Now convert the affine point to its uncompressed representation.
    let mut writer = Vec::new();
    g1_affine.serialize_uncompressed(&mut writer).unwrap();
    let g1_uncompressed = writer;

    // For example, print the uncompressed bytes.
    println!("Uncompressed G1 point: {:?}", g1_uncompressed);
}
