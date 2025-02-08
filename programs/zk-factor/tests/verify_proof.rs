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
