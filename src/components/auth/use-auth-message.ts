"use client";

import {useTranslations} from "next-intl";

const AUTH_MESSAGE_KEYS = new Set([
  "invalidCredentials",
  "accountExists",
  "passwordMismatch",
  "passwordTooShort",
  "passwordRequirements",
  "passwordRequired",
  "confirmPasswordRequired",
  "nameRequired",
  "emailRequired",
  "emailInvalid",
  "registrationSuccess",
  "genericFailure",
]);

export function useAuthMessage() {
  const t = useTranslations("authentication");

  return (code?: string) => {
    if (!code) return null;
    if (AUTH_MESSAGE_KEYS.has(code)) {
      return t(code as "genericFailure");
    }
    return t("genericFailure");
  };
}
