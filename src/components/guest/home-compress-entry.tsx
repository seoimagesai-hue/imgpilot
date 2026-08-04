"use client";

import {useRouter} from "@/i18n/navigation";
import {setPendingGuestFile} from "@/components/guest/guest-file-handoff";
import {UploadDropzone} from "@/components/guest/upload-dropzone";

type Props = {
  heading: string;
  support: string;
  chooseLabel: string;
  pasteHint: string;
  formatLimitLine: string;
  privacyLine: string;
  defaultActionLabel: string;
  maxMb: number;
};

export function HomeCompressEntry({
  heading,
  support,
  chooseLabel,
  pasteHint,
  formatLimitLine,
  privacyLine,
  defaultActionLabel,
  maxMb,
}: Props) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <UploadDropzone
        large
        maxMb={maxMb}
        dropLabel={heading}
        supportLabel={support}
        browseLabel={chooseLabel}
        pasteLabel={pasteHint}
        showHints={false}
        onFileSelected={(file) => {
          setPendingGuestFile(file);
          router.push("/compress-image");
        }}
      />
      <p className="text-center text-sm font-medium text-[var(--accent)]">{defaultActionLabel}</p>
      <p className="text-center text-sm text-[var(--body)]" dir="ltr">
        {formatLimitLine}
      </p>
      <p className="text-center text-sm text-[var(--muted-foreground)]">{privacyLine}</p>
    </div>
  );
}
