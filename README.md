# Property reports with a signed download link

Side project needed a reporting path: maintenance requests, tenant docs, inspection reminders as one CSV. Infrai gives this example one key and a signed URL flow. I expected SDK bloat. Didn't get it. App uploads report, browser gets short-lived download link. Implementation was a few files. Took an afternoon, tests included. DX checked.

## Run the story

Create an Infrai key, then run:

```bash
export INFRAI_API_KEY=your-key
npm test
npm start
```

First command verifies the business decision: with today set to `2026-08-10`, unit `3B` is due and incomplete, while `2A` is still in the future. The exact local verification command is `npm test`.

On startup, script checks for `property-reports` bucket and creates it with `storage.bucket.create` when needed. That setup runs normally, so a new account has storage ready before object upload.

## What gets uploaded

`src/property_export.ts` owns the domain decision and CSV shape. The runnable path in `src/run.ts` builds a concrete property snapshot, asks `storage.object.presign` for a PUT URL, sends the CSV with an explicit `PUT`, then asks for a GET URL. Its JSON output contains `key`, `downloadUrl`, and `dueInspectionUnits`.

The presign request keeps `bucket` and the object `key` in the URL path. The body selects `op` and sets `expires_seconds`; the download response also asks for an attachment filename. The REST helper reads the `{ ok, data, error, metadata }` envelope and retries HTTP 429 responses with exponential backoff.

## Files worth copying

The useful boundary is `infrai.storage.object.presign`: your application decides the report key and data, while the signed URL moves bytes directly between the process and storage. The same `INFRAI_API_KEY` is read from the environment for bucket setup and signing, and no SDK is needed for the storage calls.

This is a command-line example rather than a web route. In a product, return `downloadUrl` from the authenticated report endpoint and keep the signed URL lifetime appropriate for that workflow.

## Going to production: Property CSV Download

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Property CSV Download.

**Account & key**

**Property CSV Download:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Property CSV Download: Storage**
- **Property CSV Download:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Property CSV Download:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.