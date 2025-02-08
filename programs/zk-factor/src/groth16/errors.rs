use anchor_lang::prelude::*;

#[error_code]
pub enum Groth16Error {
    #[msg("Incompatible Verifying Key with number of public inputs")]
    IncompatibleVerifyingKeyWithNrPublicInputs,
    #[msg("ProofVerificationFailed")]
    ProofVerificationFailed,
    #[msg("PreparingInputsG1AdditionFailed")]
    PreparingInputsG1AdditionFailed,
    #[msg("PreparingInputsG1MulFailed")]
    PreparingInputsG1MulFailed,
    #[msg("InvalidG1Length")]
    InvalidG1Length,
    #[msg("InvalidG2Length")]
    InvalidG2Length,
    #[msg("InvalidPublicInputsLength")]
    InvalidPublicInputsLength,
    #[msg("DecompressingG1Failed")]
    DecompressingG1Failed,
    #[msg("DecompressingG2Failed")]
    DecompressingG2Failed,
    #[msg("PublicInputGreaterThenFieldSize")]
    PublicInputGreaterThenFieldSize,
}
