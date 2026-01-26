import crypto from "node:crypto";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

function makeMockCidFromBytes(bytes: Buffer): string {
  const hash = crypto.createHash("sha256").update(bytes).digest("hex");
  // Not a real CID, but looks like one for demo purposes.
  return `bafy${hash.slice(0, 56)}`;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing file (expected form-data field 'file')" },
        { status: 400 }
      );
    }

    const pinataJwt = process.env.PINATA_JWT;

    if (!pinataJwt) {
      const bytes = Buffer.from(await file.arrayBuffer());
      const cid = makeMockCidFromBytes(bytes);
      return NextResponse.json({ cid, isMock: true });
    }

    const pinataForm = new FormData();
    pinataForm.append("file", file, file.name);

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pinataJwt}`,
      },
      body: pinataForm,
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { error: `Pinata upload failed: ${text}` },
        { status: 500 }
      );
    }

    const json = JSON.parse(text) as { IpfsHash?: string };
    if (!json.IpfsHash) {
      return NextResponse.json(
        { error: "Pinata upload succeeded but IpfsHash missing" },
        { status: 500 }
      );
    }

    return NextResponse.json({ cid: json.IpfsHash, isMock: false });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
