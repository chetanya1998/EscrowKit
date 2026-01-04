'use client'

import React from 'react';
import Link from 'next/link';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { injected } from 'wagmi/connectors';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          EscrowKit Dashboard
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:size-auto lg:bg-none">
          {isConnected ? (
            <div className="flex gap-4 items-center">
              <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
              <Button onClick={() => disconnect()}>Disconnect</Button>
            </div>
          ) : (
            <Button onClick={() => connect({ connector: injected() })}>Connect Wallet</Button>
          )}
        </div>
      </div>

      <div className="relative flex place-items-center">
        <h1 className="text-4xl font-bold tracking-tight">Trustless Escrow Engine</h1>
      </div>

      <div className="mb-32 grid text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-3 lg:text-left gap-4">
        <Link href="/create" passHref>
          <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
            <h2 className="mb-3 text-2xl font-semibold">
              Create Escrow{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                &gt;
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Deploy a new milestone-based escrow contract instantly.
            </p>
          </div>
        </Link>

        <Link href="#" passHref>
          <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
            <h2 className="mb-3 text-2xl font-semibold">
              My Escrows{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                &gt;
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              View escrows you are party to.
            </p>
          </div>
        </Link>

        {/* Search Placeholder */}
        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors border-gray-300 bg-gray-50 dark:border-neutral-700 dark:bg-neutral-900">
          <h2 className="mb-3 text-xl font-semibold">Find Escrow</h2>
          <input className="w-full p-2 rounded bg-background border" placeholder="0x..." />
        </div>
      </div>
    </main>
  );
}
