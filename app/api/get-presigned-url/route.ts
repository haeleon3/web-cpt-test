import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contentType = 'application/json' } = body;

    const key = `cpt-results/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.json`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 600 });

    return NextResponse.json({ url, key }, { status: 200 });
  } catch (error) {
    console.error('Presigned URL error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
