use anchor_lang::prelude::*;

pub fn _initialize(_ctx: &mut Context<InitializeAccounts>) -> Result<()> {
    msg!("Initializing zk factor");
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeAccounts<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    // Program accounts
    pub system_program: Program<'info, System>,
}
