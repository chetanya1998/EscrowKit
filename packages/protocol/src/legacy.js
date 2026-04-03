"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegacyMilestoneRuntimeBytecodeHash = exports.MilestoneEscrowV1ABI = exports.FactoryV1ABI = void 0;
const EscrowFactoryV1_json_1 = __importDefault(require("../artifacts/legacy/EscrowFactoryV1.json"));
const MilestoneEscrowV1_json_1 = __importDefault(require("../artifacts/legacy/MilestoneEscrowV1.json"));
exports.FactoryV1ABI = EscrowFactoryV1_json_1.default.abi;
exports.MilestoneEscrowV1ABI = MilestoneEscrowV1_json_1.default.abi;
exports.LegacyMilestoneRuntimeBytecodeHash = "0x8f03b6930a9ffb1e5ada52674149d6cb9ff30ea13ea1f3df220c309652693069";
//# sourceMappingURL=legacy.js.map