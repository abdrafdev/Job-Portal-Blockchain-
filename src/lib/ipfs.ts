export async function uploadToIpfs(file: File): Promise<{ cid: string; isMock: boolean }> {
  const form = new FormData();
  form.append("file", file, file.name);

  const res = await fetch("/api/ipfs/upload", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Upload failed (${res.status})`);
  }

  const json = (await res.json()) as { cid: string; isMock: boolean };
  if (!json?.cid) throw new Error("Upload succeeded but CID missing");
  return json;
}
