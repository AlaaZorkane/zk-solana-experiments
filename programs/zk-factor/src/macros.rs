#[macro_export]
macro_rules! public_input {
    ($num:expr, $size:expr) => {{
        const fn make_input() -> [[u8; 32]; 1] {
            let mut bytes = [0u8; 32];
            const START: usize = 32 - $size;
            let mut i = 0;
            while i < $size {
                bytes[START + i] = (($num >> (8 * ($size - 1 - i))) & 0xff) as u8;
                i += 1;
            }
            [bytes]
        }
        make_input()
    }};
}
