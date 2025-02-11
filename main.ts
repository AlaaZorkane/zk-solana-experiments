import {
  airdropFactory,
  appendTransactionMessageInstruction,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  devnet,
  generateKeyPairSigner,
  getSignatureFromTransaction,
  lamports,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from "@solana/web3.js";
import { createLogger, explorerUrl } from "./utils/helpers.ts";
import { LAMPORTS_PER_SOL } from "./utils/constants.ts";
import { getInitializeInstruction } from "./clients/js/src/generated/index.ts";
import * as snarkjs from "snarkjs";
import * as Bun from "bun";
import { g1Uncompressed, proofToUint8Array } from "./utils/zk.ts";
// @ts-ignore - ffjavascript is not typed
import { getCurveFromName } from "ffjavascript";
import { unstringifyBigInts } from "./utils/ff.ts";
import { prepare_g1_point, prepare_proofs } from "zk-utils";

const log = createLogger("zk-factor");
const curve = await getCurveFromName("bn128", { singleThread: true });

const keypair = await generateKeyPairSigner();
const keypairPublicKey = keypair.address;

log.info("Signer Public Key: %s", keypairPublicKey);

const rpc = createSolanaRpc(devnet("http://127.0.0.1:8899"));
const rpcSubscriptions = createSolanaRpcSubscriptions(
  devnet("ws://127.0.0.1:8900"),
);
const sendAndConfirm = sendAndConfirmTransactionFactory({
  rpc,
  rpcSubscriptions,
});

const { value: latestBlockhash } = await rpc
  .getLatestBlockhash({
    commitment: "confirmed",
  })
  .send();

log.info("Signer Public Key: %s", keypair.address);

const airdrop = airdropFactory({ rpc, rpcSubscriptions });

// Airdrop 2 SOL to the signer
{
  const tx = await airdrop({
    commitment: "confirmed",
    lamports: lamports(LAMPORTS_PER_SOL * 2n),
    recipientAddress: keypair.address,
  });

  log.info("Airdrop sent: %s", tx);
}

// zk-factor program
{
  // just to simulate here being in a browser
  const wasmFileArrayBuffer = await Bun.file(
    "./circuits/factor.wasm",
  ).arrayBuffer();
  const wasmFile = new Uint8Array(wasmFileArrayBuffer);
  const zkeyFileArrayBuffer = await Bun.file(
    "./circuits/factor.zkey",
  ).arrayBuffer();
  const zkeyFile = new Uint8Array(zkeyFileArrayBuffer);
  const { proof } = await snarkjs.groth16.fullProve(
    { p: 7, q: 191 },
    wasmFile,
    zkeyFile,
    undefined,
    undefined,
    { singleThread: true },
  );

  console.log(proof, "proof");

  const preparedProof = prepare_proofs(proof);

  // write raw proof to a file
  Bun.write("./raw_proof.json", JSON.stringify(preparedProof.raw));

  // Using codama's generated code, we can build the instruction as follows:
  const instruction = getInitializeInstruction({
    user: keypair,
    proofA: new Uint8Array(preparedProof.proof_a),
    proofB: new Uint8Array(preparedProof.proof_b),
    proofC: new Uint8Array(preparedProof.proof_c),
  });

  // We now build the transaction message:
  const txMsg = pipe(
    createTransactionMessage({
      version: 0,
    }),
    (tx) => setTransactionMessageFeePayerSigner(keypair, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) => appendTransactionMessageInstruction(instruction, tx),
  );

  const signedTx = await signTransactionMessageWithSigners(txMsg);

  const tx = getSignatureFromTransaction(signedTx);
  log.info("signature: %s", tx);
  await sendAndConfirm(signedTx, {
    commitment: "confirmed",
  });
  log.info("explorer url: %s", explorerUrl(tx));
}
