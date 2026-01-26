"use client";

import { useEffect, useState } from "react";
import { getBrowserProvider, getJobPortalContract, Role } from "@/lib/web3/jobPortal";

export function useRole(address: string | null) {
  const [role, setRole] = useState<Role | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!address) {
        setRole(null);
        return;
      }

      setIsLoadingRole(true);
      try {
        setError(null);
        const provider = getBrowserProvider();
        const contract = getJobPortalContract(provider);
        const raw = (await contract.getRole(address)) as bigint;
        const nextRole = Number(raw) as Role;
        if (!cancelled) setRole(nextRole);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setIsLoadingRole(false);
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [address]);

  return { role, isLoadingRole, error };
}
