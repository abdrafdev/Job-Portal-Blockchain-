"use client";

import { getAddress } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { getBrowserProvider } from "@/lib/web3/jobPortal";

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const provider = getBrowserProvider();
      const accounts = (await provider.send("eth_accounts", [])) as string[];
      const network = await provider.getNetwork();

      setChainId(Number(network.chainId));
      setAddress(accounts[0] ? getAddress(accounts[0]) : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setAddress(null);
      setChainId(null);
    }
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      setError(null);
      const provider = getBrowserProvider();
      const accounts = (await provider.send("eth_requestAccounts", [])) as string[];
      const network = await provider.getNetwork();
      setChainId(Number(network.chainId));
      setAddress(accounts[0] ? getAddress(accounts[0]) : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Note: wallets don't support programmatic "disconnect"; we just clear local state.
  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  useEffect(() => {
    void refresh();

    const eth = window.ethereum;
    if (!eth?.on) return;

    const onAccountsChanged = (accounts: string[]) => {
      setAddress(accounts[0] ? getAddress(accounts[0]) : null);
    };

    const onChainChanged = () => {
      // simplest: refresh everything
      void refresh();
    };

    eth.on("accountsChanged", onAccountsChanged);
    eth.on("chainChanged", onChainChanged);

    return () => {
      eth.removeListener?.("accountsChanged", onAccountsChanged);
      eth.removeListener?.("chainChanged", onChainChanged);
    };
  }, [refresh]);

  return { address, chainId, isConnecting, error, connect, disconnect, refresh };
}
