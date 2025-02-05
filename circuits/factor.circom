pragma circom 2.2.1;

template Factor() {
    // Private inputs: factors p and q
    signal input p;
    signal input q;
    
    // Public output: N = p * q
    signal output N;
    
    // Enforce that p * q == N
    N <== p * q;
}

component main = Factor();
