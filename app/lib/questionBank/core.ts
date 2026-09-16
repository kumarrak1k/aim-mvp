/**
 * The core bank: questions that suit any sector.
 *
 * Written by us from the patterns employers actually use in first-round
 * interviews and graduate screens. Nothing here is scraped from a job board or
 * copied from a curated list, and nothing claims to be a real question from a
 * named employer.
 *
 * The Success Profiles entries are phrased from the Civil Service behaviours
 * published under the Open Government Licence v3, which permits commercial
 * reuse with attribution — recorded per question in `source`.
 */

import type { BankQuestion } from "./types";

export const CORE_QUESTIONS: BankQuestion[] = [
  // ── Openers ──────────────────────────────────────────────────────────────
  { id: "op-01", type: "opener", source: "original", text: "Tell me about yourself." },
  { id: "op-02", type: "opener", source: "original", text: "Talk me through your CV and what led you to apply for this role." },
  { id: "op-03", type: "opener", source: "original", text: "Give me a two-minute summary of who you are and what you are looking for." },
  { id: "op-04", type: "opener", source: "original", text: "What should I know about you that is not on your application?" },
  { id: "op-05", type: "opener", source: "original", text: "How would the people you have worked with describe you?" },
  { id: "op-06", type: "opener", source: "original", text: "What are you most proud of so far, and why that?" },
  { id: "op-07", type: "opener", source: "original", text: "Walk me through the decision that got you to where you are now." },
  { id: "op-08", type: "opener", source: "original", text: "Introduce yourself as though we had never seen your application." },

  // ── Motivation ───────────────────────────────────────────────────────────
  { id: "mo-01", type: "motivation", source: "original", text: "Why do you want this role?" },
  { id: "mo-02", type: "motivation", source: "original", text: "Why us rather than one of our competitors?" },
  { id: "mo-03", type: "motivation", source: "original", text: "What do you know about what we do, and what drew you to it?" },
  { id: "mo-04", type: "motivation", source: "original", text: "Why this industry?" },
  { id: "mo-05", type: "motivation", source: "original", text: "What are you hoping to be doing three years from now?" },
  { id: "mo-06", type: "motivation", source: "original", text: "What made you apply now rather than a year ago?" },
  { id: "mo-07", type: "motivation", source: "original", text: "What would make you turn down an offer from us?" },
  { id: "mo-08", type: "motivation", source: "original", text: "Which part of this job do you expect to enjoy least, and how will you handle it?" },
  { id: "mo-09", type: "motivation", source: "original", text: "What do you want from your first year here?" },
  { id: "mo-10", type: "motivation", source: "original", text: "Why should we choose you over someone with a similar background?" },
  { id: "mo-11", type: "motivation", source: "original", text: "What is the most interesting thing you have read or heard about our sector recently?" },
  { id: "mo-12", type: "motivation", source: "original", text: "Tell me about a piece of work you have done that is closest to what this job involves." },
  { id: "mo-13", type: "motivation", source: "original", text: "What attracted you to the way this team works?" },
  { id: "mo-14", type: "motivation", source: "original", text: "If you were not applying for this, what would you be doing instead?" },

  // ── Competency: teamwork ─────────────────────────────────────────────────
  { id: "cp-tw-01", type: "competency", competency: "teamwork", source: "original", text: "Tell me about a time you worked as part of a team to get something finished." },
  { id: "cp-tw-02", type: "competency", competency: "teamwork", source: "original", text: "Describe a time a team member was not pulling their weight. What did you do?" },
  { id: "cp-tw-03", type: "competency", competency: "teamwork", source: "original", text: "Give me an example of a time you had to work with someone very different from you." },
  { id: "cp-tw-04", type: "competency", competency: "teamwork", source: "original", text: "Tell me about a time you asked a colleague for help. How did that go?" },
  { id: "cp-tw-05", type: "competency", competency: "teamwork", source: "ogl-success-profiles", text: "Describe a time you built a working relationship with someone outside your own team to get something done." },

  // ── Competency: resilience ───────────────────────────────────────────────
  { id: "cp-re-01", type: "competency", competency: "resilience", source: "original", text: "Tell me about a time you were under real pressure. How did you cope?" },
  { id: "cp-re-02", type: "competency", competency: "resilience", source: "original", text: "Describe a setback you have had and what you did next." },
  { id: "cp-re-03", type: "competency", competency: "resilience", source: "original", text: "Tell me about a time you had to keep going when something was not working." },
  { id: "cp-re-04", type: "competency", competency: "resilience", source: "original", text: "Give me an example of critical feedback you found hard to hear. What did you do with it?" },
  { id: "cp-re-05", type: "competency", competency: "resilience", source: "original", text: "Describe the busiest period you have had. How did you get through it?" },

  // ── Competency: conflict ─────────────────────────────────────────────────
  { id: "cp-cf-01", type: "competency", competency: "conflict", source: "original", text: "Tell me about a disagreement you had at work or in a group project." },
  { id: "cp-cf-02", type: "competency", competency: "conflict", source: "original", text: "Describe a time you had to persuade someone who did not agree with you." },
  { id: "cp-cf-03", type: "competency", competency: "conflict", source: "original", text: "Tell me about a time you had to say no to someone senior to you." },
  { id: "cp-cf-04", type: "competency", competency: "conflict", source: "original", text: "Give me an example of a time you had to deliver an unwelcome message." },

  // ── Competency: failure ──────────────────────────────────────────────────
  { id: "cp-fa-01", type: "competency", competency: "failure", source: "original", text: "Tell me about a time something you were responsible for went wrong." },
  { id: "cp-fa-02", type: "competency", competency: "failure", source: "original", text: "Describe a mistake you made and how you put it right." },
  { id: "cp-fa-03", type: "competency", competency: "failure", source: "original", text: "Tell me about a decision you would make differently now." },
  { id: "cp-fa-04", type: "competency", competency: "failure", source: "original", text: "Give me an example of a time you missed a deadline. What happened?" },

  // ── Competency: problem solving ──────────────────────────────────────────
  { id: "cp-ps-01", type: "competency", competency: "problem-solving", source: "original", text: "Tell me about a difficult problem you worked out how to solve." },
  { id: "cp-ps-02", type: "competency", competency: "problem-solving", source: "original", text: "Describe a time you had to make a decision without all the information you wanted." },
  { id: "cp-ps-03", type: "competency", competency: "problem-solving", source: "original", text: "Give me an example of a time you spotted the real cause of a problem rather than the obvious one." },
  { id: "cp-ps-04", type: "competency", competency: "problem-solving", source: "ogl-success-profiles", text: "Tell me about a time you used evidence to reach a decision. What did the evidence tell you?" },
  { id: "cp-ps-05", type: "competency", competency: "problem-solving", source: "original", text: "Describe a time you improved the way something was done." },

  // ── Competency: communication ────────────────────────────────────────────
  { id: "cp-cm-01", type: "competency", competency: "communication", source: "original", text: "Tell me about a time you explained something complicated to someone who knew nothing about it." },
  { id: "cp-cm-02", type: "competency", competency: "communication", source: "original", text: "Describe a presentation or piece of writing you were pleased with. What made it work?" },
  { id: "cp-cm-03", type: "competency", competency: "communication", source: "original", text: "Give me an example of a time you had to adapt how you said something to reach your audience." },
  { id: "cp-cm-04", type: "competency", competency: "communication", source: "original", text: "Tell me about a time you had to listen carefully before acting." },

  // ── Competency: organisation ─────────────────────────────────────────────
  { id: "cp-or-01", type: "competency", competency: "organisation", source: "original", text: "Tell me how you handled a period when several things were due at once." },
  { id: "cp-or-02", type: "competency", competency: "organisation", source: "original", text: "Describe a time you had to change your plan part way through." },
  { id: "cp-or-03", type: "competency", competency: "organisation", source: "original", text: "Give me an example of a long piece of work you kept on track." },
  { id: "cp-or-04", type: "competency", competency: "organisation", source: "original", text: "Tell me how you decide what to do first when everything looks urgent." },

  // ── Competency: initiative ───────────────────────────────────────────────
  { id: "cp-in-01", type: "competency", competency: "initiative", source: "original", text: "Tell me about a time you did something nobody asked you to do." },
  { id: "cp-in-02", type: "competency", competency: "initiative", source: "original", text: "Describe a time you saw an opportunity and took it." },
  { id: "cp-in-03", type: "competency", competency: "initiative", source: "original", text: "Give me an example of a time you started something from nothing." },
  { id: "cp-in-04", type: "competency", competency: "initiative", source: "original", text: "Tell me about a time you pushed for a change that was not popular." },

  // ── Competency: adaptability ─────────────────────────────────────────────
  { id: "cp-ad-01", type: "competency", competency: "adaptability", source: "original", text: "Tell me about a time everything changed at short notice." },
  { id: "cp-ad-02", type: "competency", competency: "adaptability", source: "original", text: "Describe a time you had to learn something quickly to keep up." },
  { id: "cp-ad-03", type: "competency", competency: "adaptability", source: "original", text: "Give me an example of a time you worked somewhere the rules were unclear." },
  { id: "cp-ad-04", type: "competency", competency: "adaptability", source: "original", text: "Tell me about a time you had to take on work outside your usual role." },

  // ── Competency: ethics ───────────────────────────────────────────────────
  { id: "cp-et-01", type: "competency", competency: "ethics", source: "original", text: "Tell me about a time you saw something being done that you were uncomfortable with." },
  { id: "cp-et-02", type: "competency", competency: "ethics", source: "original", text: "Describe a time you had to own up to something." },
  { id: "cp-et-03", type: "competency", competency: "ethics", source: "ogl-success-profiles", text: "Give me an example of a time you treated people fairly when it would have been easier not to." },
  { id: "cp-et-04", type: "competency", competency: "ethics", source: "original", text: "Tell me about a time you were asked to do something you thought was wrong." },

  // ── Competency: customer focus ───────────────────────────────────────────
  { id: "cp-cu-01", type: "competency", competency: "customer-focus", source: "original", text: "Tell me about a time you dealt with an unhappy customer or service user." },
  { id: "cp-cu-02", type: "competency", competency: "customer-focus", source: "original", text: "Describe a time you went further than you had to for someone you were serving." },
  { id: "cp-cu-03", type: "competency", competency: "customer-focus", source: "original", text: "Give me an example of a time you had to manage what someone expected of you." },
  { id: "cp-cu-04", type: "competency", competency: "customer-focus", source: "original", text: "Tell me about a time you could not give someone what they wanted." },

  // ── Competency: learning ─────────────────────────────────────────────────
  { id: "cp-le-01", type: "competency", competency: "learning", source: "original", text: "Tell me about something you taught yourself and why." },
  { id: "cp-le-02", type: "competency", competency: "learning", source: "original", text: "Describe a time you asked for feedback and acted on it." },
  { id: "cp-le-03", type: "competency", competency: "learning", source: "original", text: "Give me an example of a skill you were poor at and are now good at." },
  { id: "cp-le-04", type: "competency", competency: "learning", source: "original", text: "Tell me about a time you learned more from watching someone than from being told." },

  // ── Strengths (the graduate schemes lean on these) ────────────────────────
  { id: "st-01", type: "strengths", source: "original", text: "What kind of work gives you energy, and what drains it?" },
  { id: "st-02", type: "strengths", source: "original", text: "What are you naturally good at that other people find hard?" },
  { id: "st-03", type: "strengths", source: "original", text: "When did you last lose track of time because you were enjoying the work?" },
  { id: "st-04", type: "strengths", source: "original", text: "What do you do that you would carry on doing even if nobody paid you for it?" },
  { id: "st-05", type: "strengths", source: "original", text: "Which part of a project do you want to be handed, and which part do you dread?" },
  { id: "st-06", type: "strengths", source: "original", text: "What would you like to be better at, and what are you doing about it?" },
  { id: "st-07", type: "strengths", source: "original", text: "Do you prefer starting things or finishing them? Tell me why." },
  { id: "st-08", type: "strengths", source: "original", text: "How do you like to be managed?" },
  { id: "st-09", type: "strengths", source: "original", text: "What sort of working environment brings out your best?" },
  { id: "st-10", type: "strengths", source: "original", text: "When do you find it easiest to concentrate, and when is it hardest?" },
  { id: "st-11", type: "strengths", source: "original", text: "What is the compliment you get most often at work or in your studies?" },
  { id: "st-12", type: "strengths", source: "original", text: "Would you rather be given a clear brief or a blank page? Why?" },

  // ── Situational ──────────────────────────────────────────────────────────
  { id: "si-01", type: "situational", source: "original", text: "What would you do in your first six weeks in this job?" },
  { id: "si-02", type: "situational", source: "original", text: "You are given a task with no clear instructions and the person who set it is away. What do you do?" },
  { id: "si-03", type: "situational", source: "original", text: "You realise you are not going to hit a deadline. What happens next?" },
  { id: "si-04", type: "situational", source: "original", text: "A colleague asks you to cover something you have never done before. How do you handle it?" },
  { id: "si-05", type: "situational", source: "original", text: "You are asked to work on two urgent things by two different people. What do you do?" },
  { id: "si-06", type: "situational", source: "original", text: "You spot an error in work that has already been sent out. What do you do?" },
  { id: "si-07", type: "situational", source: "original", text: "Someone in your team keeps missing what they promised. How do you approach it?" },
  { id: "si-08", type: "situational", source: "original", text: "You disagree with the approach your manager has chosen. What do you do?" },
  { id: "si-09", type: "situational", source: "original", text: "You are new and nobody has time to show you anything. How do you get up to speed?" },
  { id: "si-10", type: "situational", source: "original", text: "A customer asks for something that is against the rules but would clearly help them. What do you do?" },
  { id: "si-11", type: "situational", source: "original", text: "You are halfway through a piece of work when the goal changes. What is your first move?" },
  { id: "si-12", type: "situational", source: "original", text: "You are asked to present something you only half understand. How do you prepare?" },
  { id: "si-13", type: "situational", source: "original", text: "Your work depends on someone who has gone quiet. What do you do?" },
  { id: "si-14", type: "situational", source: "original", text: "You find a faster way of doing something the team has always done another way. What now?" },
  { id: "si-15", type: "situational", source: "original", text: "You are given feedback you think is unfair. How do you respond?" },
  { id: "si-16", type: "situational", source: "original", text: "You have finished your work early and nobody has given you anything else. What do you do?" },

  // ── Commercial awareness ─────────────────────────────────────────────────
  { id: "co-01", type: "commercial", source: "original", text: "What do you think is the biggest challenge facing our industry right now?" },
  { id: "co-02", type: "commercial", source: "original", text: "How do you think a company like ours actually makes its money?" },
  { id: "co-03", type: "commercial", source: "original", text: "Tell me about a business story you have followed recently and why it interested you." },
  { id: "co-04", type: "commercial", source: "original", text: "Who would you say our competitors are, and what do they do differently?" },
  { id: "co-05", type: "commercial", source: "original", text: "What would you change about how our sector serves its customers?" },
  { id: "co-06", type: "commercial", source: "original", text: "How do you keep up with what is happening in this field?" },
  { id: "co-07", type: "commercial", source: "original", text: "What effect do you think artificial intelligence will have on this kind of work?" },
  { id: "co-08", type: "commercial", source: "original", text: "If you were running this business, what is the first thing you would look at?" },
  { id: "co-09", type: "commercial", source: "original", text: "What risk do you think our industry is not taking seriously enough?" },
  { id: "co-10", type: "commercial", source: "original", text: "How would you explain what we do to someone who had never heard of us?" },

  // ── Technical (role-agnostic wording; the tailored slot goes deeper) ──────
  { id: "te-01", type: "technical", source: "original", text: "Talk me through a piece of technical work you are proud of, and the choices you made." },
  { id: "te-02", type: "technical", source: "original", text: "Explain a concept from your field to me as though I had never met it." },
  { id: "te-03", type: "technical", source: "original", text: "How do you check that your work is right before you hand it over?" },
  { id: "te-04", type: "technical", source: "original", text: "Tell me about a tool or method you use often. Why that one?" },
  { id: "te-05", type: "technical", source: "original", text: "Describe a time the data or evidence disagreed with what everyone expected." },
  { id: "te-06", type: "technical", source: "original", text: "What do you do when you get stuck on something technical?" },
  { id: "te-07", type: "technical", source: "original", text: "How do you decide when something is good enough to ship or submit?" },
  { id: "te-08", type: "technical", source: "original", text: "Tell me about something technical you had to learn for a specific piece of work." },

  // ── Leadership (level-tagged: not a fair question for a school leaver) ────
  { id: "ld-01", type: "leadership", levels: ["graduate", "experienced"], source: "original", text: "Tell me about a time you led a piece of work, whatever your job title was." },
  { id: "ld-02", type: "leadership", levels: ["graduate", "experienced"], source: "original", text: "Describe a time you had to get people to do something without being their manager." },
  { id: "ld-03", type: "leadership", levels: ["experienced"], source: "original", text: "How do you handle a member of your team who is underperforming?" },
  { id: "ld-04", type: "leadership", levels: ["experienced"], source: "original", text: "Tell me about a decision you made that your team disagreed with." },
  { id: "ld-05", type: "leadership", levels: ["experienced"], source: "original", text: "Describe how you have developed someone you worked with." },
  { id: "ld-06", type: "leadership", levels: ["early", "graduate", "experienced"], source: "original", text: "Tell me about a time you took responsibility when nobody else would." },
  { id: "ld-07", type: "leadership", levels: ["early", "graduate"], source: "original", text: "Describe a time you organised other people to get something done." },
  { id: "ld-08", type: "leadership", levels: ["experienced"], source: "ogl-success-profiles", text: "Tell me how you have set a clear direction for a team and kept them to it." },
  { id: "ld-09", type: "leadership", levels: ["experienced"], source: "original", text: "How do you decide what to delegate and what to keep?" },
  { id: "ld-10", type: "leadership", levels: ["graduate", "experienced"], source: "original", text: "Tell me about a time you had to lead through a change you did not choose." },
];
