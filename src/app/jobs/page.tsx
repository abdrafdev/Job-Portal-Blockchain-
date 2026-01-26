"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useRole } from "@/hooks/useRole";
import { useWallet } from "@/hooks/useWallet";
import {
  getBrowserProvider,
  getJobPortalContract,
  Role,
} from "@/lib/web3/jobPortal";

type Job = {
  id: number;
  employer: string;
  title: string;
  company: string;
  location: string;
  jobType: string;
  descriptionCID: string;
  createdAt: bigint;
  isOpen: boolean;
};

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

export default function JobsPage() {
  const { address, isConnecting, error, connect } = useWallet();
  const { role, isLoadingRole } = useRole(address);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const canPostJobs = role === Role.Employer;

  const headerText = useMemo(() => {
    if (!address) return "Connect your wallet to view jobs";
    if (role === null) return "Loading…";
    return `Logged in as: ${roleLabel(role)}`;
  }, [address, role]);

  useEffect(() => {
    let cancelled = false;

    async function loadJobs() {
      if (!address) return;

      setIsLoading(true);
      try {
        setLoadError(null);
        const provider = getBrowserProvider();
        const contract = getJobPortalContract(provider);

        const countRaw = (await contract.getJobsCount()) as bigint;
        const count = Number(countRaw);

        const fetched = await Promise.all(
          Array.from({ length: count }, (_, idx) => idx).map(async (id) => {
            const j = (await contract.getJob(id)) as any;
            const job: Job = {
              id,
              employer: j.employer,
              title: j.title,
              company: j.company,
              location: j.location,
              jobType: j.jobType,
              descriptionCID: j.descriptionCID,
              createdAt: j.createdAt,
              isOpen: j.isOpen,
            };
            return job;
          })
        );

        if (!cancelled) setJobs(fetched);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadJobs();

    return () => {
      cancelled = true;
    };
  }, [address]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-xl font-bold">
              Job Chain
            </Link>
            <div className="text-sm text-gray-600 mt-1">{headerText}</div>
          </div>

          <div className="flex items-center gap-2">
            {!address ? (
              <Button onClick={() => void connect()} disabled={isConnecting}>
                {isConnecting ? "Connecting…" : "Connect Wallet"}
              </Button>
            ) : null}

            {address && role === Role.None ? (
              <Button asChild variant="outline">
                <Link href="/auth/register">Register role</Link>
              </Button>
            ) : null}

            {canPostJobs ? (
              <Button asChild>
                <Link href="/employer/post-job">Post a Job</Link>
              </Button>
            ) : null}

            <Button asChild variant="outline">
              <Link href="/profile">Profile</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {error ? <p className="text-sm text-red-600 mb-4">{error}</p> : null}
        {loadError ? <p className="text-sm text-red-600 mb-4">{loadError}</p> : null}

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Jobs</h1>
          {isLoadingRole ? <Badge variant="secondary">Checking role…</Badge> : null}
        </div>

        {!address ? (
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <p className="text-gray-700">
                Please connect your wallet to load on-chain job postings.
              </p>
              <div className="mt-4">
                <Button onClick={() => void connect()} disabled={isConnecting}>
                  {isConnecting ? "Connecting…" : "Connect MetaMask"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <p className="text-gray-600">Loading jobs…</p>
        ) : jobs.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <p className="text-gray-700">No jobs posted yet.</p>
              {canPostJobs ? (
                <div className="mt-4">
                  <Button asChild>
                    <Link href="/employer/post-job">Create the first job</Link>
                  </Button>
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-500">
                  If you’re an employer, register as Employer to post jobs.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <Card key={job.id} className="rounded-2xl shadow-sm">
                <CardHeader className="px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold">{job.title}</h2>
                      <p className="text-sm text-gray-600">{job.company}</p>
                    </div>
                    <Badge variant={job.isOpen ? "default" : "secondary"}>
                      {job.isOpen ? "Open" : "Closed"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{job.location || "—"}</Badge>
                    <Badge variant="secondary">{job.jobType || "—"}</Badge>
                  </div>

                  <div className="text-xs text-gray-500 font-mono break-words">
                    Employer: {job.employer}
                  </div>

                  <Button asChild className="w-full">
                    <Link href={`/jobs/${job.id}`}>View & Apply</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
