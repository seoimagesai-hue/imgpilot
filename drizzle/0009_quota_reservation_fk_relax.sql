-- Drop reservation FKs to images/replacements so capacity can be reserved
-- before the related row exists (authorize-before-insert pattern).
-- Project FK remains. Additive / non-destructive.

ALTER TABLE "quota_reservations" DROP CONSTRAINT IF EXISTS "quota_reservations_image_id_images_id_fk";--> statement-breakpoint
ALTER TABLE "quota_reservations" DROP CONSTRAINT IF EXISTS "quota_reservations_replacement_id_image_replacements_id_fk";
