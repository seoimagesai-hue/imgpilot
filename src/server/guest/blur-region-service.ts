import sharp from "sharp";
import type {GuestJob, GuestSession, GuestUpload} from "@/db/schema";
import {
  blurSigmaForStrength,
  type GuestBlurRegionOptions,
} from "@/server/guest/blur-region-policy";
import {executeSameFormatGuestTransform} from "@/server/guest/same-format-transform";
import {GuestDomainError} from "@/server/guest/errors";

export async function executeGuestBlurRegionJob(params: {
  session: GuestSession;
  job: GuestJob;
  upload: GuestUpload;
  options: GuestBlurRegionOptions;
}): Promise<GuestJob> {
  const {options} = params;
  return executeSameFormatGuestTransform({
    session: params.session,
    job: params.job,
    upload: params.upload,
    filenamePrefix: "blurred",
    transform: async ({pipeline, width, height}) => {
      const left = Math.max(0, Math.floor(options.region.x * width));
      const top = Math.max(0, Math.floor(options.region.y * height));
      const rw = Math.max(2, Math.floor(options.region.width * width));
      const rh = Math.max(2, Math.floor(options.region.height * height));
      const boxW = Math.min(rw, width - left);
      const boxH = Math.min(rh, height - top);
      if (boxW < 2 || boxH < 2) throw new GuestDomainError("INVALID_REQUEST");

      const base = await pipeline.png().toBuffer();
      const patch = await sharp(base)
        .extract({left, top, width: boxW, height: boxH})
        .blur(blurSigmaForStrength(options.strength))
        .toBuffer();

      return sharp(base).composite([{input: patch, left, top}]);
    },
    buildSummary: (base) => ({
      ...base,
      region: options.region,
      strength: options.strength,
      metadataStripped: true,
    }),
  });
}
