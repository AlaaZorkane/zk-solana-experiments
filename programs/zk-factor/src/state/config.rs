use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct ZkFactorConfig {
    pub authority: Option<Pubkey>,
    pub seed: u64,
    pub fee: u16,
    pub locked: bool,
    pub mint_x: Pubkey,
    pub mint_y: Pubkey,
    pub lp_bump: u8,
    pub bump: u8,
}
