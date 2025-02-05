use anchor_lang::prelude::*;

#[error_code]
pub enum ZkFactorError {
    #[msg("Pool is locked")]
    PoolLocked,
}
