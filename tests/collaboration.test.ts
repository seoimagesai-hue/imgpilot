import {describe, expect, it} from "vitest";
import {sanitizeActivityMetadataForTest} from "@/server/collaboration/activity";
import {
  ACTIVITY_FEED_LIMIT_DEFAULT,
  ACTIVITY_FEED_LIMIT_MAX,
  COMMENT_BODY_MAX,
  clampActivityPageLimit,
  extractMentionTokens,
  isCommentSubjectType,
  sanitizeCommentBody,
} from "@/server/collaboration/policy";
import {httpStatusForCollaborationError} from "@/server/collaboration/errors";

describe("collaboration policy", () => {
  it("sanitizes comment bodies as plain text", () => {
    expect(sanitizeCommentBody("  hello  ")).toBe("hello");
    expect(sanitizeCommentBody("<b>hi</b>")).toBe("hi");
    expect(sanitizeCommentBody("line\u0000break")).toBe("linebreak");
    expect(sanitizeCommentBody("   ")).toBe("");
  });

  it("extracts unique @email mention tokens", () => {
    const tokens = extractMentionTokens(
      "Hey @Alice@Example.com and @bob@test.org again @bob@test.org",
    );
    expect(tokens).toEqual(["alice@example.com", "bob@test.org"]);
  });

  it("validates comment subject types", () => {
    expect(isCommentSubjectType("metadata_generation")).toBe(true);
    expect(isCommentSubjectType("chat")).toBe(false);
  });

  it("clamps activity feed limits", () => {
    expect(clampActivityPageLimit(undefined)).toBe(ACTIVITY_FEED_LIMIT_DEFAULT);
    expect(clampActivityPageLimit(200)).toBe(ACTIVITY_FEED_LIMIT_MAX);
    expect(clampActivityPageLimit(0)).toBe(1);
    expect(ACTIVITY_FEED_LIMIT_DEFAULT).toBe(50);
    expect(ACTIVITY_FEED_LIMIT_MAX).toBe(100);
  });

  it("documents comment body max", () => {
    expect(COMMENT_BODY_MAX).toBe(4000);
  });
});

describe("collaboration activity metadata", () => {
  it("strips forbidden keys from activity metadata", () => {
    const json = sanitizeActivityMetadataForTest({
      status: "completed",
      storageKey: "users/x/key",
      url: "https://example.com",
    });
    expect(json).toEqual({status: "completed"});
  });
});

describe("collaboration errors", () => {
  it("maps error codes to HTTP statuses", () => {
    expect(httpStatusForCollaborationError("PROJECT_NOT_FOUND")).toBe(404);
    expect(httpStatusForCollaborationError("COLLABORATION_PERMISSION_DENIED")).toBe(403);
    expect(httpStatusForCollaborationError("COMMENT_BODY_INVALID")).toBe(400);
  });
});
