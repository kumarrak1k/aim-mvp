export type CompanyGuide = {
  slug: string;
  name: string;
  sector: string;
  logoInitials: string;
  brandColor: string;
  tagline: string;
  overview: string;
  processSteps: Array<{ title: string; description: string }>;
  competencies: string[];
  sampleQuestions: Array<{ question: string; tip: string }>;
  insiderTips: string[];
  practiceRole: string;
  metaDescription: string;
};

export const COMPANY_GUIDES: CompanyGuide[] = [
  {
    slug: "mckinsey",
    name: "McKinsey & Company",
    sector: "Management Consulting",
    logoInitials: "McKinsey",
    brandColor: "#0061A0",
    tagline: "Pass the McKinsey interview: structure, cases, and PEI prep.",
    overview:
      "McKinsey's interview process is among the most rigorous in the world. It combines case interviews testing structured problem-solving with the Personal Experience Interview (PEI), which assesses leadership, personal impact, and entrepreneurial drive. Candidates typically face two rounds, each with two interviewers.",
    processSteps: [
      {
        title: "Online application & CV screen",
        description:
          "CV reviewed for academic excellence, leadership roles, and measurable impact. McKinsey values top-decile academic performance alongside evidence of leadership outside the classroom.",
      },
      {
        title: "McKinsey Solve (Imbellus assessment)",
        description:
          "A gamified problem-solving assessment lasting around 60–70 minutes. Tests systems thinking, data analysis, and decision-making under uncertainty, not domain knowledge.",
      },
      {
        title: "First round interviews (2 interviews)",
        description:
          "Each interview is 45–60 minutes: roughly 30 minutes of case interview plus 15 minutes of PEI. Cases test structured frameworks, quantitative reasoning, and hypothesis-led thinking.",
      },
      {
        title: "Final round interviews (2–3 interviews)",
        description:
          "Same format but with senior partners. Cases are more ambiguous and senior interviewers will probe your recommendations harder. PEI stories must be leadership-focused with clear personal impact.",
      },
    ],
    competencies: [
      "Structured problem-solving",
      "Quantitative reasoning",
      "Personal leadership impact",
      "Entrepreneurial drive",
      "Inclusive leadership",
      "Courage under pressure",
    ],
    sampleQuestions: [
      {
        question:
          "Tell me about a time you led a team through significant uncertainty. What did you personally do, and what was the outcome?",
        tip: "This is a PEI question. McKinsey wants to see YOUR actions, not the team's. Use first-person throughout. Quantify the impact and be specific about the moment you changed the trajectory.",
      },
      {
        question:
          "Our client is a UK supermarket seeing a 15% margin decline over three years. How would you approach diagnosing this?",
        tip: "Open with a structure before diving in. A good opener: 'I'd want to understand whether this is a revenue or cost issue first.' Then branch into revenue drivers (volume, price, mix) vs. cost drivers (COGS, SG&A, logistics).",
      },
      {
        question:
          "Tell me about a time you had to persuade a senior stakeholder who disagreed with your recommendation.",
        tip: "McKinsey values intellectual courage. Show that you held your position with evidence, not just deferred. Describe the specific data or argument that changed the dynamic.",
      },
      {
        question:
          "How many piano tuners are there in London?",
        tip: "A classic estimation/Fermi question. Structure your approach: population → households → piano ownership rate → tuning frequency → time per tuning → tuners per hour. Show your reasoning clearly. The number matters less than the method.",
      },
    ],
    insiderTips: [
      "Structure before content: always pause to lay out your framework before answering. Interviewers assess how you think, not just what you conclude.",
      "Lead with a hypothesis: McKinsey's culture is hypothesis-led. Say 'I think the issue is X, and here's why I'd test that first.'",
      "Be specific in PEI stories: avoid 'we did X'. Every sentence should have 'I'. McKinsey is assessing your personal leadership, not your team's performance.",
      "Ask for data: in case interviews, good candidates ask for specific data to validate or challenge their hypothesis. Passively accepting all information is a red flag.",
      "Practise mental maths: expect to work with numbers in your head. Practice multiplying and dividing large numbers quickly and confidently.",
    ],
    practiceRole: "Management Consultant",
    metaDescription:
      "Complete guide to passing the McKinsey interview: process steps, PEI prep, case interview frameworks, sample questions, and insider tips. Practice with AI-scored mock interviews.",
  },

  {
    slug: "deloitte",
    name: "Deloitte",
    sector: "Professional Services",
    logoInitials: "Deloitte",
    brandColor: "#86BC25",
    tagline: "Pass the Deloitte interview: competency, strengths, and digital assessment prep.",
    overview:
      "Deloitte's graduate and experienced hire process typically involves online tests, a strengths-based video interview, and an assessment centre or partner interview. The focus is on Deloitte's values: integrity, outstanding value to clients, commitment to each other, and strength from diversity.",
    processSteps: [
      {
        title: "Online application",
        description:
          "Application form plus CV. Deloitte reviews for commercial awareness, academic achievement, and alignment with their values. Tailor your application to the specific service line.",
      },
      {
        title: "Online tests (numerical, situational judgement)",
        description:
          "Numerical reasoning test and a situational judgement test. The SJT presents workplace scenarios and asks how you'd respond. It measures values alignment as much as analytical ability.",
      },
      {
        title: "Strengths-based video interview",
        description:
          "A pre-recorded video interview with 5–8 strengths-based questions. You'll have a few seconds to read each question and typically 2–3 minutes to answer. These questions have no 'right' answer. Deloitte is assessing what energises you.",
      },
      {
        title: "Assessment centre or partner interview",
        description:
          "Includes a group exercise, written case study, and competency/strengths interview with a manager or partner. For experienced hires, this may be a series of one-to-one partner interviews.",
      },
    ],
    competencies: [
      "Commercial awareness",
      "Teamwork and collaboration",
      "Building relationships",
      "Leadership and influence",
      "Problem-solving and analysis",
      "Personal resilience",
    ],
    sampleQuestions: [
      {
        question:
          "Tell me about something you've done that you're really proud of.",
        tip: "A classic strengths question. Pick something that genuinely energised you. Deloitte can tell if you're performing vs. reflecting. Connect it to skills relevant to the role and articulate what you specifically did and why it mattered.",
      },
      {
        question:
          "What's a current trend affecting the professional services industry, and how should Deloitte respond to it?",
        tip: "Deloitte tests commercial awareness. Good topics: AI in audit, ESG reporting requirements, talent shortages post-COVID, digital transformation demand. Show you understand client implications, not just the trend itself.",
      },
      {
        question:
          "Describe a time you had to work with someone very different from you. How did you make it work?",
        tip: "Deloitte values diversity and inclusion explicitly. Show that you adapted your communication style, not just tolerated the difference. Emphasise what you learned and the outcome for the team.",
      },
      {
        question:
          "When do you work at your best?",
        tip: "A strengths question. Be honest and specific. 'When I'm given a complex problem with a tight deadline' is more credible than a generic answer. Relate it to how you'd contribute in the role.",
      },
    ],
    insiderTips: [
      "Strengths questions have no wrong answer, but vague answers are weak. Be specific and be authentic. Interviewers are trained to detect what energises vs. drains you.",
      "Research the specific service line: Deloitte has Audit, Tax, Consulting, Risk, and Financial Advisory. Know which you're applying to and understand their current challenges.",
      "Prepare 3–4 core stories: competency questions will ask for examples. Prepare stories on leadership, teamwork, overcoming failure, and commercial impact.",
      "The group exercise is assessed on quality of contribution, not dominance. Listening and building on others' points is scored as positively as introducing ideas.",
      "Show genuine curiosity about clients: Deloitte values people who are interested in how businesses work. Come with questions about their clients' industries.",
    ],
    practiceRole: "Consultant",
    metaDescription:
      "Complete guide to passing the Deloitte interview: assessment process, strengths-based questions, commercial awareness prep, and insider tips. Practice with AI-scored mock interviews.",
  },

  {
    slug: "goldman-sachs",
    name: "Goldman Sachs",
    sector: "Investment Banking & Financial Services",
    logoInitials: "GS",
    brandColor: "#0061A0",
    tagline: "Pass the Goldman Sachs interview: technical, fit, and markets prep.",
    overview:
      "Goldman Sachs is one of the most competitive employers globally. Their process combines rigorous technical assessment with fit interviews that probe motivation, resilience, and commercial judgement. For front-office roles (IBD, Sales & Trading, Asset Management), expect both technical and behavioural rounds.",
    processSteps: [
      {
        title: "Online application & HireVue",
        description:
          "Application followed by a HireVue video interview with 3–5 pre-recorded questions covering motivation, fit, and basic commercial awareness. You typically have 30 seconds to prepare and 3 minutes to answer.",
      },
      {
        title: "HireVue technical screening (for technology roles)",
        description:
          "Technology roles include a coding assessment alongside the video interview. Goldman uses HackerRank-style challenges testing data structures, algorithms, and problem-solving.",
      },
      {
        title: "First-round interviews (2 interviews, 30 mins each)",
        description:
          "Mix of technical and behavioural. For IBD: expect LBO walkthrough, DCF concepts, and deal discussion. For Sales & Trading: markets awareness, options intuition, and risk questions.",
      },
      {
        title: "Superday / final round (4–6 interviews)",
        description:
          "A full day of back-to-back interviews with analysts, associates, VPs, and MDs. Includes in-depth technical questions, market and deal discussion, and 'Why Goldman' questions from every interviewer.",
      },
    ],
    competencies: [
      "Technical / financial modelling acumen",
      "Markets and commercial awareness",
      "Resilience and drive",
      "Communication and client presence",
      "Teamwork and integrity",
      "Intellectual curiosity",
    ],
    sampleQuestions: [
      {
        question:
          "Walk me through a DCF valuation.",
        tip: "Structure: forecast free cash flows → discount at WACC → calculate terminal value → sum to enterprise value → bridge to equity value. Interviewers will probe your WACC assumptions and terminal value sensitivity. Know why WACC changes and what affects beta.",
      },
      {
        question:
          "Why Goldman Sachs specifically, and why not JP Morgan or Morgan Stanley?",
        tip: "Generic answers fail. Reference specific Goldman businesses (e.g. the dominance of GS in M&A advisory), culture of partnership ownership, or specific transactions they've advised on. Show you've done the research.",
      },
      {
        question:
          "Tell me about a stock you'd buy today and why.",
        tip: "For Sales & Trading interviews. Pick a stock you actually follow. Structure: sector thesis → company-specific catalyst → valuation → risks. Show intellectual conviction, not a safe answer.",
      },
      {
        question:
          "Describe a time you failed and what you learned.",
        tip: "Goldman values resilience. Pick a genuine failure, not a humble-brag. Show intellectual honesty about what went wrong and clear evidence of what you changed as a result.",
      },
    ],
    insiderTips: [
      "Technical preparation is non-negotiable: for IBD, know DCF, LBO, and M&A deal structures cold. For markets roles, have a view on equities, rates, and FX.",
      "'Why Goldman' is asked by every interviewer, so give a different, specific answer each time. Interviewers talk to each other.",
      "Read the GS earnings call and annual report: at least one interviewer will test whether you understand the firm's current business mix and challenges.",
      "Demonstrate intellectual curiosity: Goldman values people who are interested in markets, not just employed by them. Come with genuine opinions on economic trends.",
      "The Superday is a marathon: pace yourself, maintain energy, and treat each conversation as the most important of the day. Fatigue shows.",
    ],
    practiceRole: "Investment Banking Analyst",
    metaDescription:
      "Complete guide to passing the Goldman Sachs interview: Superday prep, DCF and technical questions, markets awareness, and insider tips. Practice with AI-scored mock interviews.",
  },

  {
    slug: "kpmg",
    name: "KPMG",
    sector: "Professional Services",
    logoInitials: "KPMG",
    brandColor: "#00338D",
    tagline: "Pass the KPMG interview: values, competencies, and case study prep.",
    overview:
      "KPMG's process for graduates and experienced hires is structured around their values: integrity, excellence, courage, together, and for better. Their assessment centre is thorough: expect a written case study, group exercise, and competency interview, all assessed against KPMG's competency framework.",
    processSteps: [
      {
        title: "Online application",
        description:
          "Application and CV screened for academics, extracurricular leadership, and alignment with KPMG's values. Ensure your personal statement references specific KPMG service lines and demonstrates commercial awareness.",
      },
      {
        title: "Online assessments (situational judgement + numerical)",
        description:
          "A situational judgement test presenting workplace scenarios, and a numerical reasoning test. The SJT is values-based: scenarios test integrity, collaboration, and professional judgement.",
      },
      {
        title: "Job simulation / digital interview",
        description:
          "A digital exercise replicating real KPMG work: reading documents, answering emails, and making recommendations under time pressure. Followed by a short video interview with motivational questions.",
      },
      {
        title: "Assessment centre",
        description:
          "Half-day centre including: written case study analysis, group discussion exercise, and a competency-based interview with a manager. Some roles also include a partner interview.",
      },
    ],
    competencies: [
      "Integrity and professional ethics",
      "Commercial and client focus",
      "Collaboration and teamwork",
      "Personal drive and resilience",
      "Analytical and problem-solving",
      "Communication and influence",
    ],
    sampleQuestions: [
      {
        question:
          "Tell me about a time you had to maintain professional integrity under pressure.",
        tip: "KPMG's first value is integrity. This question is often asked explicitly. Describe a situation where doing the right thing was difficult or costly, and show you held firm. Audit context examples work well here.",
      },
      {
        question:
          "What are the biggest challenges facing the UK audit profession right now?",
        tip: "Commercial awareness for KPMG. Key topics: audit market reform (Big Four separation debate), ESG assurance growth, AI in audit, talent retention, and regulatory scrutiny post-audit scandals (Carillion, Thomas Cook).",
      },
      {
        question:
          "Describe a time you worked in a team where conflict arose. How did you resolve it?",
        tip: "KPMG values the 'together' principle. Show that you addressed conflict constructively, not avoided it. Focus on the outcome for the team, not just the resolution of the conflict itself.",
      },
      {
        question:
          "Why KPMG and not one of the other Big Four?",
        tip: "Research KPMG's specific strengths: strong mid-market advisory practice, KPMG Ignition innovation hubs, their technology alliances (Microsoft, Salesforce). Reference something specific to the service line you're applying for.",
      },
    ],
    insiderTips: [
      "KPMG's values are not a formality: interviewers are specifically trained to assess them. Know all five values and have a story that demonstrates each.",
      "The written case study is timed: practise reading fast and structuring recommendations concisely. Use bullet points and clear headers.",
      "Group exercises reward listening: KPMG assessors score active listening and building on others as much as idea generation. Don't just talk; synthesise.",
      "Demonstrate awareness of KPMG's specific clients and sectors: they serve FTSE 100 companies and major public sector bodies. Show you understand those industries.",
      "Prepare your 'Why Audit/Advisory/Tax?' answer carefully: interviewers want to understand your genuine motivation for the service line, not just the firm.",
    ],
    practiceRole: "Graduate Consultant",
    metaDescription:
      "Complete guide to passing the KPMG interview: assessment centre prep, values-based questions, commercial awareness, and insider tips. Practice with AI-scored mock interviews.",
  },

  {
    slug: "civil-service-fast-stream",
    name: "Civil Service Fast Stream",
    sector: "Government & Public Sector",
    logoInitials: "CS",
    brandColor: "#00703C",
    tagline: "Pass the Civil Service Fast Stream: behaviours, strengths, and online test prep.",
    overview:
      "The Civil Service Fast Stream is the UK government's graduate leadership programme. It is one of the most competitive graduate schemes in the UK, with an acceptance rate below 5%. The process is structured around the Civil Service Success Profiles framework: Behaviours, Strengths, Ability, Experience, and Technical skills.",
    processSteps: [
      {
        title: "Online application and eligibility check",
        description:
          "Basic eligibility check (degree classification, right to work). All eligible candidates are invited to the online tests. Unlike many schemes, the Fast Stream does not CV-screen at this stage.",
      },
      {
        title: "Online tests (Situational Judgement + Work Strengths)",
        description:
          "A situational judgement test based on Civil Service values and a strengths questionnaire assessing your natural working style. These are used for sift, not ranking. They assess fit rather than ability.",
      },
      {
        title: "E-Tray exercise",
        description:
          "A timed inbox simulation where you respond to emails as a fictional civil servant. Tests judgement, prioritisation, and written communication. Around 60 minutes.",
      },
      {
        title: "Fast Stream Assessment Centre (FSAC)",
        description:
          "A full-day virtual centre including: a written analysis exercise, a group scenario, a strengths-based panel interview, and a leadership presentation. Assessed against Leadership behaviour and Fast Stream strengths.",
      },
    ],
    competencies: [
      "Leadership (seeing the big picture, changing and improving)",
      "Working together and building relationships",
      "Managing a quality service",
      "Delivering at pace",
      "Making effective decisions",
      "Communicating and influencing",
    ],
    sampleQuestions: [
      {
        question:
          "Tell me about a time you led a project or initiative that delivered lasting change.",
        tip: "Use the STAR method. The Fast Stream specifically assesses 'Changing and Improving': show that you identified a problem, designed a solution, and the change persisted after your involvement ended.",
      },
      {
        question:
          "Describe a situation where you had to communicate a complex idea to a non-specialist audience.",
        tip: "Communicating and influencing is a core behaviour. Show you adapted your style: simplified language, used analogies, checked for understanding. Give a specific example with a clear outcome.",
      },
      {
        question:
          "Tell me about a time when you had to make a decision with incomplete information under time pressure.",
        tip: "This tests 'Making Effective Decisions'. Show your decision-making process: what information you gathered, what you decided, why, and what you would do differently. Acknowledge ambiguity. Don't pretend you had all the answers.",
      },
      {
        question:
          "What do you understand by the Civil Service value of 'impartiality', and can you give an example of when you demonstrated it?",
        tip: "The Civil Service has four core values: integrity, honesty, objectivity, and impartiality. Know them all. Impartiality means providing balanced advice regardless of personal views. Give an example where you put aside personal preference to serve others.",
      },
    ],
    insiderTips: [
      "Read the Success Profiles framework before applying: it is the definitive guide to how every part of the process is assessed. Download it from gov.uk.",
      "Behaviour questions require STAR: the Fast Stream panel uses structured scoring rubrics. Vague answers score zero. Use first-person, be specific, quantify where possible.",
      "The written exercise is not about the 'right answer': assessors want to see structured analysis, clear recommendations, and balanced consideration of trade-offs.",
      "Research the specific stream: Generalist Fast Stream, Digital, Data and Technology, Finance, Policy Profession. Each has different assessment criteria and day-to-day realities.",
      "The group exercise tests collaboration, not dominance. Civil Service culture values consensus and listening. Being the loudest voice often scores lower than building the group to a better conclusion.",
    ],
    practiceRole: "Policy Advisor",
    metaDescription:
      "Complete guide to passing the Civil Service Fast Stream: FSAC prep, behaviour questions, Success Profiles framework, and insider tips. Practice with AI-scored mock interviews.",
  },
];

export function getCompanyGuide(slug: string): CompanyGuide | undefined {
  return COMPANY_GUIDES.find((g) => g.slug === slug);
}
