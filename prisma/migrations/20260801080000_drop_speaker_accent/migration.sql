-- The accent preference is gone: this is a UK site, so there was one answer and
-- asking the question only created a way to get it wrong. The "neutral" voice
-- went with it.
--
-- Existing rows are left as they are. cleanSpeaker() ignores an unknown accent
-- key and falls a stored voice:"neutral" back to the default, so old values stay
-- readable — rewriting historic preference JSON would be churn for no gain.
ALTER TABLE "UserProfile"
  ALTER COLUMN "speakerPreference"
  SET DEFAULT '{"voice":"female","pace":"natural"}';
