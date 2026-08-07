import type {GuestJob, GuestSession, GuestUpload} from "@/db/schema";
import {
  type GuestRotateOptions,
} from "@/server/guest/rotate-policy";
import {executeSameFormatGuestTransform} from "@/server/guest/same-format-transform";

export async function executeGuestRotateJob(params: {
  session: GuestSession;
  job: GuestJob;
  upload: GuestUpload;
  options: GuestRotateOptions;
}): Promise<GuestJob> {
  const {options} = params;
  return executeSameFormatGuestTransform({
    session: params.session,
    job: params.job,
    upload: params.upload,
    filenamePrefix: "rotated",
    transform: ({pipeline}) => {
      let next = pipeline.rotate(options.angle);
      if (options.flipHorizontal) next = next.flop();
      if (options.flipVertical) next = next.flip();
      return next;
    },
    buildSummary: (base) => ({
      ...base,
      angle: options.angle,
      flipHorizontal: options.flipHorizontal,
      flipVertical: options.flipVertical,
      metadataStripped: true,
    }),
  });
}
