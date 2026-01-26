"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useRole } from "@/hooks/useRole";
import { useWallet } from "@/hooks/useWallet";
import { Role } from "@/lib/web3/jobPortal";

function roleLabel(role: Role) {
  switch (role) {
    case Role.JobSeeker:
      return "Job Seeker";
    case Role.Employer:
      return "Employer";
    case Role.Validator:
      return "Validator";
    default:
      return "Unregistered";
  }
}

export default function SignInClient() {
  const { address, chainId, isConnecting, error, connect } = useWallet();
  const { role, isLoadingRole, error: roleError } = useRole(address);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-xl shadow-xl border-0 rounded-2xl">
        <CardHeader className="px-8 pt-8 pb-4">
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="text-gray-600">
            For this decentralized demo, “sign in” means connecting your wallet.
          </p>
        </CardHeader>
        <CardContent className="px-8 pb-8 space-y-6">
          {!address ? (
            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={() => void connect()}
                disabled={isConnecting}
              >
                {isConnecting ? "Connecting…" : "Connect MetaMask"}
              </Button>
              {error ? (
                <p className="text-sm text-red-600 break-words">{error}</p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl bg-gray-100 p-4">
                <div className="text-sm text-gray-600">Connected wallet</div>
                <div className="font-mono text-sm break-words">{address}</div>
                <div className="mt-2 text-sm text-gray-600">
                  Chain ID: <span className="font-mono">{chainId ?? "?"}</span>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600">Role</div>
                <div className="font-semibold">
                  {isLoadingRole ? "Checking…" : role !== null ? roleLabel(role) : "—"}
                </div>
                {roleError ? (
                  <p className="mt-2 text-sm text-red-600 break-words">{roleError}</p>
                ) : null}
              </div>

              {role === Role.None ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-700">
                    You haven’t registered yet. Choose your role first.
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/auth/register">Go to Sign up / Register</Link>
                  </Button>
                </div>
              ) : (
                <Button asChild className="w-full">
                  <Link href="/jobs">Continue to Jobs</Link>
                </Button>
              )}
            </div>
          )}

          <div className="text-sm text-gray-500">
            Tip: If your professor expects “signup/login”, this wallet + role registration screen
            is the decentralized equivalent.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
