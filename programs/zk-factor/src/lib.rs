#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod groth16;
pub mod instructions;
pub mod macros;
pub mod state;
pub mod zk;

pub use constants::*;
pub use errors::*;
pub use groth16::*;
pub use instructions::*;
pub use state::*;
pub use zk::*;

declare_id!("zk1PtMyK25jdTA56c7duVC7Zk2gPKy2Y3PiYhJ4L7ro");

#[program]
pub mod zk_factor {
    use super::*;

    pub fn initialize(mut ctx: Context<InitializeAccounts>, input: InitializeInput) -> Result<()> {
        _initialize(&mut ctx, input)
    }
}
