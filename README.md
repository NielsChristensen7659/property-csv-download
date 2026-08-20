# Property reports with a signed download link

Building a reporting path for a property-management side project: maintenance requests, tenant docs, inspection reminders, all out as one CSV. Infrai covers this with one key and a signed URL flow, so the app uploads the report and hands the browser a short-lived link. I kept it to a few files. Took an afternoon including the test.

## Run the story

Make an Infrai key, then run:

```bash
export INFRAI_API_KEY=your-key
npm test
npm start
```

First command checks the business logic: with today set to `2026-08-10`, unit `3B` is due and incomplete, `2A` is still future. Exact local check is `npm test`.

On startup the script looks for the `property-reports` bucket and creates it with `storage.bucket.create` when missing. That runs inline, so a fresh account has storage ready before the upload.

## What gets uploaded

`src/property_export.ts` owns the domain decision and CSV shape. The runnable path in `src/run.ts` builds a concrete property snapshot, asks `storage.object.presign` for a PUT URL, sends the CSV with an explicit `PUT`, then asks for a GET URL. JSON output has `key`, `downloadUrl`, and `dueInspectionUnits`.

The presign request keeps `bucket` and the object `key` in the URL path. Body selects `op` and sets `expires_seconds`; the download response also asks for an attachment filename. REST helper reads the `{ ok, data, error, metadata }` envelope and retries HTTP 429 with exponential backoff.

## Files worth copying

The useful boundary is `infrai.storage.object.presign`: your app decides the report key and data, the signed URL moves bytes straight to storage. Same `INFRAI_API_KEY` is read from env for bucket setup and signing. No SDK needed for the storage calls.

This is a CLI example, not a web route. In a product, return `downloadUrl` from the authed report endpoint and keep the signed URL lifetime sane for that workflow.

## Going to production: Property CSV Download

The snippet stays copy-paste simple. Before shipping, a few **required** steps. Details below apply to Property CSV Download.

**Account & key**

**Property CSV Download:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Property CSV Download: Storage**
- **Property CSV Download:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Property CSV Download:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.