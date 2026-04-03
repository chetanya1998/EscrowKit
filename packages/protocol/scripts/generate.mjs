import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
`;

fs.writeFileSync(outputPath, source);
