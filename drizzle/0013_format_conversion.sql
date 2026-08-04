-- Prompt 14: format conversion — additive enum values only.
-- Does not require R2. Does not mutate existing jobs/derivatives.

ALTER TYPE "processing_operation" ADD VALUE IF NOT EXISTS 'convert_format';--> statement-breakpoint

ALTER TYPE "image_derivative_kind" ADD VALUE IF NOT EXISTS 'converted';
