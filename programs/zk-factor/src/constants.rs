use crate::public_input;

pub const DISCRIMINATOR: usize = 8;
pub const PUBLIC_INPUT: [[u8; 32]; 1] = public_input!(1337, 2);
