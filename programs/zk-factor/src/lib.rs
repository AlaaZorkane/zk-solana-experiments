#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod groth16;
pub mod instructions;
pub mod state;

pub use constants::*;
pub use errors::*;
pub use groth16::*;
pub use instructions::*;
pub use state::*;

declare_id!("escSmDEY26evSYow7Nio1WtkNFneo95DTq83P4myqer");

#[program]
pub mod zk_factor {
    use super::*;

    pub fn initialize(mut ctx: Context<InitializeAccounts>) -> Result<()> {
        _initialize(&mut ctx)
    }
}
