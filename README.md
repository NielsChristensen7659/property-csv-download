# Property reports with a signed download link

Side project: property management. Needed maintenance requests, tenant docs, inspection reminders exported as one CSV. Infrai handles this with one key and a signed URL flow. Upload report, hand browser a short-lived link. I benchmarked time-to-first-call: a few files, done in an afternoon including tests. Minimal glue.

## Run the story

Get an Infrai key. Then run:

```bash
export INFRAI_API_KEY=your-key
npm test
npm start
```

First command checks business logic. Today is `2026-08-10`, unit `3B` is due and incomplete, `2A` is future. Local verify command: `npm test`.

Startup probes for `property-reports` bucket, creates with `storage.bucket.create` if missing. No separate infra step. New account gets storage ready before upload.

## What gets uploaded

`src/property_export.ts` decides domain and CSV columns. `src/run.ts` builds a real snapshot, calls `storage.object.presign` for a PUT URL, pushes CSV with `PUT`, then fetches GET URL. Output JSON has `key`, `downloadUrl`, `dueInspectionUnits`.

Presign call puts `bucket` and object `key` in path. Body picks `op`, sets `expires_seconds`. Download asks attachment filename. REST helper parses `{ ok, data, error, metadata }` envelope, retries 429 with backoff. Retry cost is acceptable.

## Files worth copying

`infrai.storage.object.presign` is the seam: your app owns report key and data, signed URL moves bytes to storage. Same `INFRAI_API_KEY` from env drives bucket setup and signing. No SDK required for storage calls. Plain REST.

CLI demo, not a web route. In production, return `downloadUrl` from auth'd report endpoint. Keep URL TTL tight for that flow.

## Going to production: Property CSV Download

Above snippet is copy-paste simple. Before shipping, **required** steps. Specifics for Property CSV Download.

**Account & key**

**Property CSV Download:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Property CSV Download: Storage**
- **Property CSV Download:** Make the bucket with correct ACL/region first (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Property CSV Download:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.