# Mockly — competitive audit and UI upgrade brief

Reviewed 2 Aug 2026, from the public site only. Their codebase is private and
not something to copy from; everything below is drawn from what any visitor
sees — information architecture, flows, positioning, copy and visual language.

Two things are out of scope and worth stating plainly. I have not seen their
signed-in dashboard, so where the feedback you received says "their dashboards
are superior" I am inferring from the hero mockup they publish, not from using
it. And I have no visibility of their conversion rates, so "this works better"
below means "this is better practice", not "this is proven to convert".

---

## 1. The finding that matters most

**They serve one audience and say so in the page title.**

> "Mockly — AI Mock Interview Practice for UK Graduates & Apprentices"

Every element on the site follows from that. Testimonials are from degree
apprentices and Level 4/6 candidates. Social proof is graduate employers.
Pricing is a single £8.99/month plan. There is **no mention of business,
employer, team or enterprise anywhere on the site or pricing page.**

Ours asks the visitor to classify themselves before they are allowed to see
anything. The top-level split is `/for-candidates` and `/for-business`, each
with their own about, pricing, blog, questions, sign-in and sign-up. A graduate
landing on the homepage has to work out which of two products they are, before
they know what either does.

That is the feedback you received, and the site structure confirms it. It is
not a styling problem, and no visual refresh fixes it.

---

## 2. What they do better, concretely

### Hero shows the product working, not a description of it

The hero carries a mockup of the live interview screen: `RECORDING Q1/4`, the
actual question text, `2:00 REMAINING` with a progress bar, and a question list
where upcoming items read **"Hidden until active"**. A floating badge reads
**"+23pts since last session"**.

In one glance a visitor understands the format, the pacing, the pressure, and
that progress is tracked. "Hidden until active" is a particularly good detail —
it communicates realism and creates mild anticipation at no cost.

### Social proof is outcomes, not features

> "MOCKLY TRAINEES RECEIVED OFFERS FROM" — Grant Thornton, BDO, Lloyds,
> Financial Conduct Authority, BKL, Forvis Mazars

Employer logos framed as *where our users got offers*. This is the strongest
form of proof available to a product like this and we have nothing equivalent.

### The visual language is calm

Light background, fine grid texture, one dark-teal accent, generous whitespace,
a floating pill nav with four items. It reads as a professional tool.

Ours is dark purple with fuchsia and cyan gradients throughout. That reads as
consumer AI, and for an audience about to sit a Big Four interview, calm and
credible beats energetic.

### Limits are stated in units a person understands

> Free: "10 expert-generated interview questions per month", "2-question limit
> per practice session"
> Ultra: 180/month, "5-question limit per practice session"

Questions per month. Not "sessions", not tiers with feature matrices. A visitor
can immediately judge whether the free tier is enough to try it properly.

### Pricing is one decision

Free, or £8.99/month (£79.99/year). Plus small top-ups at £0.99–£2.99. One
paid tier means the decision is "yes or no", not "which".

---

## 3. What we have that they do not

Worth being clear, because the upgrade must not throw these away:

- **Assessment centre** — three-stage case study, interview and presentation.
  Nothing comparable on their site.
- **Career documents** — CV enhancer, personal statement, cover letter.
- **Four languages.** They are UK-English only.
- **Corporate/recruiter platform** — templates, invites, candidate results.
- **Voice and camera analysis** with delivery metrics.

The feedback you received — better workflow, weaker functionality — is
consistent with this. We are losing on presentation and clarity, not capability.

---

## 4. Recommendation: hide corporate, do not remove it

The corporate product is real revenue potential and months of work. The problem
is that it is *on the shopfront*, not that it exists.

**Proposed structure**

- The marketing site becomes a single-audience candidate product. Homepage,
  pricing, about, blog, questions — one of each, no audience gate.
- `/for-business` becomes a single page reachable from the footer, not the
  primary nav. Enough for a recruiter who has been told about it, invisible to
  a graduate who has not.
- Everything under `/company` (the recruiter app) is untouched. Existing
  customers and invite links keep working.
- Candidate invite flows (`/assessment/[token]`) are untouched — those arrive
  by email and never depend on site navigation.

**Redirects to preserve SEO.** `/for-candidates/*` has ranking history. Those
paths should 308 to their new unprefixed homes rather than disappear, the same
way `/pricing` was handled.

This is reversible. If corporate becomes the better business, the pages come
back — nothing is deleted.

---

## 5. UI upgrade — priority order

Ordered by effect on a first-time visitor, not by effort.

1. **Collapse to one audience.** No refresh matters until this is done.
2. **Rewrite the hero around a product mockup**, showing question, timer,
   progress and a score-change badge. We already have all of it in the app.
3. **Get outcome social proof.** Ask users where they got offers. Even three
   real logos changes the page. This needs users, so start asking now.
4. **Restate limits in questions per month**, matching how a person thinks.
5. **Reduce to one paid tier** if the numbers allow it, or make Plus the
   obvious default and Professional a quiet upsell.
6. **Lighten the visual language.** This is the biggest visual change and the
   one most likely to be argued about, which is exactly why it comes after the
   structural work rather than instead of it.

---

## 6. What I would not copy

- **Their scoring scale.** "94, Excellent" out of 100 inflates by design. Ours
  is 0–10 with published bands and has just been made internally consistent —
  that is a genuine differentiator for a product whose value is honest feedback.
- **Naming employers in generated content.** They target named companies
  ("Goldman Sachs", "PwC"). We deliberately moved the assessment centre to
  fictional companies. Worth keeping.
- **A per-question credit model.** It makes users ration practice, which is the
  opposite of what a coaching product wants.
