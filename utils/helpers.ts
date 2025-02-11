import { type DestinationStream, type Logger, pino } from "pino";
import { build } from "pino-pretty";

const BASE_OPTIONS = {
  colorize: true,
  colorizeObjects: true,
  sync: true,
} as const;

const prettyStream = build({
  ...BASE_OPTIONS,
  ignore: "hostname,pid,time",
});
const prettyStreamWithTimestamp = build({
  ...BASE_OPTIONS,
  ignore: "hostname,pid",
});

let fatalLoggerInstalled = false;
function ensureFatalLogger(logger: Logger<never>) {
  if (fatalLoggerInstalled) {
    return;
  }
  fatalLoggerInstalled = true;
  process.on("uncaughtException", (err) => {
    logger.fatal(err);
    process.exit(1);
  });
}

function createLoggerWithName(name: string, stream: DestinationStream) {
  return pino(
    {
      level: "debug",
      name,
    },
    stream,
  );
}

export function createLogger(name: string) {
  const logger = createLoggerWithName(name, prettyStream);
  ensureFatalLogger(logger);
  return logger;
}

export function createLoggerWithTimestamp(name: string) {
  const logger = createLoggerWithName(name, prettyStreamWithTimestamp);
  ensureFatalLogger(logger);
  return logger;
}

export function explorerUrl(tx: string, cluster = "devnet") {
  return `https://explorer.solana.com/tx/${tx}?cluster=${cluster}`;
}

/**
 * Convert a decimal string representation of a big integer to a fixed-length Uint8Array.
 */
export function bigIntToLeUint8Array(numStr: string, byteLength = 32) {
  let bn = BigInt(numStr);
  const buffer = new Uint8Array(byteLength);

  for (let i = 0; i < byteLength; i++) {
    buffer[i] = Number(bn & 0xffn); // Extract the lowest 8 bits.
    bn >>= 8n; // Shift right by 8 bits.
  }

  return buffer;
}
