"use client"

import { useState, useEffect, useCallback } from "react"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { isNativeToken } from "@/lib/tokens"

/** Minimal ERC-20 ABI for allowance + approve */
const ERC20_ABI = [
    {
        name: "allowance",
        type: "function",
        stateMutability: "view",
        inputs: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
        ],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "approve",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        outputs: [{ name: "", type: "bool" }],
    },
] as const;

interface UseTokenApprovalParams {
    tokenAddress: `0x${string}`;
    spender: `0x${string}`;
    amount: bigint;
}

export function useTokenApproval({ tokenAddress, spender, amount }: UseTokenApprovalParams) {
    const { address: owner } = useAccount();

    const isNative = isNativeToken(tokenAddress);

    // Read current allowance
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: owner ? [owner, spender] : undefined,
        query: {
            enabled: !!owner && !isNative,
        },
    });

    const needsApproval = !isNative && (allowance === undefined || (allowance as bigint) < amount);

    // Write approve
    const {
        writeContract: writeApprove,
        data: approveTxHash,
        isPending: isApprovePending,
        error: approveError,
    } = useWriteContract();

    const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({
        hash: approveTxHash,
    });

    const isApproving = isApprovePending || isApproveConfirming;

    // Refetch after confirmation
    useEffect(() => {
        if (isApproveConfirmed) {
            refetchAllowance();
        }
    }, [isApproveConfirmed, refetchAllowance]);

    const approve = useCallback(() => {
        if (!owner || isNative) return;
        writeApprove({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [spender, amount],
        });
    }, [owner, isNative, tokenAddress, spender, amount, writeApprove]);

    return {
        needsApproval,
        approve,
        isApproving,
        isApproveConfirmed,
        allowance: allowance as bigint | undefined,
        approveError,
        isNative,
    };
}
