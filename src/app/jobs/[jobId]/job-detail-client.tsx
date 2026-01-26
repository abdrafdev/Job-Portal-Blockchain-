"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRole } from "@/hooks/useRole";
import { useWallet } from "@/hooks/useWallet";
import { uploadToIpfs } from "@/lib/ipfs";
import {
  ApplicationStatus,
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

function statusLabel(status: ApplicationStatus) {
  switch (status) {
    case ApplicationStatus.Applied:
      return "Applied";
    case ApplicationStatus.Shortlisted:
      return "Shortlisted";
    case ApplicationStatus.Accepted:
      return "Accepted";
    case ApplicationStatus.Rejected:
      return "Rejected";
    default:
      return "Not applied";
  }
}

export default function JobDetailClient({ jobId }: { jobId: number }) {
  const { address, isConnecting, error, connect } = useWallet();
  const { role } = useRole(address);

  const [job, setJob] = useState<Job | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeCid, setResumeCid] = useState<string>("");
  const [uploadInfo, setUploadInfo] = useState<string | null>(null);

  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>(
    ApplicationStatus.None
  );

  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const isEmployerViewingOwnJob = useMemo(() => {
    return role === Role.Employer && !!job && !!address && job.employer.toLowerCase() === address.toLowerCase();
  }, [role, job, address]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setJobError(null);

      try {
        const provider = getBrowserProvider();
        const contract = getJobPortalContract(provider);
        const j = (await contract.getJob(jobId)) as any;

        const loadedJob: Job = {
          id: jobId,
          employer: j.employer,
          title: j.title,
          company: j.company,
          location: j.location,
          jobType: j.jobType,
          descriptionCID: j.descriptionCID,
          createdAt: j.createdAt,
          isOpen: j.isOpen,
        };

        if (!cancelled) setJob(loadedJob);

        if (address) {
          const app = (await contract.getApplication(jobId, address)) as any;
          const status = Number(app.status) as ApplicationStatus;
          if (!cancelled) {
            setApplicationStatus(status);
            setResumeCid(app.resumeCID ?? "");
          }
        }
      } catch (e) {
        if (!cancelled) setJobError(e instanceof Error ? e.message : String(e));
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [jobId, address]);

  async function onUpload() {
    if (!resumeFile) return;

    setUploadInfo(null);
    const { cid, isMock } = await uploadToIpfs(resumeFile);
    setResumeCid(cid);
    setUploadInfo(isMock ? "Uploaded (mock CID for demo)" : "Uploaded to IPFS");
  }

  async function onApply() {
    setApplyError(null);

    if (!address) {
      await connect();
    }

    if (!resumeCid) {
      setApplyError("Please upload a resume first (CID missing)");
      return;
    }

    setIsApplying(true);
    try {
      const provider = getBrowserProvider();
      const signer = await provider.getSigner();
      const contract = getJobPortalContract(signer);

      const tx = await contract.applyToJob(jobId, resumeCid);
      await tx.wait();

      setApplicationStatus(ApplicationStatus.Applied);
    } catch (e) {
      setApplyError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/jobs" className="font-semibold">
            ← Back to Jobs
          </Link>
          <div className="flex items-center gap-2">
            {!address ? (
              <Button onClick={() => void connect()} disabled={isConnecting}>
                {isConnecting ? "Connecting…" : "Connect Wallet"}
              </Button>
            ) : (
              <Badge variant="secondary" className="font-mono">
                {address.slice(0, 6)}…{address.slice(-4)}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {jobError ? <p className="text-sm text-red-600">{jobError}</p> : null}

        {!job ? (
          <p className="text-gray-600">Loading job…</p>
        ) : (
          <Card className="rounded-2xl">
            <CardHeader className="px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">{job.title}</h1>
                  <p className="text-gray-600">
                    {job.company} • {job.location} • {job.jobType}
                  </p>
                </div>
                <Badge variant={job.isOpen ? "default" : "secondary"}>
                  {job.isOpen ? "Open" : "Closed"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <div className="text-xs text-gray-500 font-mono break-words">
                Employer: {job.employer}
              </div>

              {job.descriptionCID ? (
                <div className="text-sm">
                  <div className="text-gray-600">Description CID</div>
                  <div className="font-mono break-words">{job.descriptionCID}</div>
                </div>
              ) : null}

              {isEmployerViewingOwnJob ? (
                <Button asChild>
                  <Link href={`/employer/jobs/${job.id}/applications`}>
                    View Applications (Employer)
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        )}

        <Card className="rounded-2xl">
          <CardHeader className="px-6 py-5">
            <h2 className="text-xl font-bold">Application</h2>
            <p className="text-gray-600 text-sm">
              Status: <span className="font-semibold">{statusLabel(applicationStatus)}</span>
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-4">
            {role === Role.None ? (
              <div className="text-sm text-gray-700">
                You must register your role before applying. <Link className="underline" href="/auth/register">Register</Link>
              </div>
            ) : role !== Role.JobSeeker ? (
              <div className="text-sm text-gray-700">
                Only Job Seekers can apply (enforced by the smart contract).
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Upload resume (PDF/image)</Label>
                  <Input
                    type="file"
                    onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                  />
                  <Button type="button" variant="outline" onClick={() => void onUpload()} disabled={!resumeFile}>
                    Upload to IPFS
                  </Button>
                  {uploadInfo ? (
                    <p className="text-sm text-green-700">{uploadInfo}</p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <Label>Resume CID</Label>
                  <Input value={resumeCid} onChange={(e) => setResumeCid(e.target.value)} placeholder="bafy..." />
                  <p className="text-xs text-gray-500">CID is stored on-chain with your application.</p>
                </div>

                {applyError ? (
                  <p className="text-sm text-red-600 break-words">{applyError}</p>
                ) : null}

                <Button onClick={() => void onApply()} disabled={isApplying || !job?.isOpen}>
                  {isApplying ? "Applying…" : job?.isOpen ? "Apply to this job" : "Job is closed"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
