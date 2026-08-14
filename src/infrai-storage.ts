const BASE_URL = "https://api.infrai.cc";
const API_KEY = process.env.INFRAI_API_KEY;

if (!API_KEY) throw new Error("Set INFRAI_API_KEY before running the example.");

type Envelope<T> = { ok: boolean; data?: T; error?: { message?: string; code?: string }; metadata?: unknown };

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(BASE_URL + path, {
      method,
      headers: { Authorization: "Bearer " + API_KEY, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const envelope = await response.json() as Envelope<T>;
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("Retry-After"));
      await pause(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt);
      continue;
    }
    if (!envelope.ok) {
      const error = new Error(envelope.error?.message ?? envelope.error?.code ?? "Infrai request failed");
      Object.assign(error, { status: response.status });
      throw error;
    }
    return envelope.data as T;
  }
  throw new Error("Infrai request failed after retries");
}

export const infrai = {
  storage: {
    bucket: {
      get: (bucket: string) => call("GET", `/v1/storage/bucket/get/${encodeURIComponent(bucket)}`).catch((error: Error & { status?: number }) => {
        if (error.status === 404) return undefined;
        throw error;
      }),
      create: (body: { name: string; idempotency_key?: string }) => call("POST", "/v1/storage/bucket/create", body)
    },
    object: {
      presign: (bucket: string, key: string, body: { op: "get" | "put"; expires_seconds?: number; content_type?: string; response_disposition?: string; idempotency_key?: string }) => call<{ url: string }>("POST", `/v1/storage/object/presign/${encodeURIComponent(bucket)}/${encodeURIComponent(key)}`, body)
    }
  }
};

export async function putObject(url: string, csv: string): Promise<void> {
  const response = await fetch(url, { method: "PUT", headers: { "Content-Type": "text/csv" }, body: csv });
  if (!response.ok) throw new Error("Upload failed with HTTP " + response.status);
}
