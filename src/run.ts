import { infrai, putObject } from "./infrai-storage.ts";
import { propertyCsv, type PropertyData } from "./property_export.ts";

const BUCKET = "property-reports";
const today = "2026-08-10";
const data: PropertyData = {
  requests: [{ id: "mr-104", unit: "3B", status: "scheduled", summary: "Replace kitchen tap" }],
  documents: [{ tenant: "A. Chen", kind: "lease", expiresOn: "2027-02-01" }],
  inspections: [{ unit: "3B", dueOn: "2026-08-09", completed: false }, { unit: "2A", dueOn: "2026-08-20", completed: false }]
};

async function ensureBucket(): Promise<void> {
  const existing = await infrai.storage.bucket.get(BUCKET);
  if (!existing) await infrai.storage.bucket.create({ name: BUCKET, idempotency_key: "property-reports-bucket-v1" });
}

async function main(): Promise<void> {
  await ensureBucket();
  const csv = propertyCsv(data, today);
  const key = `exports/property-${today}.csv`;
  const upload = await infrai.storage.object.presign(BUCKET, key, { op: "put", expires_seconds: 600, content_type: "text/csv", idempotency_key: "property-export-2026-08-10" });
  await putObject(upload.url, csv);
  const download = await infrai.storage.object.presign(BUCKET, key, { op: "get", expires_seconds: 900, response_disposition: "attachment; filename=property-report.csv" });
  console.log(JSON.stringify({ key, downloadUrl: download.url, dueInspectionUnits: ["3B"] }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
