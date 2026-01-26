import JobDetailClient from "./job-detail-client";

export default function JobDetailPage({
  params,
}: {
  params: { jobId: string };
}) {
  const jobId = Number(params.jobId);
  return <JobDetailClient jobId={jobId} />;
}
