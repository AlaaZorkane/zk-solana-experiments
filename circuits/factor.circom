pragma circom 2.2.1;

template Factor() {
    signal input p;
    signal input q;
    
    signal output n;
    
    n <== p * q;
}

component main = Factor();
