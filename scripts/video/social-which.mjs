// Which advert to build. SOCIAL_COPY=<name> loads social-copy-<name>.mjs;
// unset builds the original social-copy.mjs. Kept in its own module so the
// renderer, the voiceover generator and the builder cannot disagree about
// which advert they are working on.
const NAME = process.env.SOCIAL_COPY;
export const COPY = await import(NAME ? `./social-copy-${NAME}.mjs` : "./social-copy.mjs");
export const VARIANT = NAME || "v1";
