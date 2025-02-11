use anchor_lang::prelude::*;

use crate::{Groth16Verifier, PUBLIC_INPUT, VERIFYINGKEY};

pub fn _initialize(_ctx: &mut Context<InitializeAccounts>, input: InitializeInput) -> Result<()> {
    let mut verifier = Groth16Verifier::<'_, 1>::new(
        &input.proof_a,
        &input.proof_b,
        &input.proof_c,
        &PUBLIC_INPUT,
        &VERIFYINGKEY,
    )?;

    verifier.prepare_inputs::<true>()?;
    verifier.verify()?;
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeAccounts<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    // Program accounts
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeInput {
    pub proof_a: [u8; 64],
    pub proof_b: [u8; 128],
    pub proof_c: [u8; 64],
}
