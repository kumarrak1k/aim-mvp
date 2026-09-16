/**
 * The sector layer.
 *
 * These sit ON TOP of the core bank rather than replacing it: a candidate in a
 * narrow sector still gets every untagged question, plus the ones written for
 * the interviews their sector actually runs. Sector tags must never be able to
 * empty the pool.
 *
 * Written by us from the patterns these sectors use. The Success Profiles
 * entries are phrased from Civil Service behaviours published under the Open
 * Government Licence v3, which permits commercial reuse with attribution.
 */

import type { BankQuestion } from "./types";

export const SECTOR_QUESTIONS: BankQuestion[] = [
  // ── Financial services ───────────────────────────────────────────────────
  { id: "se-fs-01", type: "commercial", sectors: ["Financial services"], source: "original", text: "What do you think interest rates are doing to the customers of a firm like this one?" },
  { id: "se-fs-02", type: "commercial", sectors: ["Financial services"], source: "original", text: "How would you explain the difference between risk and uncertainty to a client?" },
  { id: "se-fs-03", type: "competency", competency: "ethics", sectors: ["Financial services"], source: "original", text: "Tell me about a time you had to follow a rule you found inconvenient. How did you handle it?" },
  { id: "se-fs-04", type: "situational", sectors: ["Financial services"], source: "original", text: "You notice a transaction that does not look right. What do you do, and in what order?" },
  { id: "se-fs-05", type: "competency", competency: "problem-solving", sectors: ["Financial services"], source: "original", text: "Describe a time you found an error in numbers somebody else had produced." },

  // ── Technology and data ──────────────────────────────────────────────────
  { id: "se-tc-01", type: "technical", sectors: ["Technology & data"], source: "original", text: "Talk me through how you would investigate a system that has suddenly become slow." },
  { id: "se-tc-02", type: "commercial", sectors: ["Technology & data"], source: "original", text: "How would you decide whether a feature was worth building?" },
  { id: "se-tc-03", type: "competency", competency: "communication", sectors: ["Technology & data"], source: "original", text: "Tell me about a time you had to explain a technical trade-off to someone non-technical." },
  { id: "se-tc-04", type: "situational", sectors: ["Technology & data"], source: "original", text: "You are asked to ship something you know is not ready. How do you handle that conversation?" },
  { id: "se-tc-05", type: "technical", sectors: ["Technology & data"], source: "original", text: "How do you satisfy yourself that a change you have made has not broken something else?" },

  // ── Public sector and education ──────────────────────────────────────────
  { id: "se-ps-01", type: "competency", competency: "communication", sectors: ["Public sector & education"], source: "ogl-success-profiles", text: "Tell me about a time you communicated something clearly to people who were affected by a decision." },
  { id: "se-ps-02", type: "competency", competency: "ethics", sectors: ["Public sector & education"], source: "ogl-success-profiles", text: "Describe a time you made a decision that was right for the public rather than convenient for you." },
  { id: "se-ps-03", type: "situational", sectors: ["Public sector & education"], source: "original", text: "You are asked for something the rules do not allow, by someone who clearly needs help. What do you do?" },
  { id: "se-ps-04", type: "competency", competency: "organisation", sectors: ["Public sector & education"], source: "ogl-success-profiles", text: "Tell me how you delivered a piece of work on time with fewer resources than you needed." },
  { id: "se-ps-05", type: "commercial", sectors: ["Public sector & education"], source: "original", text: "How would you judge whether a public service was giving good value?" },

  // ── Healthcare and life sciences ─────────────────────────────────────────
  { id: "se-hc-01", type: "competency", competency: "customer-focus", sectors: ["Healthcare & life sciences"], source: "original", text: "Tell me about a time you supported someone who was distressed." },
  { id: "se-hc-02", type: "competency", competency: "ethics", sectors: ["Healthcare & life sciences"], source: "original", text: "Describe a time you raised a concern about safety or standards." },
  { id: "se-hc-03", type: "situational", sectors: ["Healthcare & life sciences"], source: "original", text: "You are short-staffed and two things both need doing now. How do you decide?" },
  { id: "se-hc-04", type: "competency", competency: "communication", sectors: ["Healthcare & life sciences"], source: "original", text: "Tell me about a time you had to give someone difficult news." },
  { id: "se-hc-05", type: "strengths", sectors: ["Healthcare & life sciences"], source: "original", text: "What keeps you going on a day when the work is relentless?" },

  // ── Legal and professional services ──────────────────────────────────────
  { id: "se-lg-01", type: "commercial", sectors: ["Legal & professional services"], source: "original", text: "What do you think clients in this field are most worried about at the moment?" },
  { id: "se-lg-02", type: "competency", competency: "organisation", sectors: ["Legal & professional services"], source: "original", text: "Tell me about a time you had to be exact under time pressure." },
  { id: "se-lg-03", type: "situational", sectors: ["Legal & professional services"], source: "original", text: "A client asks for advice that is outside what you know. What do you say to them?" },
  { id: "se-lg-04", type: "competency", competency: "communication", sectors: ["Legal & professional services"], source: "original", text: "Describe a time you had to summarise something long and complicated for somebody who had five minutes." },
  { id: "se-lg-05", type: "commercial", sectors: ["Legal & professional services"], source: "original", text: "How does a firm like this one win work, and how does it keep it?" },

  // ── Engineering and manufacturing ────────────────────────────────────────
  { id: "se-en-01", type: "technical", sectors: ["Engineering & manufacturing"], source: "original", text: "Talk me through how you would work out why something is failing intermittently." },
  { id: "se-en-02", type: "competency", competency: "ethics", sectors: ["Engineering & manufacturing"], source: "original", text: "Tell me about a time you stopped work because something was not safe or not right." },
  { id: "se-en-03", type: "situational", sectors: ["Engineering & manufacturing"], source: "original", text: "Production is down and everyone is waiting on you. What are your first three steps?" },
  { id: "se-en-04", type: "competency", competency: "problem-solving", sectors: ["Engineering & manufacturing"], source: "original", text: "Describe a time you improved a process that people had accepted as normal." },

  // ── Retail, media and hospitality ────────────────────────────────────────
  { id: "se-rt-01", type: "competency", competency: "customer-focus", sectors: ["Retail, media & hospitality"], source: "original", text: "Tell me about the most difficult customer you have dealt with." },
  { id: "se-rt-02", type: "situational", sectors: ["Retail, media & hospitality"], source: "original", text: "It is your busiest hour and two staff have not turned up. What do you do?" },
  { id: "se-rt-03", type: "commercial", sectors: ["Retail, media & hospitality"], source: "original", text: "What makes somebody come back to a place a second time?" },
  { id: "se-rt-04", type: "competency", competency: "resilience", sectors: ["Retail, media & hospitality"], source: "original", text: "Describe a shift that went badly wrong and what you did about it." },

  // ── Charity and social impact ────────────────────────────────────────────
  { id: "se-ch-01", type: "motivation", sectors: ["Charity & social impact"], source: "original", text: "Why this cause rather than a better-paid job elsewhere?" },
  { id: "se-ch-02", type: "commercial", sectors: ["Charity & social impact"], source: "original", text: "How would you show a funder that their money had made a difference?" },
  { id: "se-ch-03", type: "situational", sectors: ["Charity & social impact"], source: "original", text: "You have far less budget than the work needs. How do you decide what to drop?" },
  { id: "se-ch-04", type: "competency", competency: "teamwork", sectors: ["Charity & social impact"], source: "original", text: "Tell me about a time you worked with volunteers or people outside your organisation." },
];
