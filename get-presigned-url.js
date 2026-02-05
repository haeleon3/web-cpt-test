import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const { contentType = "application/json" } = req.body ?? {};

    const bucket = process.env.CPT_S3_BUCKET;
    const region = process.env.AWS_REGION || "ap-northeast-2";

    if (!bucket) {
      res.status(500).json({ error: "Missing CPT_S3_BUCKET env" });
      return;
    }

    const key = `cpt-results/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.json`;

    const s3 = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3, cmd, { expiresIn: 600 });

    res.status(200).json({ url, key });
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
}
