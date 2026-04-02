"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, Check, ExternalLink, ShieldCheck, Code2, FileText, Info} from "lucide-react"
import { toast } from "sonner"

/* ─── Embedded Solidity Snippets ─── */

const CONTRACT_SOURCES: Record<string, { name: string; filename: string; description: string; highlights: string[]; source: string }> = {
    milestone: {
        name: "MilestoneEscrow",
        filename: "MilestoneEscrow.sol",
        description: "Phased payment escrow — funds locked per milestone, released only on payer approval or auto-release after review period.",
        highlights: [
            "Funds locked until payer approves deliverable",
            "Auto-release after review period expires",
            "Late delivery penalty (payeePenaltyBps)",
            "Late review penalty (payerPenaltyBps)",
            "Arbiter-mediated dispute resolution",
        ],
        source: `// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IMilestoneEscrow.sol";
import "./interfaces/IArbitrationAdapter.sol";

contract MilestoneEscrow is Initializable, IMilestoneEscrow, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public payer;
    address public payee;
    address public arbiter;
    address public arbitrationAdapter;
    IERC20  public token;
    EscrowConfig public config;
    Milestone[] public milestones;

    function initialize(
        address _payer, address _payee, address _arbiter,
        address _arbitrationAdapter, address _token,
        address _verificationOracle,
        EscrowConfig calldata _config,
        uint256[] calldata amounts,
        string[]  calldata descriptions,
        uint256[] calldata deadlines,
        bytes32[] calldata conditionHashes
    ) external initializer { ... }

    function fund() external payable onlyPayer { ... }

    function submitDeliverable(uint256 milestoneId, bytes32 hash)
        external onlyPayee { ... }

    function approveMilestone(uint256 milestoneId) external {
        // Only payer can approve; triggers releaseMilestone
    }

    function releaseMilestone(uint256 milestoneId) public nonReentrant {
        // Calculates late penalties, transfers funds to payee
    }

    function automaticRelease(uint256 milestoneId) external nonReentrant {
        // Payee calls after reviewPeriod; includes payer delay penalty
    }

    function refundMilestone(uint256 milestoneId) external nonReentrant {
        // Payer reclaims if deadline passed and no submission
    }

    function openDispute(uint256 milestoneId) external payable { ... }
    function resolveDispute(uint256 milestoneId, MilestoneStatus resolution)
        public nonReentrant { ... }
}`,
    },
    rental: {
        name: "RentalEscrow",
        filename: "RentalEscrow.sol",
        description: "Security deposit vault for property rentals — landlord can claim damages within a window, tenant auto-withdraws after.",
        highlights: [
            "Deposit held in neutral digital vault",
            "Landlord claim window with reason logging",
            "Auto-refund if no claim filed in time",
            "Tenant can dispute unfair claims",
            "Arbiter rules on contested claims",
        ],
        source: `// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IRentalEscrow.sol";

contract RentalEscrow is Initializable, IRentalEscrow, ReentrancyGuard {
    address public payer;   // Tenant
    address public payee;   // Landlord
    address public arbiter;
    uint256 public depositAmount;
    RentalConfig public config;
    RentalStatus public status;

    function initialize(
        address _payer, address _payee, address _arbiter,
        address _arbitrationAdapter, address _token,
        uint256 _depositAmount, RentalConfig calldata _config
    ) external initializer { ... }

    function deposit() external payable {
        // Tenant funds the exact deposit amount
    }

    function claim(uint256 amount, string calldata reason) external {
        // Landlord claims damages within claimWindow
    }

    function acceptClaim() external {
        // Tenant accepts claim → funds released to landlord
    }

    function disputeClaim() external payable {
        // Tenant disputes → arbiter decides
    }

    function rule(uint256 disputeId, uint256 ruling) external {
        // Arbiter splits funds between parties
    }
}`,
    },
    service: {
        name: "ServiceEscrow",
        filename: "ServiceEscrow.sol",
        description: "One-off service contract — payment locked until delivery, with review period for auto-release and late penalties.",
        highlights: [
            "Client confirms satisfaction before payout",
            "Built-in review timer for fair payment",
            "Late delivery penalty deducted from payout",
            "Standardised dispute windows",
            "Auto-release after review period",
        ],
        source: `// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IServiceEscrow.sol";

contract ServiceEscrow is Initializable, IServiceEscrow, ReentrancyGuard {
    address public payer;   // Buyer
    address public payee;   // Provider
    address public arbiter;
    uint256 public depositAmount;
    uint256 public deadline;
    ServiceConfig public config;
    ServiceStatus public status;

    function initialize(
        address _payer, address _payee, address _arbiter,
        address _arbitrationAdapter, address _token,
        uint256 _depositAmount, uint256 _deadline,
        ServiceConfig calldata _config
    ) external initializer { ... }

    function fund() external payable { ... }

    function submit(bytes32 deliverableHash) external {
        // Provider submits deliverable hash
    }

    function approve() external {
        // Buyer approves → triggers release
    }

    function release() public nonReentrant {
        // Transfers funds minus any late penalty
    }

    function autoRelease() external nonReentrant {
        // Provider calls after reviewPeriod elapses
    }

    function refund() external nonReentrant {
        // Buyer reclaims if deadline passed
    }

    function openDispute() external payable { ... }
    function rule(uint256 disputeId, uint256 ruling) external { ... }
}`,
    },
    lease: {
        name: "LeaseEscrow",
        filename: "LeaseEscrow.sol",
        description: "Multi-period recurring lease — entire term funded upfront, lessor claims each period as it elapses.",
        highlights: [
            "Full lease value locked upfront",
            "Lessor claims per-period as time elapses",
            "Early termination with pro-rata refund",
            "Dispute mechanism for contested periods",
            "Transparent on-chain payment schedule",
        ],
        source: `// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/ILeaseEscrow.sol";

contract LeaseEscrow is Initializable, ILeaseEscrow, ReentrancyGuard {
    address public payer;   // Lessee
    address public payee;   // Lessor
    address public arbiter;
    LeaseConfig public config;
    LeaseStatus public status;
    uint256 public startTime;
    uint256 public claimedPeriods;

    function initialize(
        address _payer, address _payee, address _arbiter,
        address _arbitrationAdapter, address _token,
        LeaseConfig calldata _config
    ) external initializer { ... }

    function deposit() external payable {
        // Lessee funds totalPeriods × amountPerPeriod
    }

    function claimPeriod() external {
        // Lessor claims one elapsed period at a time
    }

    function terminate() external {
        // Early termination with pro-rata refund
    }

    function openDispute() external payable { ... }
    function rule(uint256 disputeId, uint256 ruling) external { ... }
}`,
    },
    b2b: {
        name: "B2BVendorEscrow",
        filename: "B2BVendorEscrow.sol",
        description: "Invoice-based B2B escrow — supports Net-X payment terms, delivery deadlines, and vendor penalty for late delivery.",
        highlights: [
            "Net-X day payment terms (Net-30, Net-60)",
            "Delivery deadline enforcement",
            "Vendor late-delivery penalty (BPS)",
            "Arbiter-mediated dispute resolution",
            "Auto-release after payment term elapses",
        ],
        source: `// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IB2BVendorEscrow.sol";

contract B2BVendorEscrow is Initializable, IB2BVendorEscrow, ReentrancyGuard {
    address public payer;   // Client
    address public payee;   // Vendor
    address public arbiter;
    uint256 public depositAmount;
    uint256 public deadline;
    B2BConfig public config;

    function initialize(
        address _payer, address _payee, address _arbiter,
        address _arbitrationAdapter, address _token,
        uint256 _depositAmount, uint256 _deadline,
        B2BConfig calldata _config
    ) external initializer { ... }

    function fund() external payable { ... }

    function markDelivered() external {
        // Vendor marks goods/service as delivered
    }

    function confirmDelivery() external {
        // Client confirms → triggers release
    }

    function release() public nonReentrant {
        // Transfers funds minus any late penalty
    }

    function autoRelease() external nonReentrant {
        // After payment term elapses
    }

    function refund() external nonReentrant {
        // Client reclaims if deadline missed
    }

    function openDispute() external payable { ... }
    function rule(uint256 disputeId, uint256 ruling) external { ... }
}`,
    },
}

/* ─── Determine contract type from transaction data ─── */
function getContractType(tx: any): string {
    const desc = (tx.description || "").toLowerCase()
    if (desc.includes("rental") || desc.includes("deposit")) return "rental"
    if (desc.includes("service") || desc.includes("gig")) return "service"
    if (desc.includes("lease")) return "lease"
    if (desc.includes("b2b") || desc.includes("vendor") || desc.includes("invoice")) return "b2b"
    return "milestone" // default
}

/* ─── Component Props ─── */
interface ContractPreviewModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    transaction: any | null
}

export function ContractPreviewModal({ open, onOpenChange, transaction }: ContractPreviewModalProps) {
    const [copied, setCopied] = useState(false)

    if (!transaction) return null

    const contractType = getContractType(transaction)
    const contract = CONTRACT_SOURCES[contractType]
    const explorerUrl = process.env.NEXT_PUBLIC_EXPLORER_URL || "https://sepolia.basescan.org"

    const handleCopy = () => {
        navigator.clipboard.writeText(contract.source)
        setCopied(true)
        toast.success("Source code copied to clipboard")
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-50 sm:max-w-[780px] p-0 overflow-hidden max-h-[90vh]">
                {/* Top accent bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>

                <div className="p-6 pb-0">
                    <DialogHeader className="mb-4">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shrink-0">
                                <Code2 className="h-7 w-7" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <DialogTitle className="text-xl font-bold flex items-center gap-2 flex-wrap">
                                    {transaction.description || `Escrow #${transaction.id}`}
                                    <Badge variant="secondary" className="text-[10px] font-mono opacity-70 h-5 px-1.5 shrink-0">
                                        {contract.filename}
                                    </Badge>
                                </DialogTitle>
                                <DialogDescription className="text-neutral-400 mt-1 text-sm">
                                    {contract.description}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="px-6 pb-6 overflow-y-auto">
                    <Tabs defaultValue="source" className="w-full">
                        <TabsList className="bg-neutral-950 border border-neutral-800 p-1 mb-4">
                            <TabsTrigger value="source" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all gap-1.5 text-sm">
                                <Code2 className="h-3.5 w-3.5" /> Source Code
                            </TabsTrigger>
                            <TabsTrigger value="details" className="data-[state=active]:bg-neutral-800 transition-all gap-1.5 text-sm">
                                <Info className="h-3.5 w-3.5" /> How It Works
                            </TabsTrigger>
                        </TabsList>

                        {/* Source Code Tab */}
                        <TabsContent value="source" className="space-y-3 mt-0">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="h-3 w-3 rounded-full bg-red-500/70"></div>
                                        <div className="h-3 w-3 rounded-full bg-amber-500/70"></div>
                                        <div className="h-3 w-3 rounded-full bg-emerald-500/70"></div>
                                    </div>
                                    <span className="text-xs text-neutral-500 font-mono ml-2">{contract.filename}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-emerald-500 hover:bg-emerald-500/10 gap-1.5"
                                    onClick={handleCopy}
                                >
                                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    {copied ? "Copied" : "Copy"}
                                </Button>
                            </div>
                            <div className="relative">
                                <pre className="bg-neutral-950 p-5 rounded-xl overflow-auto text-[11px] font-mono leading-relaxed text-emerald-400/80 border border-neutral-800 max-h-[380px] custom-scrollbar whitespace-pre">
                                    {contract.source.split("\n").map((line, i) => (
                                        <div key={i} className="flex">
                                            <span className="w-8 text-right text-neutral-700 select-none pr-4 shrink-0">{i + 1}</span>
                                            <span className={
                                                line.trimStart().startsWith("//") ? "text-neutral-600 italic" :
                                                line.includes("pragma") || line.includes("import") ? "text-cyan-500/70" :
                                                line.includes("contract ") ? "text-amber-400" :
                                                line.includes("function ") ? "text-blue-400" :
                                                line.includes("modifier ") ? "text-purple-400" :
                                                line.includes("event ") || line.includes("emit ") ? "text-pink-400/80" :
                                                line.includes("require(") ? "text-red-400/70" :
                                                line.includes("external") || line.includes("public") || line.includes("internal") ? "text-emerald-400/80" :
                                                "text-neutral-300"
                                            }>{line}</span>
                                        </div>
                                    ))}
                                </pre>
                            </div>

                            {transaction.counterparty && transaction.counterparty.startsWith("0x") && (
                                <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Deployed Address</span>
                                        <code className="text-xs text-neutral-400 font-mono mt-0.5">{transaction.counterparty}</code>
                                    </div>
                                    <a
                                        href={`${explorerUrl}/address/${transaction.counterparty}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-xs text-emerald-500 hover:text-emerald-400 underline underline-offset-4"
                                    >
                                        View on Explorer <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>
                            )}
                        </TabsContent>

                        {/* Details Tab */}
                        <TabsContent value="details" className="space-y-5 mt-0">
                            <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-800">
                                <h4 className="text-emerald-500 font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <FileText className="h-4 w-4" /> Contract Purpose
                                </h4>
                                <p className="text-neutral-200 leading-relaxed text-sm">
                                    {contract.description}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-emerald-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4" /> Security Guarantees
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    {contract.highlights.map((point, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded-xl">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            <span className="text-xs text-neutral-300">{point}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                                <Badge variant="outline" className="text-emerald-400 border-emerald-900 bg-emerald-900/10 text-[10px]">
                                    Solidity ^0.8.20
                                </Badge>
                                <Badge variant="outline" className="text-amber-400 border-amber-900 bg-amber-900/10 text-[10px]">
                                    OpenZeppelin
                                </Badge>
                                <Badge variant="outline" className="text-blue-400 border-blue-900 bg-blue-900/10 text-[10px]">
                                    ReentrancyGuard
                                </Badge>
                                <Badge variant="outline" className="text-purple-400 border-purple-900 bg-purple-900/10 text-[10px]">
                                    Initializable
                                </Badge>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    )
}
