-- Additive: Ready for Processing is a distinct lifecycle state after validated.
ALTER TYPE "image_status" ADD VALUE IF NOT EXISTS 'ready_for_processing';
