"use client";

import {useRef} from "react";
import {useRouter} from "@/i18n/navigation";
import {setPendingGuestFile} from "@/components/guest/guest-file-handoff";

export function HomeChooseImageButton({
  label,
  className = "btn-primary w-full sm:w-auto",
}: {
  label: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  return (
    <>
      <button type="button" className={className} onClick={() => inputRef.current?.click()}>
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setPendingGuestFile(file);
          router.push("/compress-image");
          e.target.value = "";
        }}
      />
    </>
  );
}
