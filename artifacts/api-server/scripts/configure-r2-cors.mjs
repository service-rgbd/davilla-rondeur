/**
 * Configure CORS on the R2 bucket for browser uploads from the admin portail.
 * Usage: R2_* env vars set, then: node scripts/configure-r2-cors.mjs
 */
import { PutBucketCorsCommand, S3Client } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;

const defaultOrigins = [
  "https://portail.davilla-rondeur.fr",
  "https://davilla-rondeur.fr",
  "https://www.davilla-rondeur.fr",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:19957",
  "http://127.0.0.1:19957",
];

const extraOrigins = process.env.R2_CORS_ORIGINS
  ? process.env.R2_CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : [];

const allowedOrigins = [...new Set([...defaultOrigins, ...extraOrigins])];

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
  console.error("Missing R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, or R2_BUCKET_NAME");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

const command = new PutBucketCorsCommand({
  Bucket: bucketName,
  CORSConfiguration: {
    CORSRules: [
      {
        AllowedHeaders: ["*"],
        AllowedMethods: ["GET", "PUT", "HEAD"],
        AllowedOrigins: allowedOrigins,
        ExposeHeaders: ["ETag"],
        MaxAgeSeconds: 3600,
      },
    ],
  },
});

await client.send(command);
console.log(`CORS applied to bucket "${bucketName}" for origins:`);
for (const origin of allowedOrigins) {
  console.log(`  - ${origin}`);
}
