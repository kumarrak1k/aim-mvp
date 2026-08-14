// Which advert to build. SOCIAL_COPY=v2 selects the second script; anything
// else (or unset) builds the original. Kept in its own module so the renderer,
// the voiceover generator and the builder cannot disagree about which advert
// they are working on.
const V = process.env.SOCIAL_COPY === 'v2' ? './social-copy-v2.mjs' : './social-copy.mjs';
export const COPY = await import(V);
export const VARIANT = process.env.SOCIAL_COPY === 'v2' ? 'v2' : 'v1';
