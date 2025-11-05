import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getS3Client, getS3RequestPresigner } from "@/lib/dynamicImports";

// Create S3 client dynamically
async function getS3ClientInstance() {
  const { S3Client } = await getS3Client();
  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    // Fix SSL/TLS issues
    forcePathStyle: true,
    maxAttempts: 3,
  });
}

export async function POST(req: NextRequest) {
  try {
    // Check required environment variables
    if (!process.env.R2_ENDPOINT) {
      return NextResponse.json({ error: "R2_ENDPOINT environment variable is missing" }, { status: 500 });
    }
    if (!process.env.R2_ACCESS_KEY_ID) {
      return NextResponse.json({ error: "R2_ACCESS_KEY_ID environment variable is missing" }, { status: 500 });
    }
    if (!process.env.R2_SECRET_ACCESS_KEY) {
      return NextResponse.json({ error: "R2_SECRET_ACCESS_KEY environment variable is missing" }, { status: 500 });
    }
    if (!process.env.R2_BUCKET) {
      return NextResponse.json({ error: "R2_BUCKET environment variable is missing" }, { status: 500 });
    }

    // Get S3 client and presigner dynamically
    const client = await getS3ClientInstance();
    const { getSignedUrl } = await getS3RequestPresigner();

    const { filename, contentType, folder = "listings", listingId } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: "filename and contentType required" }, { status: 400 });
    }

    // safe key structure: listings/<listingId or misc>/<uuid>-filename
    const base = listingId ? `listings/${listingId}` : folder;
    const key = `${base}/${Date.now()}-${crypto.randomUUID()}-${filename}`;

    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });
    const publicBase = process.env.R2_PUBLIC_BASE;
    
    return NextResponse.json({
      uploadUrl,
      key,
      publicUrl: publicBase ? `${publicBase}/${key}` : null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
