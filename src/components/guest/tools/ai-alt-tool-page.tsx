"use client";

import {useLocale} from "next-intl";
import {GuestToolWorkspace} from "@/components/guest/guest-tool-workspace";
import {createAiAltToolConfig} from "@/components/guest/tools/ai-alt-tool";

/** Client boundary so createAiAltToolConfig(locale) is never invoked from a Server Component. */
export function AiAltToolPage() {
  const locale = useLocale();
  return <GuestToolWorkspace config={createAiAltToolConfig(locale)} />;
}
