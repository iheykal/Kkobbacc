import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { S3Client, ListObjectsV2Command } = await import('@aws-sdk/client-s3');

    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const rawBucket = process.env.R2_BUCKET || '';
    const bucket = rawBucket.trim();

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      return NextResponse.json({
        ok: false,
        error: 'Missing R2 environment variables',
        details: {
          R2_ENDPOINT: !!endpoint,
          R2_ACCESS_KEY_ID: !!accessKeyId,
          R2_SECRET_ACCESS_KEY: !!secretAccessKey,
          R2_BUCKET_present: !!rawBucket,
          R2_BUCKET_afterTrim: bucket
        }
      }, { status: 500 });
    }

    const s3 = new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true
    });

    const url = new URL(req.url);
    const prefix = url.searchParams.get('prefix') || '';

    const out = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }));
    const keys = (out.Contents || []).map(obj => obj.Key).filter(Boolean) as string[];

    return NextResponse.json({ ok: true, bucket, prefix, count: keys.length, keys });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'List failed' }, { status: 500 });
  }
}



