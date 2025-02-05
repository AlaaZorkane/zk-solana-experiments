// verifying_key.ts
import { promises as fs } from "node:fs";
import process from "node:process";
// @ts-ignore - ffjavascript is not typed
import { utils } from "ffjavascript";

const { unstringifyBigInts, leInt2Buff } = utils;

async function main(): Promise<void> {
	const inputPath = process.argv[2];
	if (!inputPath) {
		throw new Error("inputPath not specified");
	}

	// If an output directory is provided, append a trailing slash.
	const outputPath: string = process.argv[3] ? `${process.argv[3]}/` : "";

	// (Optionally disable logging.)
	console.log = () => {};

	// Read and parse the input file.
	const fileBuffer = await fs.readFile(inputPath);
	console.error("File opened successfully!"); // Using error since log was overridden.
	const mydata = JSON.parse(fileBuffer.toString());

	// Process the various sections in mydata.
	for (const [key, value] of Object.entries(mydata)) {
		if (key === "vk_alpha_1") {
			if (Array.isArray(value)) {
				// Convert each element and reverse the resulting buffer.
				mydata.vk_alpha_1 = value.map((elem: string) =>
					leInt2Buff(unstringifyBigInts(elem), 32).reverse(),
				);
			}
		} else if (key === "vk_beta_2") {
			if (Array.isArray(value)) {
				for (let j = 0; j < value.length; j++) {
					console.error("mydata[vk_beta_2][j]:", value[j]);
					const buff0 = Array.from(
						leInt2Buff(unstringifyBigInts(value[j][0]), 32),
					);
					const buff1 = Array.from(
						leInt2Buff(unstringifyBigInts(value[j][1]), 32),
					);
					const tmp = [...buff0, ...buff1].reverse();
					console.error("tmp:", tmp);
					value[j][0] = tmp.slice(0, 32);
					value[j][1] = tmp.slice(32, 64);
				}
			}
		} else if (key === "vk_gamma_2" || key === "vk_delta_2") {
			if (Array.isArray(value)) {
				for (let j = 0; j < value.length; j++) {
					const buff0 = Array.from(
						leInt2Buff(unstringifyBigInts(value[j][0]), 32),
					);
					const buff1 = Array.from(
						leInt2Buff(unstringifyBigInts(value[j][1]), 32),
					);
					const tmp = [...buff0, ...buff1].reverse();
					console.error(`Processing ${key} element ${j}, tmp:`, tmp);
					value[j][0] = tmp.slice(0, 32);
					value[j][1] = tmp.slice(32, 64);
				}
			}
		} else if (key === "vk_alphabeta_12") {
			if (Array.isArray(value)) {
				// Three-level nested array conversion.
				for (let j = 0; j < value.length; j++) {
					if (Array.isArray(value[j])) {
						for (let z = 0; z < value[j].length; z++) {
							if (Array.isArray(value[j][z])) {
								for (let u = 0; u < value[j][z].length; u++) {
									value[j][z][u] = leInt2Buff(
										unstringifyBigInts(value[j][z][u]),
									);
								}
							}
						}
					}
				}
			}
		} else if (key === "IC") {
			if (Array.isArray(value)) {
				// Two-level nested array conversion.
				for (let j = 0; j < value.length; j++) {
					if (Array.isArray(value[j])) {
						for (let z = 0; z < value[j].length; z++) {
							value[j][z] = leInt2Buff(
								unstringifyBigInts(value[j][z]),
								32,
							).reverse();
						}
					}
				}
			}
		}
	}

	// Build the Rust file content.
	let s = "use groth16_solana::groth16::Groth16Verifyingkey;\n\n";
	s += "pub const VERIFYINGKEY: Groth16Verifyingkey = Groth16Verifyingkey {\n";
	s += `\tnr_pubinputs: ${mydata.IC.length},\n\n`;

	// Write vk_alpha_g1.
	s += "\tvk_alpha_g1: [\n";
	for (let j = 0; j < mydata.vk_alpha_1.length - 1; j++) {
		// Convert the buffer into an array of numbers.
		s += `\t\t${Array.from(mydata.vk_alpha_1[j]).toString()},\n`;
	}
	s += "\t],\n\n";

	// Write vk_beta_g2.
	s += "\tvk_beta_g2: [\n";
	for (let j = 0; j < mydata.vk_beta_2.length - 1; j++) {
		for (let z = 0; z < 2; z++) {
			s += `\t\t${Array.from(mydata.vk_beta_2[j][z]).toString()},\n`;
		}
	}
	s += "\t],\n\n";

	// Write vk_gamme_g2 (note: the original code names this “vk_gamme_g2”).
	s += "\tvk_gamme_g2: [\n";
	for (let j = 0; j < mydata.vk_gamma_2.length - 1; j++) {
		for (let z = 0; z < 2; z++) {
			s += `\t\t${Array.from(mydata.vk_gamma_2[j][z]).toString()},\n`;
		}
	}
	s += "\t],\n\n";

	// Write vk_delta_g2.
	s += "\tvk_delta_g2: [\n";
	for (let j = 0; j < mydata.vk_delta_2.length - 1; j++) {
		for (let z = 0; z < 2; z++) {
			s += `\t\t${Array.from(mydata.vk_delta_2[j][z]).toString()},\n`;
		}
	}
	s += "\t],\n\n";

	// Write vk_ic.
	s += "\tvk_ic: &[\n";
	for (const ic of mydata.IC) {
		s += "\t\t[\n";
		// Iterate over all but the last element of each IC array.
		for (let j = 0; j < ic.length - 1; j++) {
			s += `\t\t\t${ic[j].toString()},\n`;
		}
		s += "\t\t],\n";
	}
	s += "\t]\n};";

	// Write the output file.
	await fs.writeFile(`${outputPath}verifying_key.rs`, s, "utf8");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
