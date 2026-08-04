/**
 * Guest bulk ZIP builder — successful outputs + CSV manifest.
 * Path-safe entry names; formula-injection neutral manifest.
 */

import JSZip from "jszip";
import {
  neutralizeCsvCell,
  sanitizeZipEntryName,
  uniqueZipNames,
} from "@/server/guest/bulk-policy";

export type BulkZipOutput = {
  originalFilename: string;
  outputFilename: string;
  bytes: Buffer;
  meta: {
    status: string;
    operation: string;
    originalBytes: number | null;
    outputBytes: number | null;
    width: number | null;
    height: number | null;
    format: string | null;
    errorCode: string | null;
  };
};

export async function buildGuestBulkArchive(params: {
  operation: string;
  outputs: BulkZipOutput[];
  maxBytes: number;
}): Promise<Buffer> {
  const zip = new JSZip();
  const unique = uniqueZipNames(params.outputs.map((o) => o.outputFilename));
  const headers = [
    "original_filename",
    "output_filename",
    "status",
    "operation",
    "original_bytes",
    "output_bytes",
    "width",
    "height",
    "format",
    "safe_error_code",
  ];
  const rows = [headers.join(",")];

  for (let i = 0; i < params.outputs.length; i++) {
    const out = params.outputs[i]!;
    const name = sanitizeZipEntryName(unique[i]!, `output-${i + 1}.bin`);
    if (name.includes("..") || name.startsWith("/") || name.includes("\\")) {
      throw new Error("ZIP_PATH_UNSAFE");
    }
    zip.file(name, out.bytes);
    rows.push(
      [
        out.originalFilename,
        name,
        out.meta.status,
        params.operation,
        String(out.meta.originalBytes ?? ""),
        String(out.meta.outputBytes ?? out.bytes.length),
        String(out.meta.width ?? ""),
        String(out.meta.height ?? ""),
        String(out.meta.format ?? ""),
        String(out.meta.errorCode ?? ""),
      ]
        .map(neutralizeCsvCell)
        .join(","),
    );
  }

  zip.file("manifest.csv", `${rows.join("\n")}\n`);
  const buffer = Buffer.from(await zip.generateAsync({type: "uint8array", compression: "DEFLATE"}));
  if (buffer.length > params.maxBytes) throw new Error("ZIP_TOO_LARGE");
  return buffer;
}
