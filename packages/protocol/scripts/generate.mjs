import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { keccak256, toBytes } from "viem";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const contractsOutDir = path.join(repoRoot, "packages/contracts/out");
const outputPath = path.join(repoRoot, "packages/protocol/src/generated.ts");

function readArtifact(name, contractName = name) {
  const artifactPath = path.join(
    contractsOutDir,
    `${name}.sol`,
    `${contractName}.json`,
  );
  const raw = fs.readFileSync(artifactPath, "utf8");
  return JSON.parse(raw);
}

function runtimeHash(artifact) {
  const object =
    artifact?.deployedBytecode?.object ??
    artifact?.bytecode?.object ??
    "";

  if (!object || object === "0x") {
    return "0x";
  }

  const bytecode = object.startsWith("0x") ? object : `0x${object}`;
  return keccak256(toBytes(bytecode));
}

function toConst(name, value) {
  return `export const ${name} = ${JSON.stringify(value)} as const;\n`;
}

const artifacts = {
  FactoryV2ABI: readArtifact("EscrowFactory").abi,
  MilestoneEscrowV2ABI: readArtifact("MilestoneEscrow").abi,
  RentalEscrowABI: readArtifact("RentalEscrow").abi,
  ServiceEscrowABI: readArtifact("ServiceEscrow").abi,
  LeaseEscrowABI: readArtifact("LeaseEscrow").abi,
  B2BVendorEscrowABI: readArtifact("B2BVendorEscrow").abi,
  SimpleArbiterAdapterABI: readArtifact("SimpleArbiterAdapter").abi,
  VerificationOracleABI: readArtifact("VerificationOracle").abi,
};

const source = `import type { Abi } from "viem";

${Object.entries(artifacts)
  .map(([name, abi]) => `export const ${name} = ${JSON.stringify(abi)} as Abi;`)
  .join("\n")}

${toConst(
  "FactoryV2RuntimeBytecodeHash",
  runtimeHash(readArtifact("EscrowFactory")),
)}${toConst(
  "MilestoneEscrowV2RuntimeBytecodeHash",
  runtimeHash(readArtifact("MilestoneEscrow")),
)}`;

fs.writeFileSync(outputPath, source);
