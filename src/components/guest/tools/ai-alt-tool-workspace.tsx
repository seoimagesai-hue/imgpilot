"use client";

import {GuestToolWorkspace} from "@/components/guest/guest-tool-workspace";
import {createAiAltToolConfig} from "@/components/guest/tools/ai-alt-tool";

export function AiAltToolWorkspace({locale}: {locale: string}) {
  const base = createAiAltToolConfig(locale);
  return (
    <GuestToolWorkspace
      config={{
        ...base,
        hideToolHeader: true,
        presentation: {
          ...base.presentation,
          landingChrome: "marketing",
          dropLabel: "Drop an image here or click to upload",
          supportLabel: "",
          browseLabel: "Choose an Image",
          formatsHint: "You can also paste an image with Ctrl + V",
        },
      }}
    />
  );
}
