"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRole } from "@/hooks/useRole";
import { useWallet } from "@/hooks/useWallet";
import { getBrowserProvider, getJobPortalContract, Role } from "@/lib/web3/jobPortal";

function roleLabel(role: Role) {
  switch (role) {
    case Role.JobSeeker:
      return "Job Seeker";
    case Role.Employer:
      return "Employer";
    case Role.Validator:
      return "Validator";
    default:
      return "None";
  }
}

export default function RegisterClient() {
  const router = useRouter();
  const { address, isConnecting, error, connect } = useWallet();
  const { role, isLoadingRole, error: roleError } = useRole(address);

  const [selectedRole, setSelectedRole] = useState<Role>(Role.JobSeeker);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const profileKey = useMemo(() => {
    return address ? `Job Chain.profile.${address.toLowerCase()}` : null;
  }, [address]);

  async function onRegister() {
    setSubmitError(null);

    if (!address) {
      await connect();
    }

    const provider = getBrowserProvider();
    const signer = await provider.getSigner();
    const contract = getJobPortalContract(signer);

    setIsSubmitting(true);
    try {
      const tx = await contract.register(selectedRole);
      await tx.wait();

      if (profileKey) {
        localStorage.setItem(
          profileKey,
          JSON.stringify({ displayName, bio, role: selectedRole })
        );
      }

      router.push("/jobs");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl shadow-xl border-0 rounded-2xl">
        <CardHeader className="px-8 pt-8 pb-4">
          <h1 className="text-2xl font-bold">Sign up / Register</h1>
          <p className="text-gray-600">
            Choose your role. This is stored on-chain so the app knows if you’re a job seeker or
            an employer.
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
            <div className="space-y-4">
              <div className="rounded-xl bg-gray-100 p-4">
                <div className="text-sm text-gray-600">Connected wallet</div>
                <div className="font-mono text-sm break-words">{address}</div>
              </div>

              <div>
                <div className="text-sm text-gray-600">Current on-chain role</div>
                <div className="font-semibold">
                  {isLoadingRole ? "Checking…" : role !== null ? roleLabel(role) : "—"}
                </div>
                {roleError ? (
                  <p className="mt-2 text-sm text-red-600 break-words">{roleError}</p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label>Choose role</Label>
                <div className="flex flex-wrap gap-2">
                  {[Role.JobSeeker, Role.Employer, Role.Validator].map((r) => (
                    <Button
                      key={r}
                      type="button"
                      variant={selectedRole === r ? "default" : "outline"}
                      onClick={() => setSelectedRole(r)}
                    >
                      {roleLabel(r)}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  For demo simplicity, you can re-register to change roles.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="displayName">Display name (optional)</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., Aman Qureshi"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bio">Bio (optional)</Label>
                <Input
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Short intro for demo"
                />
              </div>

              {submitError ? (
                <p className="text-sm text-red-600 break-words">{submitError}</p>
              ) : null}

              <Button className="w-full" onClick={() => void onRegister()} disabled={isSubmitting}>
                {isSubmitting ? "Registering…" : "Register on-chain"}
              </Button>

              <div className="text-sm text-gray-600">
                Already registered? <Link className="underline" href="/auth/sign-in">Sign in</Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
