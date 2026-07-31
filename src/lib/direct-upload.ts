import {UPLOAD_CONCURRENCY} from "@/server/storage/errors";

export {UPLOAD_CONCURRENCY};

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const limit = Math.max(1, concurrency);
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function run() {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await worker(items[current]!, current);
    }
  }

  const runners = Array.from({length: Math.min(limit, items.length)}, () => run());
  await Promise.all(runners);
  return results;
}

/**
 * PUT file bytes directly to a presigned R2 URL with optional progress via XHR.
 * Does not proxy through the application server.
 */
export function putFileToPresignedUrl(params: {
  url: string;
  file: File;
  contentType: string;
  signal?: AbortSignal;
  onProgress?: (loaded: number, total: number) => void;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", params.url);
    xhr.setRequestHeader("Content-Type", params.contentType);

    const onAbort = () => {
      xhr.abort();
      reject(new DOMException("Upload cancelled", "AbortError"));
    };
    params.signal?.addEventListener("abort", onAbort);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && params.onProgress) {
        params.onProgress(event.loaded, event.total);
      }
    };

    xhr.onload = () => {
      params.signal?.removeEventListener("abort", onAbort);
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error(`UPLOAD_FAILED:${xhr.status}`));
    };

    xhr.onerror = () => {
      params.signal?.removeEventListener("abort", onAbort);
      reject(new Error("UPLOAD_FAILED"));
    };

    xhr.onabort = () => {
      params.signal?.removeEventListener("abort", onAbort);
      reject(new DOMException("Upload cancelled", "AbortError"));
    };

    xhr.send(params.file);
  });
}
