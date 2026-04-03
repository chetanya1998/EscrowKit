"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtocolVersion = exports.EscrowKind = void 0;
var EscrowKind;
(function (EscrowKind) {
    EscrowKind[EscrowKind["Milestone"] = 0] = "Milestone";
    EscrowKind[EscrowKind["Rental"] = 1] = "Rental";
    EscrowKind[EscrowKind["Service"] = 2] = "Service";
    EscrowKind[EscrowKind["Lease"] = 3] = "Lease";
    EscrowKind[EscrowKind["B2BVendor"] = 4] = "B2BVendor";
})(EscrowKind || (exports.EscrowKind = EscrowKind = {}));
var ProtocolVersion;
(function (ProtocolVersion) {
    ProtocolVersion[ProtocolVersion["V1"] = 1] = "V1";
    ProtocolVersion[ProtocolVersion["V2"] = 2] = "V2";
})(ProtocolVersion || (exports.ProtocolVersion = ProtocolVersion = {}));
//# sourceMappingURL=types.js.map