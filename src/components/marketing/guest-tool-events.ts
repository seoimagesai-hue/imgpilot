export const GUEST_TOOL_RESET_EVENT = "seoimages:guest-tool-reset";
export const GUEST_TOOL_RESULT_EVENT = "seoimages:guest-tool-result";
export const GUEST_TOOL_CLEAR_RESULT_EVENT = "seoimages:guest-tool-clear-result";

export type GuestToolResultDetail = {
  tool: string;
  savedPercent: number | null;
  before: {
    url: string | null;
    width?: number | null;
    height?: number | null;
    bytes?: number | null;
    format?: string | null;
  };
  after: {
    url: string | null;
    width?: number | null;
    height?: number | null;
    bytes?: number | null;
    format?: string | null;
  };
};

export function dispatchGuestToolReset(tool?: string) {
  window.dispatchEvent(new CustomEvent(GUEST_TOOL_RESET_EVENT, {detail: {tool}}));
}

export function dispatchGuestToolResult(detail: GuestToolResultDetail) {
  window.dispatchEvent(new CustomEvent(GUEST_TOOL_RESULT_EVENT, {detail}));
}

export function dispatchGuestToolClearResult(tool?: string) {
  window.dispatchEvent(new CustomEvent(GUEST_TOOL_CLEAR_RESULT_EVENT, {detail: {tool}}));
}
