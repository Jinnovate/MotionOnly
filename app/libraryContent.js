const sources = {
  ukActivity: {
    label: "UK Chief Medical Officers: physical activity guidelines",
    url: "https://www.gov.uk/government/publications/physical-activity-guidelines-uk-chief-medical-officers-report/uk-chief-medical-officers-physical-activity-guidelines",
  },
  acsmStrength: {
    label: "ACSM: resistance training guidelines update (2026)",
    url: "https://acsm.org/resistance-training-guidelines-update-2026/",
  },
  nhsFatigue: {
    label: "NHS: tiredness and fatigue",
    url: "https://www.nhs.uk/symptoms/tiredness-and-fatigue/",
  },
  govBusinessPlan: {
    label: "GOV.UK: write a business plan",
    url: "https://www.gov.uk/write-business-plan",
  },
  businessCashFlow: {
    label: "Business.gov.uk: preparing financial forecasts",
    url: "https://www.business.gov.uk/support/funding-for-business/preparing-for-funding-applications/",
  },
  icoMarketing: {
    label: "ICO: direct marketing guidance",
    url: "https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/direct-marketing-guidance/",
  },
  asaBusiness: {
    label: "ASA: advertising advice for businesses",
    url: "https://www.asa.org.uk/advice-and-resources/advice-for-businesses.html",
  },
  fcaCfd: {
    label: "FCA: contracts for difference",
    url: "https://www.fca.org.uk/firms/contract-for-differences",
  },
  fcaFinfluencers: {
    label: "FCA: financial promotions on social media",
    url: "https://www.fca.org.uk/news/press-releases/fca-warns-firms-and-finfluencers-keep-their-social-media-ads-lawful",
  },
  cftcForex: {
    label: "CFTC: eight things to know before trading forex",
    url: "https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/CustomerAdvisory_MustKnowForex.html",
  },
  cmePosition: {
    label: "CME Group: proper position size",
    url: "https://www.cmegroup.com/education/courses/trade-and-risk-management/proper-position-size.hideSubnav.educationIframe.html.html?hideAddThisExt=y&hideFooter=y&hideHeader=y&hideRightRail=y",
  },
  cmeRiskPlan: {
    label: "CME Group: risk management and your trade plan",
    url: "https://www.cmegroup.com/education/courses/building-a-trade-plan/risk-management-and-your-trade-plan",
  },
  investorOrders: {
    label: "Investor.gov: trading basics and order types",
    url: "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-14",
  },
  implementationIntentions: {
    label: "Gollwitzer and Sheeran: implementation intentions meta-analysis",
    url: "https://dccps.nci.nih.gov/BRP/constructs/implementation_intentions/goal_intent_attain.pdf",
  },
  lallyHabits: {
    label: "University of Surrey: what habit-formation research actually found",
    url: "https://www.surrey.ac.uk/news/does-it-really-take-66-days-form-habit-we-asked-expert-dr-pippa-lally",
  },
};

export const libraryCategories = ["All", "Foundations", "Business", "Trading", "Fitness"];

export const libraryContent = [
  {
    id: "motion-only-operating-system",
    title: "The Motion Only Operating System",
    category: "Foundations",
    type: "Core playbook",
    level: "Start here",
    minutes: 14,
    featured: true,
    summary: "Turn a direction into weekly outcomes, daily moves and honest evidence without filling your life with admin.",
    outcome: "A complete personal execution loop you can run every week.",
    sections: [
      {
        heading: "The system in one page",
        body: [
          "Motion Only is built around evidence of movement, not the appearance of being busy. A direction tells you where you are going. A 12-week outcome defines what must be different. Weekly commitments convert that outcome into work. Daily moves protect the next action. The weekly review turns evidence into a better plan.",
          "Use the smallest system that still makes reality visible. If an item does not change a decision, remove it.",
        ],
        table: {
          headers: ["Layer", "Question", "Cadence", "Evidence"],
          rows: [
            ["Direction", "What kind of life or business am I building?", "Quarterly", "A short written statement"],
            ["Outcome", "What measurable result matters next?", "Every 12 weeks", "Start, target and deadline"],
            ["Weekly commitment", "What must be true by Sunday?", "Weekly", "A deliverable or completed standard"],
            ["Daily move", "What action moves the week today?", "Daily", "A sent, built, trained or reviewed item"],
            ["Review", "What does the evidence change?", "Weekly", "Keep, change or stop decision"],
          ],
        },
      },
      {
        heading: "Choose fewer outcomes",
        body: [
          "Run no more than three meaningful 12-week outcomes at once: normally one primary outcome and up to two supporting outcomes. More goals create more switching, more negotiation and less finish.",
          "Write each outcome as a change in the real world. 'Work on sales' is activity. 'Create a qualified GBP 25,000 monthly pipeline by 30 September' is an outcome.",
        ],
        bullets: [
          "Name the starting position honestly.",
          "Define one result measure and two or three lead measures you can influence.",
          "Set a deadline and explain why the result matters now.",
          "List the boundary: what you will not sacrifice to achieve it.",
          "Keep the outcome private unless sharing it creates useful accountability.",
        ],
        callout: {
          label: "Quality test",
          text: "A stranger should be able to tell whether the outcome happened without hearing your explanation.",
        },
      },
      {
        heading: "Build the week before the day",
        body: [
          "Plan from the outcome backwards. A weekly commitment is a result you can verify, not a vague intention. 'Publish the landing page' is stronger than 'work on marketing'. 'Complete all three programmed sessions' is stronger than 'exercise more'.",
          "Choose three weekly commitments that would make the week count. Then place the work on the calendar. Daily moves should come from those commitments, not from whatever feels urgent that morning.",
        ],
        steps: [
          "Review the last week and the current 12-week outcome.",
          "Choose the three results that matter most this week.",
          "Break each result into the next visible action.",
          "Schedule focused blocks and protect recovery.",
          "Name the most likely obstacle and create an if-then response.",
        ],
      },
      {
        heading: "Score evidence, not emotion",
        body: [
          "Progress can feel slow before it becomes visible. Use an evidence scorecard so a difficult mood does not erase completed work and a confident mood does not hide weak execution.",
        ],
        bullets: [
          "Outcome measure: the result itself, such as qualified pipeline or a tested lift.",
          "Lead measure: controllable action linked to the result, such as qualified conversations or completed sessions.",
          "Quality measure: whether the action met the standard, such as risk rules followed or decision-maker present.",
          "Consistency measure: commitments kept divided by commitments made.",
        ],
        callout: {
          label: "Motion rule",
          text: "Never increase the number of tracked measures because a week went badly. Improve the decision, reduce friction and return to the next clean action.",
        },
      },
      {
        heading: "Close the loop",
        body: [
          "At the end of the week, mark each commitment kept, partially kept, missed or deliberately changed. A deliberate change made with new evidence is not failure. Silent avoidance is.",
          "Finish with one keep, one change and one stop. Those three decisions are the bridge into the next week.",
        ],
      },
    ],
    checklist: [
      "I have one primary 12-week outcome.",
      "The result has a starting point, target and deadline.",
      "This week's three commitments produce visible evidence.",
      "My daily moves are scheduled, not held in memory.",
      "I have an if-then plan for the most likely obstacle.",
      "My goals and evidence remain private unless I choose to share them.",
    ],
    template: {
      title: "12-week operating sheet",
      intro: "Complete this in one sitting, then review it every Friday or Sunday.",
      fields: [
        ["Direction", "The larger direction this outcome serves."],
        ["12-week outcome", "From [starting point] to [target] by [date]."],
        ["Why now", "The practical reason this deserves attention."],
        ["Lead measures", "Two or three repeatable actions that influence the result."],
        ["This week's three commitments", "Three verifiable results, each with a deadline."],
        ["Likely obstacle and response", "If [obstacle], then I will [specific response]."],
        ["Keep / change / stop", "The three decisions from the weekly review."],
      ],
    },
    sources: [sources.implementationIntentions],
  },
  {
    id: "weekly-review-protocol",
    title: "The Weekly Review Protocol",
    category: "Foundations",
    type: "Protocol",
    level: "Core",
    minutes: 10,
    summary: "A 30-minute review that separates facts from stories and turns the week into better decisions.",
    outcome: "A repeatable weekly debrief and a clean plan for the next seven days.",
    sections: [
      {
        heading: "Why the review exists",
        body: [
          "A weekly review is not a judgement of your character. It is an operating meeting with yourself. Its job is to compare intention with evidence, find the constraint and choose the next adjustment.",
          "Run it at the same time each week. Thirty focused minutes is enough when your records are current.",
        ],
      },
      {
        heading: "Part 1: collect the facts",
        steps: [
          "Open your calendar, commitments, habit check-ins, goal measures and relevant work records.",
          "Record the result of every weekly commitment: kept, partial, missed or changed.",
          "Write the actual number beside each measure. Do not round in your favour.",
          "Capture unfinished items in one place so they stop competing for attention.",
          "Note any health, family, market or business condition that materially changed the week.",
        ],
        callout: {
          label: "Language rule",
          text: "Use observable language. 'Sent seven qualified proposals' is evidence. 'I was not focused enough' is an interpretation that still needs proof.",
        },
      },
      {
        heading: "Part 2: explain without excusing",
        body: [
          "A useful explanation points to a changeable part of the system. Avoid both self-attack and convenient excuses.",
        ],
        table: {
          headers: ["Weak explanation", "Better question"],
          rows: [
            ["I lacked motivation", "Was the next action clear, scheduled and small enough to start?"],
            ["I had no time", "What displaced the work, and was that choice deliberate?"],
            ["The strategy failed", "Was execution faithful enough to evaluate the strategy?"],
            ["I always fall off", "At what exact point did the system break this time?"],
          ],
        },
      },
      {
        heading: "Part 3: make three decisions",
        bullets: [
          "Keep: one behaviour, tool or boundary that worked and should remain.",
          "Change: one high-leverage adjustment for the next week.",
          "Stop: one task, commitment or distraction that does not justify its cost.",
        ],
        body: [
          "Do not redesign the whole system after one poor week. Change one important variable, run the next week and learn from the result.",
        ],
      },
      {
        heading: "Part 4: commit the next week",
        body: [
          "Select the next three weekly commitments, schedule the first actions and identify the single biggest risk to execution. If the week is unusually constrained, reduce the plan before the week begins rather than breaking promises later.",
        ],
      },
    ],
    checklist: [
      "All weekly commitments have a final status.",
      "Measures contain real numbers.",
      "The main constraint is named.",
      "I chose one keep, one change and one stop.",
      "Next week's three commitments are scheduled.",
      "Anything sensitive remains private by default.",
    ],
    template: {
      title: "30-minute debrief",
      intro: "Use short, factual answers. The objective is a better next week.",
      fields: [
        ["Wins with evidence", "What moved, and what proves it?"],
        ["Commitment score", "Kept / made, plus the reason for each miss."],
        ["Main constraint", "The bottleneck that limited more than one result."],
        ["Keep", "What will remain exactly as it is?"],
        ["Change", "What single adjustment will you test next week?"],
        ["Stop", "What will you remove, decline or defer?"],
        ["Next three commitments", "Result, owner, evidence and deadline."],
      ],
    },
    sources: [],
  },
  {
    id: "standards-habits-if-then",
    title: "Standards, Habits and If-Then Plans",
    category: "Foundations",
    type: "Guide",
    level: "Core",
    minutes: 12,
    summary: "Design repeatable behaviour around clear cues instead of waiting to feel ready.",
    outcome: "One well-designed habit with a recovery rule and an obstacle plan.",
    sections: [
      {
        heading: "Separate the three layers",
        table: {
          headers: ["Layer", "Meaning", "Example"],
          rows: [
            ["Outcome", "A result you want", "Complete a 12-week strength block"],
            ["Standard", "A rule for how you operate", "Never add load when technique breaks"],
            ["Habit", "A repeatable action in context", "Pack training kit after dinner"],
          ],
        },
        body: [
          "Outcomes give direction, standards protect quality and habits reduce the effort needed to begin. Confusing them creates weak tracking: an outcome cannot be checked off daily, and a habit should not depend on a major result.",
        ],
      },
      {
        heading: "Build the habit around a cue",
        steps: [
          "Choose one behaviour small enough to repeat on a difficult day.",
          "Attach it to a stable cue: a time, place or existing event.",
          "Make the first step visible and easy before the cue arrives.",
          "Define the minimum version that preserves continuity.",
          "Record completion immediately and review weekly.",
        ],
        callout: {
          label: "Example",
          text: "After I make my first coffee at 06:45, I will open the plan and write today's three moves at the kitchen table.",
        },
      },
      {
        heading: "Use if-then plans for predictable friction",
        body: [
          "Implementation intentions connect a specific situation to a specific response: if X happens, then I will do Y. Research finds they can improve goal attainment, especially when the person is already motivated and the plan is specific.",
          "Create plans for obstacles, not fantasies. A useful response is under your control and can begin immediately.",
        ],
        bullets: [
          "If a client call overruns, then I will use the 20-minute minimum training session.",
          "If I feel the urge to move a stop, then I will close the platform and log the urge.",
          "If a prospect says 'send information', then I will ask which decision the information must help them make.",
        ],
      },
      {
        heading: "Recover quickly, do not protect a perfect streak",
        body: [
          "Habit formation time varies substantially; there is no universal 21-day or 66-day finish line. Missing once does not erase the pattern. The useful measure is how quickly you return.",
          "Create a recovery rule in advance: after a miss, complete the minimum version at the next valid cue and inspect why the original cue failed.",
        ],
      },
    ],
    checklist: [
      "The habit describes one observable action.",
      "It has a stable cue and location.",
      "The environment is prepared before the cue.",
      "A minimum version exists for constrained days.",
      "The likely obstacle has an if-then response.",
      "The recovery rule prioritises returning, not guilt.",
    ],
    template: {
      title: "Habit design card",
      intro: "Build one habit at a time until the cue and response are reliable.",
      fields: [
        ["Behaviour", "The smallest observable action."],
        ["Cue", "After / at / when what specific event?"],
        ["Location", "Where will it happen?"],
        ["Preparation", "What must be ready beforehand?"],
        ["Minimum version", "The version for a genuinely constrained day."],
        ["If-then obstacle plan", "If [likely obstacle], then [response]."],
        ["Recovery rule", "What happens at the next cue after a miss?"],
      ],
    },
    sources: [sources.implementationIntentions, sources.lallyHabits],
  },
  {
    id: "accountability-without-oversharing",
    title: "Accountability Without Oversharing",
    category: "Foundations",
    type: "Privacy guide",
    level: "Core",
    minutes: 9,
    summary: "Get useful accountability while keeping goals, health, financial details and evidence under your control.",
    outcome: "A clear sharing boundary for every goal and project.",
    sections: [
      {
        heading: "Privacy is the default",
        body: [
          "Your goals, progress, project content, achievement evidence, trading records and fitness information should remain visible only to you until you deliberately share them. Joining a room or project should never silently expose private records.",
          "Share the minimum information needed for the support you want. Accountability needs a commitment, evidence standard and check-in time; it rarely needs your full history.",
        ],
      },
      {
        heading: "Use four sharing levels",
        table: {
          headers: ["Level", "Who can see it", "Best use"],
          rows: [
            ["Private", "Only you", "Draft goals, finances, health notes, raw journals"],
            ["Named member", "One selected person", "Coaching, feedback, accountability"],
            ["Project", "Invited project members", "Shared plans, decisions and deliverables"],
            ["Room", "Members of a selected room", "General lessons with sensitive details removed"],
          ],
        },
      },
      {
        heading: "Share proof safely",
        bullets: [
          "Crop screenshots to remove balances, account numbers, email addresses and notifications.",
          "Replace client or prospect names with neutral labels unless you have permission.",
          "Remove location, medical, identity and family information that is not required.",
          "For trading, share process evidence rather than live entries that could become signals.",
          "For fitness, share the completed standard rather than body images unless you genuinely choose otherwise.",
        ],
      },
      {
        heading: "Ask for a specific response",
        body: [
          "Accountability improves when the other person knows their role. Ask for one of four things: witness, question, challenge or help.",
        ],
        bullets: [
          "Witness: 'Confirm I posted the evidence by Friday.'",
          "Question: 'Ask me what broke if I miss two planned sessions.'",
          "Challenge: 'Test whether my explanation matches the evidence.'",
          "Help: 'Review this offer before I send it to five prospects.'",
        ],
      },
      {
        heading: "Revoke access cleanly",
        body: [
          "Review shared access when a goal closes, a project ends or a relationship changes. Removing future access does not guarantee copies already downloaded or captured disappear, so share with that reality in mind.",
        ],
      },
    ],
    checklist: [
      "The item starts private.",
      "Sharing has a specific purpose.",
      "Only named people or the intended space can see it.",
      "Sensitive details have been removed.",
      "The accountability response is clear.",
      "Access will be reviewed when the work ends.",
    ],
    template: {
      title: "Accountability agreement",
      intro: "Use this before sharing a private goal or record.",
      fields: [
        ["Commitment", "What I will complete and by when."],
        ["Evidence", "The minimum proof that confirms completion."],
        ["Audience", "Exactly who can access it."],
        ["Response requested", "Witness, question, challenge or help."],
        ["Sensitive details removed", "What I will redact before sharing."],
        ["Review date", "When access or the agreement will be reconsidered."],
      ],
    },
    sources: [],
  },
  {
    id: "offer-people-understand",
    title: "Build an Offer People Understand",
    category: "Business",
    type: "Playbook",
    level: "Core",
    minutes: 16,
    featured: true,
    summary: "Clarify the customer, costly problem, result, mechanism, proof and next step before adding more marketing.",
    outcome: "A one-page offer that a qualified buyer can understand and evaluate.",
    sections: [
      {
        heading: "An offer is a decision, not a slogan",
        body: [
          "A strong offer helps the right buyer decide whether a clear result is worth the price, effort and risk. It does not need exaggerated claims. It needs specificity, relevance and proof.",
          "Start with one customer in one situation. Broad language often hides a weak understanding of the buyer.",
        ],
      },
      {
        heading: "The six-part offer",
        table: {
          headers: ["Part", "Question"],
          rows: [
            ["Customer", "Who is this for, and what situation are they already in?"],
            ["Problem", "What costly or frustrating problem are they trying to solve?"],
            ["Result", "What useful change can you credibly help create?"],
            ["Mechanism", "How does your service produce that change?"],
            ["Proof", "What evidence reduces uncertainty?"],
            ["Decision", "What are the scope, price, terms and next step?"],
          ],
        },
      },
      {
        heading: "Write the result responsibly",
        body: [
          "Describe the result in language the buyer can verify. Do not promise an outcome you cannot control. Separate your deliverable from the customer's outcome.",
        ],
        bullets: [
          "Weak: 'We transform your growth.'",
          "Stronger: 'We design and launch a qualified outbound system for UK B2B service firms in six weeks.'",
          "Your deliverable: research, messaging, workflows, training and reporting.",
          "Customer-dependent result: response, pipeline or revenue, affected by their offer, market, data and execution.",
        ],
        callout: {
          label: "Claims rule",
          text: "Any objective claim should be accurate, supportable and presented with the context a buyer needs. Testimonials are evidence of one experience, not a guarantee.",
        },
      },
      {
        heading: "Design the mechanism",
        steps: [
          "Diagnose the current state and the constraint.",
          "Name three to five delivery stages in the order they happen.",
          "Define the customer inputs required at each stage.",
          "Specify the deliverable and acceptance test for each stage.",
          "Name exclusions so hidden expectations do not enter the work.",
        ],
      },
      {
        heading: "Reduce decision risk",
        bullets: [
          "Show relevant evidence with dates, context and permission.",
          "Offer a clear scope and change-control process.",
          "Explain assumptions and what happens if they are false.",
          "Use plain terms for price, billing, cancellation and ownership.",
          "Provide a low-friction next step that qualifies both sides.",
        ],
      },
    ],
    checklist: [
      "One specific customer and situation are named.",
      "The problem is costly enough to justify action.",
      "The result is useful, credible and verifiable.",
      "The delivery mechanism is visible.",
      "Proof is relevant and used with permission.",
      "Price, scope, terms, exclusions and next step are clear.",
      "No claim relies on hype, urgency tricks or missing context.",
    ],
    template: {
      title: "One-page offer",
      intro: "Write this before designing a deck or landing page.",
      fields: [
        ["For", "Specific customer and current situation."],
        ["Problem", "What is happening, why it matters and the cost of delay."],
        ["Result", "The credible change you help produce."],
        ["Mechanism", "Three to five delivery stages."],
        ["Deliverables", "What the buyer receives at each stage."],
        ["Proof", "Relevant evidence, context and limitations."],
        ["Scope and exclusions", "Included, not included and required client inputs."],
        ["Commercials", "Price, billing, term and cancellation."],
        ["Next step", "A clear, appropriate decision or diagnostic call."],
      ],
    },
    sources: [sources.asaBusiness, sources.govBusinessPlan],
  },
  {
    id: "qualified-pipeline-system",
    title: "The Qualified Pipeline System",
    category: "Business",
    type: "System",
    level: "Core",
    minutes: 15,
    summary: "Build a measurable route from a defined account list to qualified conversations, decisions and revenue.",
    outcome: "A pipeline with explicit stages, exit criteria and weekly lead measures.",
    sections: [
      {
        heading: "Start with pipeline maths",
        body: [
          "A revenue target is not a sales plan. Work backwards from the target using your actual average deal value, win rate and sales-cycle length. Where data is limited, use conservative assumptions and replace them as evidence arrives.",
        ],
        steps: [
          "Target won revenue divided by average deal value equals wins required.",
          "Wins required divided by proposal-to-win rate equals qualified proposals required.",
          "Proposals required divided by discovery-to-proposal rate equals qualified discoveries required.",
          "Discoveries required divided by positive-response rate estimates the outreach or referral volume required.",
          "Add time: work must enter the pipeline early enough to close inside the target period.",
        ],
      },
      {
        heading: "Define stages by buyer evidence",
        table: {
          headers: ["Stage", "Minimum exit evidence"],
          rows: [
            ["Target", "Matches account and situation criteria"],
            ["Contacted", "Relevant, lawful contact attempt recorded"],
            ["Engaged", "Two-way response or warm introduction"],
            ["Qualified", "Problem, impact, authority, timing and fit understood"],
            ["Solution", "Scope and decision process agreed"],
            ["Proposal", "Commercial proposal reviewed with buyer"],
            ["Decision", "Clear yes, no or dated decision event"],
            ["Won / lost", "Outcome and reason recorded"],
          ],
        },
      },
      {
        heading: "Qualify before forecasting",
        bullets: [
          "Problem: what is happening now, and how do they describe it?",
          "Impact: what does the problem cost or prevent?",
          "Priority: why act now instead of later?",
          "Authority: who owns the result and who approves the spend?",
          "Process: how will a decision be made and by what date?",
          "Fit: can you deliver the result responsibly and profitably?",
        ],
      },
      {
        heading: "Run a weekly pipeline meeting",
        body: [
          "Review movement, not optimism. Every opportunity needs a last meaningful event, a buyer-owned next step and a date. If none exists, move it backwards or close it.",
        ],
        bullets: [
          "New qualified opportunities created.",
          "Value advanced to the next evidence-based stage.",
          "Stalled opportunities with no buyer event.",
          "Decisions due in the next 14 days.",
          "Loss reasons and repeated objections.",
          "The single pipeline constraint for next week.",
        ],
      },
      {
        heading: "Protect relevance and privacy",
        body: [
          "Keep personal data accurate, necessary and access-controlled. Direct marketing rules depend on the channel, recipient and context. UK GDPR and PECR may apply; consent is required in some situations, while legitimate interests requires a documented, proportionate assessment and does not override electronic marketing rules.",
        ],
        callout: {
          label: "Do not assume",
          text: "A public email address is not automatic permission for unlimited marketing. Use appropriate legal guidance for your audience, channel and jurisdiction.",
        },
      },
    ],
    checklist: [
      "Pipeline requirements are based on maths and timing.",
      "Every stage has objective exit evidence.",
      "Forecast opportunities contain a buyer-owned next step.",
      "Stalled work is moved or closed.",
      "Contact data is necessary, current and access-controlled.",
      "Outreach follows the applicable privacy and direct-marketing rules.",
    ],
    template: {
      title: "Pipeline definition",
      intro: "Use one shared definition so pipeline value means the same thing to everyone.",
      fields: [
        ["Target revenue and period", "Won revenue target and deadline."],
        ["Funnel assumptions", "Average deal, stage conversion and cycle length."],
        ["Ideal account", "Firmographic and situation criteria."],
        ["Disqualifiers", "Signals that make the work unsuitable."],
        ["Stages and exits", "Evidence required to advance each stage."],
        ["Weekly lead measures", "Controllable activity and quality measures."],
        ["Data and outreach controls", "Lawful basis, source, retention and opt-out process."],
      ],
    },
    sources: [sources.icoMarketing, sources.govBusinessPlan],
  },
  {
    id: "discovery-conversation",
    title: "Discovery and Sales Conversation Playbook",
    category: "Business",
    type: "Playbook",
    level: "Core",
    minutes: 14,
    summary: "Run calm, useful sales conversations that diagnose fit before presenting a solution.",
    outcome: "A repeatable discovery structure and a mutually clear next decision.",
    sections: [
      {
        heading: "The purpose is fit",
        body: [
          "Discovery is a joint attempt to understand whether a meaningful problem exists, whether solving it matters now and whether your offer is appropriate. It is not a performance designed to corner someone into buying.",
          "Enter with a hypothesis, not a conclusion. Listen for the buyer's language and do not manufacture urgency.",
        ],
      },
      {
        heading: "Use a five-part structure",
        steps: [
          "Contract: confirm time, purpose, agenda and permission to ask direct questions.",
          "Current state: understand the workflow, result and people involved today.",
          "Impact: quantify the operational, financial or personal consequence.",
          "Desired state: define what better means and by when.",
          "Decision: assess priority, ownership, process, budget reality and next step.",
        ],
      },
      {
        heading: "Questions that reveal reality",
        bullets: [
          "What is happening now that made this worth discussing?",
          "How is the current approach working, and where does it break?",
          "Who feels the impact and how do you measure it?",
          "What have you already tried?",
          "If nothing changes for six months, what happens?",
          "What would a useful result look like?",
          "Who else needs confidence in the decision?",
          "What would make this a bad fit?",
        ],
      },
      {
        heading: "Summarise before recommending",
        body: [
          "Reflect the problem, impact, desired result, constraints and decision process in the buyer's language. Ask them to correct you. Only then connect relevant parts of your offer to the diagnosed need.",
        ],
        callout: {
          label: "Recommendation format",
          text: "You said [current state] is causing [impact], and the useful result is [desired state] by [time]. Based on that, the relevant part of our approach is [mechanism]. The main assumption we would need to test is [assumption].",
        },
      },
      {
        heading: "End with a real decision",
        bullets: [
          "Proceed: a dated next meeting or action with owners.",
          "Pause: a named condition and date for reconsideration.",
          "Refer: a better route if you are not the right fit.",
          "Close: a respectful no with the reason recorded.",
        ],
      },
    ],
    checklist: [
      "The agenda and time are agreed.",
      "The buyer speaks more than the seller.",
      "Problem, impact and desired state are concrete.",
      "The decision process and other stakeholders are visible.",
      "The recommendation connects only to diagnosed needs.",
      "The meeting ends with an owned, dated decision or a clean close.",
    ],
    template: {
      title: "Discovery notes",
      intro: "Record the buyer's words, not a sales interpretation.",
      fields: [
        ["Trigger", "Why this conversation is happening now."],
        ["Current state", "Process, result and constraint today."],
        ["Impact", "Cost, risk or blocked opportunity."],
        ["Desired state", "Useful result, measure and timing."],
        ["Past attempts", "What was tried and why it fell short."],
        ["Decision process", "People, criteria, steps and date."],
        ["Fit and assumptions", "Why you may help and what remains unknown."],
        ["Next decision", "Owner, action and date."],
      ],
    },
    sources: [sources.asaBusiness],
  },
  {
    id: "ethical-follow-up-crm",
    title: "Ethical Follow-Up and CRM Discipline",
    category: "Business",
    type: "Protocol",
    level: "Core",
    minutes: 12,
    summary: "Follow up with relevance, permission and clean records instead of pressure or automated noise.",
    outcome: "A compliant follow-up sequence and a CRM people can trust.",
    safety: "Direct-marketing rules vary by recipient, channel and jurisdiction. This guide is operational education, not legal advice.",
    sections: [
      {
        heading: "Every follow-up must earn its place",
        body: [
          "A useful follow-up adds context, answers a decision question or confirms an agreed next step. Repeating 'just checking in' transfers the work to the buyer and weakens trust.",
        ],
        bullets: [
          "Reference the relevant conversation or stated priority.",
          "Add one useful observation, answer or asset.",
          "Ask one clear question connected to a decision.",
          "Make it easy to decline or change timing.",
          "Stop when relevance or permission ends.",
        ],
      },
      {
        heading: "Choose the sequence from the situation",
        table: {
          headers: ["Situation", "Appropriate follow-up"],
          rows: [
            ["Agreed action", "Confirm owner and date immediately"],
            ["Proposal under review", "Address the stated criterion before the decision date"],
            ["Timing not right", "Record the trigger and contact only at the agreed point"],
            ["No response to relevant outreach", "A small number of spaced attempts, then close"],
            ["Explicit objection or opt-out", "Record and stop the affected marketing"],
          ],
        },
      },
      {
        heading: "Keep a trustworthy CRM",
        bullets: [
          "Record source, date and reason for holding contact data.",
          "Store facts separately from assumptions.",
          "Log the last meaningful interaction and next buyer event.",
          "Restrict sensitive notes and avoid unnecessary personal information.",
          "Correct inaccurate data and apply retention rules.",
          "Record objections and suppression preferences so they are respected across tools.",
        ],
      },
      {
        heading: "Understand the compliance boundary",
        body: [
          "UK direct marketing can involve both data-protection law and PECR. The correct basis depends on who you contact, how you contact them and what they were told. Legitimate interests is not a blanket permission: the purpose must be legitimate, the processing necessary and the person's rights balanced.",
          "Automated tools do not remove responsibility. Before launching a sequence, confirm the source of data, lawful route, required notices, opt-out mechanism and suppression process.",
        ],
      },
      {
        heading: "Close the loop respectfully",
        body: [
          "A clean close protects both attention and forecast accuracy. State that you will close the thread, leave a useful route back and update the CRM. Do not create false scarcity or imply consequences that are not real.",
        ],
      },
    ],
    checklist: [
      "There is a relevant reason to contact this person.",
      "The message adds value or advances an agreed decision.",
      "The channel and data use follow applicable rules.",
      "The opt-out path is visible and respected.",
      "CRM notes are factual, minimal and access-controlled.",
      "The sequence has a stop condition.",
    ],
    template: {
      title: "Follow-up message builder",
      intro: "Use this structure; do not copy it without adapting to the actual conversation.",
      fields: [
        ["Context", "The relevant prior event or stated priority."],
        ["Useful addition", "One answer, observation, introduction or asset."],
        ["Decision question", "The one question that clarifies the next step."],
        ["Easy exit", "A respectful way to decline or change timing."],
        ["CRM update", "Fact, next event, date and contact preference."],
      ],
    },
    sources: [sources.icoMarketing, sources.asaBusiness],
  },
  {
    id: "thirteen-week-cash-control",
    title: "13-Week Cash Control",
    category: "Business",
    type: "Finance system",
    level: "Core",
    minutes: 16,
    summary: "See cash timing early enough to make decisions before a shortage becomes an emergency.",
    outcome: "A rolling 13-week cash forecast, decision thresholds and a weekly cash routine.",
    safety: "Use qualified accounting, tax and legal advice for your business. This system is a management aid, not a substitute for statutory accounts.",
    sections: [
      {
        heading: "Profit is not cash",
        body: [
          "A profitable sale does not help today's bank balance if the customer pays in 60 days and costs are due now. Cash control tracks when money actually enters and leaves the bank.",
          "Thirteen weeks is long enough to expose pressure and short enough to update from real operating detail.",
        ],
      },
      {
        heading: "Build the forecast",
        steps: [
          "Enter the opening available bank balance.",
          "List expected customer receipts by the week cash is realistically due.",
          "List payroll, tax, suppliers, debt, software, rent and other payments by actual payment week.",
          "Calculate weekly net movement and closing balance.",
          "Carry each closing balance into the next week's opening balance.",
          "Separate confirmed, likely and speculative receipts rather than treating them equally.",
        ],
      },
      {
        heading: "Use clear categories",
        table: {
          headers: ["Category", "Examples", "Control question"],
          rows: [
            ["Operating inflow", "Customer receipts, retainers", "What evidence supports the timing?"],
            ["Essential outflow", "Payroll, tax, critical suppliers", "What cannot move without damage?"],
            ["Committed outflow", "Contracts, debt, approved spend", "Can terms be renegotiated early?"],
            ["Discretionary outflow", "Experiments, upgrades, travel", "What result justifies this now?"],
            ["Reserve", "Contingency, tax held aside", "Is this genuinely available?"],
          ],
        },
      },
      {
        heading: "Set decision thresholds",
        body: [
          "Choose thresholds before cash becomes emotional. Examples include a minimum unrestricted balance, a minimum number of payroll cycles covered or a date by which overdue debt must be resolved.",
        ],
        bullets: [
          "Green: forecast remains above the operating floor.",
          "Amber: one credible downside moves cash below the floor; pause discretionary spend and accelerate collections.",
          "Red: forecast crosses the floor; involve the appropriate accountant, lender or adviser early and use a documented action plan.",
        ],
      },
      {
        heading: "Run the weekly cash meeting",
        bullets: [
          "Replace last week's forecast with actual bank movement.",
          "Challenge changed receipt dates with evidence.",
          "Review overdue invoices and named collection actions.",
          "Review the next four weeks line by line.",
          "Run a downside case on uncertain revenue.",
          "Make and record spend, collection or funding decisions.",
        ],
      },
    ],
    checklist: [
      "The opening bank balance matches reality.",
      "Receipts use realistic cash dates.",
      "Tax and restricted reserves are not treated as free cash.",
      "All material outflows have an owner and date.",
      "A downside case is visible.",
      "Decision thresholds and actions are agreed.",
      "Forecast versus actual is updated every week.",
    ],
    template: {
      title: "Weekly cash control sheet",
      intro: "Maintain one rolling version and extend it by one week after each review.",
      fields: [
        ["Opening available cash", "Bank balance excluding restricted or reserved amounts."],
        ["Receipts by week", "Customer, amount, evidence and confidence."],
        ["Payments by week", "Payee, amount, due date and category."],
        ["Closing cash", "Opening plus inflows less outflows."],
        ["Operating floor", "Threshold and reason."],
        ["Downside case", "Late receipts, lower sales or unexpected costs."],
        ["Actions", "Owner, decision, amount and deadline."],
      ],
    },
    sources: [sources.businessCashFlow, sources.govBusinessPlan],
  },
  {
    id: "founder-weekly-scorecard",
    title: "Founder Weekly Scorecard",
    category: "Business",
    type: "Template",
    level: "Core",
    minutes: 10,
    summary: "Run the business from a small set of connected numbers and decisions instead of a wall of vanity metrics.",
    outcome: "A one-page commercial and operating scorecard.",
    sections: [
      {
        heading: "A scorecard should change behaviour",
        body: [
          "Track only measures that help you notice a constraint, test an assumption or make a decision. A large dashboard can feel rigorous while hiding the few numbers that matter.",
          "Pair lag measures, which describe results, with lead measures, which describe controllable activity and quality.",
        ],
      },
      {
        heading: "Use five views",
        table: {
          headers: ["View", "Lag measure", "Lead or quality measure"],
          rows: [
            ["Demand", "Qualified pipeline created", "Qualified conversations"],
            ["Sales", "Won revenue and win rate", "Decision-stage opportunities"],
            ["Delivery", "Accepted outcomes and margin", "Milestones on time"],
            ["Cash", "Closing available cash", "Overdue receipts and 13-week low point"],
            ["Capacity", "Delivery load and founder hours", "Protected focus blocks and bottlenecks"],
          ],
        },
      },
      {
        heading: "Define every measure",
        bullets: [
          "Name: one unambiguous label.",
          "Definition: exactly what is included and excluded.",
          "Source: the system or record that owns the number.",
          "Owner: one person accountable for accuracy and action.",
          "Cadence: when it is updated.",
          "Threshold: the value that triggers a decision.",
        ],
      },
      {
        heading: "Read the chain, not isolated numbers",
        body: [
          "A low revenue week may be caused by weak demand six weeks earlier, poor qualification, slow decisions or delivery capacity. Follow the chain before prescribing more activity.",
          "Write one sentence each week: 'The current constraint is X, supported by Y, so this week we will Z.'",
        ],
      },
      {
        heading: "Hold a 25-minute meeting",
        steps: [
          "Confirm data quality and record the numbers.",
          "Mark exceptions against thresholds.",
          "Diagnose the single most important constraint.",
          "Review last week's actions and evidence.",
          "Assign no more than three new decisions with owners and dates.",
        ],
      },
    ],
    checklist: [
      "Every measure has a definition and source.",
      "Lead, quality and result measures are connected.",
      "Thresholds trigger specific decisions.",
      "The main constraint is written in one sentence.",
      "Actions have one owner and date.",
      "Vanity metrics that change no decision are removed.",
    ],
    template: {
      title: "One-page founder scorecard",
      intro: "Use weekly values, a four-week trend and one short note per exception.",
      fields: [
        ["Demand", "Qualified pipeline, conversations and source."],
        ["Sales", "Won, lost, stage movement and decision dates."],
        ["Delivery", "Milestones, quality, margin and risks."],
        ["Cash", "Available balance, 13-week low and overdue receipts."],
        ["Capacity", "Load, focus time and current bottleneck."],
        ["Constraint statement", "X is limiting Y, evidenced by Z."],
        ["Three decisions", "Owner, action and date."],
      ],
    },
    sources: [sources.govBusinessPlan, sources.businessCashFlow],
  },
  {
    id: "trading-risk-constitution",
    title: "The Trading Risk Constitution",
    category: "Trading",
    type: "Risk protocol",
    level: "Core",
    minutes: 16,
    featured: true,
    summary: "Define risk limits, approved conditions and automatic stop rules before money and emotion are involved.",
    outcome: "A signed personal risk policy that governs every session.",
    safety: "Educational content only, not financial advice or a recommendation to trade. Leveraged products are high risk; losses can be rapid and may exceed expectations. Use an appropriately regulated provider and only risk capital you can afford to lose.",
    sections: [
      {
        heading: "Survival comes before opportunity",
        body: [
          "A trading plan is incomplete until it states how much can be lost, when trading must stop and which conditions are allowed. The constitution exists to make those decisions while calm.",
          "No risk rule creates a profitable edge. It only limits how much a weak edge, execution error or abnormal event can damage you.",
        ],
      },
      {
        heading: "Define risk at four levels",
        table: {
          headers: ["Level", "Decision to define"],
          rows: [
            ["Trade", "Maximum planned loss including realistic costs and slippage"],
            ["Open portfolio", "Maximum combined risk across correlated positions"],
            ["Day / session", "Loss or rule breach that ends the session"],
            ["Drawdown", "Account decline that reduces size or pauses live trading"],
          ],
        },
        body: [
          "Choose limits from your financial situation, experience, product and tested strategy. A percentage copied from someone else is not a risk assessment. Zero live risk is a valid choice while learning or when conditions are unclear.",
        ],
      },
      {
        heading: "Approve the conditions",
        bullets: [
          "Markets, instruments and sessions you understand.",
          "Setup definition and required context.",
          "Minimum liquidity or spread conditions.",
          "News or event restrictions.",
          "Maximum simultaneous and correlated positions.",
          "Approved order types and platform procedures.",
          "Conditions that require simulation instead of live execution.",
        ],
      },
      {
        heading: "Use automatic stop rules",
        bullets: [
          "The daily loss limit is reached.",
          "A risk rule is intentionally broken.",
          "Platform, price feed or connectivity is unreliable.",
          "You cannot state the setup and invalidation before entry.",
          "Fatigue, anger, urgency or loss-chasing is affecting decisions.",
          "Market behaviour is outside the strategy's tested conditions.",
        ],
        callout: {
          label: "Non-negotiable",
          text: "A stop rule ends live trading. It does not create permission to switch instruments, accounts or platforms to continue.",
        },
      },
      {
        heading: "Control changes",
        body: [
          "Never loosen a rule during an open position or immediately after a loss. Propose changes in writing, support them with reviewed evidence and apply them only from a future date. Material size increases should be earned through a sufficient sample of compliant execution, not a short winning run.",
        ],
      },
    ],
    checklist: [
      "Maximum trade, portfolio, session and drawdown risk are written.",
      "Approved instruments, sessions and setups are defined.",
      "Correlation and event risk are addressed.",
      "Automatic stop-trading conditions are explicit.",
      "Platform failure and emergency actions are known.",
      "Rule changes require evidence and a cooling-off period.",
      "The constitution is visible before every live session.",
    ],
    template: {
      title: "Personal risk constitution",
      intro: "Complete this while calm. If any field is unclear, do not trade live.",
      fields: [
        ["Capital boundary", "Capital allocated, source and amount that can be lost without harming obligations."],
        ["Risk limits", "Per trade, combined open risk, day/session and total drawdown."],
        ["Approved conditions", "Instruments, sessions, setups, liquidity and event rules."],
        ["Prohibited actions", "Averaging, moving stops, revenge trading, unplanned leverage or other boundaries."],
        ["Automatic stop rules", "The exact event and required response."],
        ["Emergency procedure", "Platform, internet, order or data failure response."],
        ["Change control", "Evidence, review period and date required before a rule changes."],
        ["Review and signature", "Next review date and personal confirmation."],
      ],
    },
    sources: [sources.fcaCfd, sources.cftcForex, sources.cmeRiskPlan],
  },
  {
    id: "position-sizing-invalidation",
    title: "Position Sizing From Invalidation",
    category: "Trading",
    type: "Technical guide",
    level: "Core",
    minutes: 14,
    summary: "Calculate size from a valid exit point and a fixed risk budget instead of choosing size first.",
    outcome: "A repeatable sizing calculation with costs, gaps and product value checked.",
    safety: "Examples are for education only. Contract values, margin rules, currency conversion and loss exposure differ by product and provider; verify them independently before placing any order.",
    sections: [
      {
        heading: "The sequence matters",
        steps: [
          "Define the trade idea and the price condition that proves it wrong.",
          "Measure the distance from planned entry to protective exit.",
          "Choose the maximum cash risk allowed by the constitution.",
          "Convert price movement into cash loss per unit or contract.",
          "Calculate size, round down to a valid tradable amount and recheck total risk.",
        ],
        callout: {
          label: "Core formula",
          text: "Position size = maximum cash risk / risk per unit. Risk per unit must include the distance to invalidation and the instrument's value per point, plus a realistic allowance for costs and slippage.",
        },
      },
      {
        heading: "Worked example",
        body: [
          "Assume an educational example with a maximum cash risk of GBP 50. Entry is 125.00 and the protective exit is 123.00, a distance of GBP 2 per share. Ignoring costs, GBP 50 divided by GBP 2 equals 25 shares. If fees and a slippage allowance add GBP 0.20 per share, risk per share becomes GBP 2.20 and calculated size falls to 22.72, which must be rounded down to a valid size.",
          "This arithmetic does not make the trade suitable or guarantee the exit price. Gaps, fast markets and order behaviour can produce a larger loss.",
        ],
      },
      {
        heading: "Do not move invalidation to fit size",
        body: [
          "The invalidation belongs to the market idea. If the correct exit creates a position below the platform minimum or a loss larger than allowed, the answer is smaller size or no trade. Tightening the exit only to increase size changes the strategy.",
        ],
      },
      {
        heading: "Check the hidden inputs",
        bullets: [
          "Point, pip, tick or contract value.",
          "Account and instrument currency conversion.",
          "Spread, commissions, financing and other charges.",
          "Minimum order size and rounding increment.",
          "Gap, liquidity and news risk.",
          "Existing correlated positions and combined exposure.",
          "Whether a stop order can execute away from its trigger.",
        ],
      },
      {
        heading: "Recalculate before every order",
        body: [
          "Saved size can become dangerous when the entry, exit distance, volatility, contract specification or account value changes. Record the planned and actual risk so review is based on reality.",
        ],
      },
    ],
    checklist: [
      "The invalidation is based on the trade idea.",
      "Maximum cash risk is within the constitution.",
      "Product value and currency conversion are verified.",
      "Costs and slippage allowance are included.",
      "Size is rounded down, never up.",
      "Combined correlated risk remains within limits.",
      "A worse-than-planned exit can be financially tolerated.",
    ],
    template: {
      title: "Position size worksheet",
      intro: "Complete before sending an order; keep the calculation with the journal entry.",
      fields: [
        ["Entry and invalidation", "Planned prices and the market reason for the exit."],
        ["Maximum cash risk", "Amount permitted by the risk constitution."],
        ["Distance", "Absolute entry-to-exit distance."],
        ["Value per point / unit", "Verified product specification and currency."],
        ["Costs and slippage", "Commission, spread and realistic execution allowance."],
        ["Raw and rounded size", "Calculation, valid increment and final size."],
        ["Combined exposure", "Risk added to correlated open positions."],
      ],
    },
    sources: [sources.cmePosition, sources.investorOrders, sources.cftcForex],
  },
  {
    id: "pre-trade-execution-checklist",
    title: "Pre-Trade Planning and Execution",
    category: "Trading",
    type: "Checklist",
    level: "Core",
    minutes: 12,
    summary: "Move from a written idea to an order only when context, invalidation, size and operational risk are clear.",
    outcome: "A complete pre-trade ticket and a controlled execution process.",
    safety: "Educational content only. No checklist removes market, counterparty, leverage, liquidity or technology risk.",
    sections: [
      {
        heading: "Write the idea before the order",
        body: [
          "The plan must be specific enough that another disciplined trader could tell whether you followed it. 'Looks strong' is not a setup. State the context, trigger, invalidation and conditions that cancel the idea before entry.",
        ],
      },
      {
        heading: "The pre-trade gate",
        bullets: [
          "The instrument and session are approved.",
          "The setup matches a written playbook.",
          "The trigger has occurred; anticipation is explicitly allowed or the trade waits.",
          "Invalidation is based on the market idea.",
          "Size is calculated from risk, including costs.",
          "Relevant scheduled events and liquidity conditions are checked.",
          "Combined exposure and correlation remain within limits.",
          "Order type and failure procedure are understood.",
          "Physical and emotional state is fit for execution.",
        ],
      },
      {
        heading: "Understand order behaviour",
        body: [
          "A stop order generally becomes a market order when triggered, so the execution price can differ from the stop price. A stop-limit order controls price differently but may not execute. Definitions and trigger methods vary by venue and broker.",
          "Confirm how the chosen provider handles stop triggers, gaps, partial fills, rejected orders and market closures. Never learn emergency controls during the emergency.",
        ],
      },
      {
        heading: "During the trade",
        bullets: [
          "Do not widen risk because the position is losing.",
          "Do not add unless the add-on condition and total risk were planned.",
          "Record platform or execution anomalies immediately.",
          "Follow the planned management rule; do not optimise each fluctuation.",
          "If operational information is unreliable, use the emergency procedure.",
        ],
      },
      {
        heading: "After the trade",
        body: [
          "Capture the order, fills, costs, screenshots and rule adherence while the details are available. Separate outcome from quality: a losing trade can be compliant and a winning trade can be a serious breach.",
        ],
      },
    ],
    checklist: [
      "Context, setup, trigger and cancellation are written.",
      "Invalidation and size pass the risk constitution.",
      "Event, spread, liquidity and correlation are checked.",
      "Order behaviour and emergency controls are understood.",
      "No unplanned management decision is required.",
      "The record will capture fills, costs and adherence.",
    ],
    template: {
      title: "Pre-trade ticket",
      intro: "If a required field cannot be completed, the order does not proceed.",
      fields: [
        ["Context", "Market state and why this playbook may apply."],
        ["Setup and trigger", "Exact conditions required for entry."],
        ["Invalidation", "Price and reason the idea is wrong."],
        ["Cancellation", "Conditions that cancel the order before entry."],
        ["Risk and size", "Cash risk, calculation, costs and combined exposure."],
        ["Execution", "Order type, venue, event and liquidity checks."],
        ["Management", "Planned actions after entry."],
        ["State check", "Fit to trade: yes or no, with reason."],
      ],
    },
    sources: [sources.investorOrders, sources.cmeRiskPlan, sources.fcaCfd],
  },
  {
    id: "trading-journal-review",
    title: "Trading Journal and Review System",
    category: "Trading",
    type: "Review system",
    level: "Core",
    minutes: 15,
    summary: "Record decisions and adherence so a strategy can be reviewed without confusing luck with skill.",
    outcome: "A consistent trade record, weekly process review and sample-based playbook decisions.",
    safety: "Historical results and journal statistics do not guarantee future performance. Costs, changing conditions and selection bias can materially alter results.",
    sections: [
      {
        heading: "Journal the decision process",
        body: [
          "Profit and loss alone cannot tell you whether a decision was good. The journal should preserve what was known, planned and felt at the time, not a hindsight story written after the outcome.",
        ],
      },
      {
        heading: "Capture four evidence groups",
        table: {
          headers: ["Group", "Record"],
          rows: [
            ["Plan", "Context, setup, trigger, invalidation, target or management, planned risk"],
            ["Execution", "Orders, timestamps, fills, costs, slippage and platform issues"],
            ["Process", "Rules followed, deviations, state and decision notes"],
            ["Outcome", "Cash and R result, maximum favourable/adverse movement, screenshots"],
          ],
        },
      },
      {
        heading: "Grade adherence separately",
        bullets: [
          "A: setup and execution followed the written plan.",
          "B: minor deviation with no increase in risk; cause documented.",
          "C: material deviation, unplanned action or incomplete preparation.",
          "Breach: intentional violation of a risk or stop rule.",
        ],
        body: [
          "Do not let a profitable breach receive a high grade. Rewarding the outcome teaches the wrong behaviour.",
        ],
      },
      {
        heading: "Review weekly",
        steps: [
          "Confirm all trades are logged and reconciled to platform records.",
          "Calculate results after all costs.",
          "Group trades by playbook, market condition and adherence grade.",
          "Review every deviation and repeated operational issue.",
          "Choose one execution focus for the next week.",
          "Do not change a strategy from a handful of trades unless the issue is a safety breach.",
        ],
      },
      {
        heading: "Review the playbook by sample",
        body: [
          "When enough consistent observations exist, review expectancy, distribution, drawdown, costs and performance by condition. Include all eligible trades, not only memorable examples. Changes should be defined before testing and dated in the journal.",
        ],
        callout: {
          label: "Decision hierarchy",
          text: "First protect safety. Then improve adherence. Only then decide whether the playbook itself needs changing.",
        },
      },
    ],
    checklist: [
      "The journal records what was known before entry.",
      "All orders, fills and costs are reconciled.",
      "Adherence is graded independently of profit.",
      "Deviations have a cause and corrective action.",
      "Reviews group comparable trades.",
      "Playbook changes use a defined sample and future effective date.",
      "Sensitive financial records remain private by default.",
    ],
    template: {
      title: "Trade journal entry",
      intro: "Complete the plan before entry and the execution record immediately after exit.",
      fields: [
        ["Playbook and context", "Named setup and market condition."],
        ["Plan", "Trigger, invalidation, management and cancellation."],
        ["Risk", "Planned cash/R risk, size and combined exposure."],
        ["Execution", "Orders, fills, time, spread, commission and slippage."],
        ["State", "Energy, emotion and any pressure noticed."],
        ["Outcome", "Net P/L, R result and screenshots."],
        ["Adherence grade", "A, B, C or breach, with evidence."],
        ["Lesson and action", "One specific adjustment or 'no change'."],
      ],
    },
    sources: [sources.cmeRiskPlan, sources.fcaCfd],
  },
  {
    id: "drawdown-stop-trading",
    title: "Drawdown and Stop-Trading Protocol",
    category: "Trading",
    type: "Safety protocol",
    level: "Core",
    minutes: 13,
    summary: "Respond to losses with pre-agreed reductions, diagnosis and a controlled route back to live risk.",
    outcome: "A drawdown ladder with automatic actions and re-entry criteria.",
    safety: "Drawdown limits do not prevent further loss. If trading affects essential finances, health or behaviour, stop and seek appropriate professional support.",
    sections: [
      {
        heading: "Drawdown changes the job",
        body: [
          "During a drawdown, the priority moves from earning to preserving capital and information. Increasing size to recover faster increases the chance of deeper loss and makes diagnosis harder.",
        ],
      },
      {
        heading: "Create a ladder before losses",
        table: {
          headers: ["State", "Example action framework"],
          rows: [
            ["Normal", "Trade only approved playbooks within standard limits"],
            ["Caution", "Reduce size, narrow playbooks and increase review"],
            ["Pause", "No live trading; reconcile records and diagnose"],
            ["Rebuild", "Simulation or minimum size with explicit evidence gates"],
          ],
        },
        body: [
          "Choose your own numerical triggers from capital, product risk and tested strategy. The actions should be automatic once a trigger is reached.",
        ],
      },
      {
        heading: "Diagnose in order",
        steps: [
          "Reconcile every fill, fee and balance with the provider.",
          "Check for risk breaches, size errors and operational failures.",
          "Separate compliant trades from deviations.",
          "Compare current market conditions with the playbook's tested conditions.",
          "Review whether expected costs, frequency or correlations changed.",
          "Only after adherence and data quality are clear, assess whether the edge may have degraded.",
        ],
      },
      {
        heading: "Use a return-to-risk gate",
        bullets: [
          "The cause or uncertainty is documented.",
          "All risk and operational breaches have corrective controls.",
          "A defined sample in simulation or reduced size meets adherence criteria.",
          "The constitution and playbook are current.",
          "Size resumes in steps, not in one jump.",
          "Any new breach returns the process to pause.",
        ],
      },
      {
        heading: "Protect life outside the account",
        body: [
          "Trading capital must remain separate from money needed for housing, bills, tax, emergency savings or other obligations. Secrecy, borrowing to trade, chasing losses or inability to stop are reasons to cease live trading and seek independent support.",
        ],
      },
    ],
    checklist: [
      "Numerical drawdown triggers are written privately.",
      "Each trigger has an automatic action.",
      "Losses are reconciled before strategy conclusions.",
      "Adherence and market condition are analysed separately.",
      "Return criteria require evidence and staged size.",
      "Essential finances are protected from trading capital.",
    ],
    template: {
      title: "Drawdown response plan",
      intro: "Write this when the account is stable, then follow it without negotiation.",
      fields: [
        ["Reference equity", "How the drawdown starting point is defined."],
        ["Caution trigger and action", "Threshold, size reduction and review cadence."],
        ["Pause trigger and action", "Threshold and immediate shutdown procedure."],
        ["Diagnosis", "Data, adherence, market and operational checks."],
        ["Rebuild evidence", "Simulation or minimum-size sample and adherence standard."],
        ["Size ladder", "Stages, limits and minimum review period."],
        ["External boundary", "Essential-money rule and person to contact if control slips."],
      ],
    },
    sources: [sources.fcaCfd, sources.cftcForex, sources.cmeRiskPlan],
  },
  {
    id: "trading-network-compliance",
    title: "Trading Content and Network Standard",
    category: "Trading",
    type: "Network policy",
    level: "Core",
    minutes: 11,
    summary: "Share trading education and review responsibly without turning the network into a signal room or financial promotion funnel.",
    outcome: "A clear publishing and moderation standard for trading rooms.",
    safety: "Financial promotion and regulated-activity rules are fact-specific. Obtain qualified advice before promoting financial products, providers or investments.",
    sections: [
      {
        heading: "The room is for process",
        body: [
          "Motion Only trading spaces exist for education, planning, risk review and honest post-trade learning. They are not signal services, copy-trading groups or places to recruit members into financial products.",
        ],
      },
      {
        heading: "Allowed contribution",
        bullets: [
          "A delayed or clearly educational setup review with context and invalidation.",
          "A risk, execution or journaling question.",
          "A post-trade review showing both positive and negative outcomes.",
          "A platform or product question without referral pressure.",
          "General education with sources, assumptions and limitations.",
        ],
      },
      {
        heading: "Not allowed",
        bullets: [
          "Live 'buy now' or 'sell now' instructions.",
          "Guaranteed returns, income claims or 'low-risk' language for high-risk products.",
          "Unbalanced profit screenshots or selective performance claims.",
          "Undisclosed affiliate links, commissions, gifts or commercial relationships.",
          "Pressure to deposit, borrow, copy a position or move to a private paid channel.",
          "Impersonation, fake testimonials or claims of regulatory approval.",
        ],
      },
      {
        heading: "Use a responsible post structure",
        steps: [
          "State the educational purpose and whether the position is live, closed or simulated.",
          "Name the market context and what would invalidate the idea.",
          "State material risks, uncertainty and relevant costs.",
          "Disclose commercial relationships or incentives prominently.",
          "Avoid language that a reasonable reader could interpret as a personal recommendation.",
          "Do not use risk warnings to excuse an otherwise misleading message.",
        ],
      },
      {
        heading: "Moderate for the likely impression",
        body: [
          "UK financial promotions must be fair, clear and not misleading, and unauthorised promotion of regulated products can breach the law. Review the overall impression of the words, images, urgency, testimonials and missing information, not just whether a disclaimer appears.",
        ],
      },
    ],
    checklist: [
      "The content teaches process rather than directing a trade.",
      "Material risk and uncertainty are visible.",
      "Performance is not cherry-picked or guaranteed.",
      "Commercial interests are disclosed prominently.",
      "No deposit, referral or private-channel pressure is used.",
      "A moderator can remove the content if the likely impression is unsafe or misleading.",
    ],
    template: {
      title: "Responsible trading post",
      intro: "Use for education and review. Do not post live instructions.",
      fields: [
        ["Purpose and status", "Educational, delayed review, closed trade or simulation."],
        ["Context", "The market condition and playbook being discussed."],
        ["Invalidation and risk", "What could make the idea wrong and why loss is possible."],
        ["Evidence", "Complete, non-selective record with relevant costs."],
        ["Commercial disclosure", "Any affiliate, provider or compensation relationship."],
        ["Question", "The process or learning question for the room."],
      ],
    },
    sources: [sources.fcaFinfluencers, sources.fcaCfd, sources.cftcForex],
  },
  {
    id: "twelve-week-strength-block",
    title: "12-Week Strength and Conditioning Block",
    category: "Fitness",
    type: "Programme",
    level: "Intermediate",
    minutes: 20,
    featured: true,
    summary: "A three-day strength programme with two scalable conditioning sessions, simple progression and planned recovery.",
    outcome: "A complete 12-week training structure that prioritises consistency, strength and durable capacity.",
    safety: "This general programme assumes a healthy adult with competent exercise technique. It is not medical advice. Get appropriate clinical or coaching support for injury, illness, pregnancy, unexplained symptoms or unfamiliar lifts. Stop for chest pain, fainting, severe shortness of breath or acute pain.",
    sections: [
      {
        heading: "Programme structure",
        body: [
          "Train strength on three non-consecutive days and add up to two conditioning sessions around your current capacity. Leave at least one low-load or rest day each week. The programme uses repetitions in reserve (RIR): 2 RIR means you finish the set believing two clean repetitions remained.",
          "Weeks 1 to 3 build volume and technique. Week 4 reduces fatigue. Weeks 5 to 7 build strength. Week 8 reduces fatigue. Weeks 9 to 11 practise heavier, lower-repetition work without grinding. Week 12 consolidates or tests a safe rep best.",
        ],
      },
      {
        heading: "Weekly schedule",
        table: {
          headers: ["Day", "Session", "Purpose"],
          rows: [
            ["Monday", "Strength A", "Squat pattern, horizontal press, row"],
            ["Tuesday", "Easy conditioning", "Conversational aerobic work"],
            ["Wednesday", "Strength B", "Hinge, vertical press, pull"],
            ["Thursday", "Recovery", "Walking, mobility or full rest"],
            ["Friday", "Strength C", "Single-leg, press, posterior chain"],
            ["Saturday", "Optional intervals", "Short controlled high-intensity work"],
            ["Sunday", "Rest and review", "Recovery, planning and log completion"],
          ],
        },
      },
      {
        heading: "Strength sessions",
        table: {
          headers: ["Session", "Main work", "Assistance"],
          rows: [
            ["A", "Back or front squat; bench press", "Chest-supported row; split squat; trunk"],
            ["B", "Deadlift or trap-bar deadlift; overhead press", "Pull-up or pulldown; hamstring curl; carry"],
            ["C", "Romanian deadlift; incline or close-grip press", "Front-foot elevated split squat; cable row; trunk"],
          ],
        },
        body: [
          "Use 2 to 4 work sets per movement. In weeks 1 to 3, main lifts use 5 to 8 repetitions at about 2 to 3 RIR. In weeks 5 to 7, use 3 to 6 repetitions at about 2 RIR. In weeks 9 to 11, use 2 to 5 repetitions at 1 to 2 RIR. Assistance work generally stays at 6 to 15 repetitions with controlled technique.",
        ],
      },
      {
        heading: "Conditioning",
        bullets: [
          "Easy session: begin with 25 to 40 minutes at a pace where conversation remains possible.",
          "Interval session: after a progressive warm-up, use 6 rounds of 60 seconds hard but controlled and 120 seconds easy.",
          "Choose low-skill modes such as cycling, incline walking, rowing or a familiar run route.",
          "Add duration gradually before adding more intensity.",
          "If conditioning damages strength-session quality or recovery, reduce it.",
        ],
      },
      {
        heading: "Progression and deloads",
        steps: [
          "Choose a starting load that leaves the required repetitions in reserve.",
          "When all sets reach the top of the rep range with clean technique and target RIR, add the smallest practical load next time.",
          "If the same lift misses its target twice, reduce load by about 5 to 10 percent and rebuild.",
          "In weeks 4 and 8, keep movement patterns but perform roughly half to two-thirds of normal work with easier loads.",
          "In week 12, either repeat a strong week at lower volume or test a technically sound rep best; a one-repetition maximum is not required.",
        ],
      },
      {
        heading: "Minimum effective week",
        body: [
          "When life is constrained, complete two full-body sessions and one easy conditioning session. Keep the main movement patterns, perform two work sets each and stop with two or more repetitions in reserve. A reduced week protects continuity without pretending fatigue is irrelevant.",
        ],
      },
    ],
    checklist: [
      "Health and technique are appropriate for the selected movements.",
      "Three strength sessions are separated across the week.",
      "Starting loads leave the planned repetitions in reserve.",
      "Progression follows performance, not ego.",
      "Weeks 4 and 8 reduce fatigue.",
      "Conditioning supports rather than ruins strength quality.",
      "Pain and unusual symptoms are acted on, not trained through.",
    ],
    template: {
      title: "12-week programme setup",
      intro: "Adapt exercise variants to equipment, skill and health while keeping the movement pattern.",
      fields: [
        ["Primary outcome", "Strength, capacity or consistency result for week 12."],
        ["Baseline", "Current lifts, conditioning and weekly training frequency."],
        ["Exercise variants", "Squat, hinge, press, pull, single-leg and trunk choices."],
        ["Weekly calendar", "Three strength, conditioning and recovery days."],
        ["Starting loads", "Sets, reps and target RIR for each movement."],
        ["Progression rule", "The exact standard required before adding load."],
        ["Minimum week", "Two-session fallback and easy conditioning option."],
        ["Review points", "End of weeks 3, 4, 7, 8 and 12."],
      ],
    },
    sources: [sources.ukActivity, sources.acsmStrength],
  },
  {
    id: "progressive-overload-without-ego",
    title: "Progressive Overload Without Ego",
    category: "Fitness",
    type: "Training guide",
    level: "Core",
    minutes: 12,
    summary: "Progress training through repeatable quality, volume and load rather than constant max-effort sessions.",
    outcome: "A progression rule for every main lift and a clear response to stalls.",
    safety: "Exercise selection and loading should match your experience, health and technique. Pain is not a progression target.",
    sections: [
      {
        heading: "What progression actually means",
        body: [
          "Progressive overload is a gradual increase in the demand your body can recover from. Load is only one variable. You can progress repetitions, sets, range of motion, control, technique, density or exercise difficulty.",
          "The best progression is the one you can measure and repeat without degrading the movement.",
        ],
      },
      {
        heading: "Use double progression",
        steps: [
          "Choose a repetition range, such as 6 to 8, and a target effort, such as 2 RIR.",
          "Use the same load until every work set reaches the top of the range with clean technique.",
          "Add the smallest practical load.",
          "Return to the lower end of the range and rebuild.",
          "If technique or effort exceeds the standard, keep or reduce the load.",
        ],
      },
      {
        heading: "Track enough to make decisions",
        bullets: [
          "Exercise and variation.",
          "Load, repetitions and work sets.",
          "Estimated repetitions in reserve.",
          "Technique note only when it changes a decision.",
          "Pain or unusual symptom.",
          "Sleep or fatigue flag when materially different.",
        ],
      },
      {
        heading: "Respond to a stall",
        table: {
          headers: ["Signal", "First response"],
          rows: [
            ["One poor session", "Repeat the plan; inspect sleep, food, stress and setup"],
            ["Two misses on the same lift", "Reduce 5 to 10 percent and rebuild"],
            ["Several lifts regress", "Reduce total fatigue and consider a deload"],
            ["Technique repeatedly breaks", "Change load, range or variation and get coaching"],
            ["Pain changes the movement", "Stop or modify and seek appropriate assessment"],
          ],
        },
      },
      {
        heading: "Keep hard work specific",
        body: [
          "Training to momentary failure is not required for most strength progress and adds fatigue. Most work should finish with repeatable technique and a small number of repetitions in reserve. Use true maximal efforts rarely and only when they serve a clear purpose.",
        ],
      },
    ],
    checklist: [
      "Every main lift has a rep range and target RIR.",
      "Load rises only after all sets meet the standard.",
      "Technique and range remain consistent.",
      "One poor session does not trigger a programme rewrite.",
      "Repeated regression prompts a fatigue review.",
      "Pain changes the plan.",
    ],
    template: {
      title: "Lift progression card",
      intro: "Use one card per main movement for the full training block.",
      fields: [
        ["Exercise and standard", "Variation, range and technique cues."],
        ["Working range", "Sets, lower and upper reps, target RIR."],
        ["Starting load", "A load that meets the standard now."],
        ["Increase rule", "Exact performance required before adding load."],
        ["Smallest increase", "Available plate, pin or dumbbell increment."],
        ["Regression rule", "What happens after repeated misses."],
        ["Pain or technique modification", "Approved alternative and escalation point."],
      ],
    },
    sources: [sources.acsmStrength],
  },
  {
    id: "durable-conditioning",
    title: "Conditioning for Durable Performance",
    category: "Fitness",
    type: "Training guide",
    level: "Core",
    minutes: 13,
    summary: "Build an aerobic base and a small dose of higher-intensity capacity without sacrificing strength or recovery.",
    outcome: "A scalable two-session conditioning week.",
    safety: "Increase activity gradually. People with medical conditions, symptoms or a long period of inactivity should use appropriate professional guidance before vigorous exercise.",
    sections: [
      {
        heading: "Build the base first",
        body: [
          "Most conditioning should be repeatable. Easy aerobic work builds capacity with a lower recovery cost than frequent maximal intervals. A practical field guide is the talk test: during moderate work you can speak in phrases; during vigorous work only a few words are comfortable.",
          "UK guidance for adults recommends activity every day, at least 150 minutes of moderate or 75 minutes of vigorous activity across a week, strength work on at least two days and less prolonged sedentary time. Build toward guidelines from your current level rather than forcing the full target immediately.",
        ],
      },
      {
        heading: "Two-session framework",
        table: {
          headers: ["Session", "Starting dose", "Progression"],
          rows: [
            ["Easy aerobic", "25 to 40 minutes conversational", "Add 5 minutes until 45 to 60 is comfortable"],
            ["Controlled intervals", "6 x 60 seconds hard / 120 seconds easy", "Add one round, then modestly lengthen work"],
          ],
        },
      },
      {
        heading: "Choose a mode you can execute safely",
        bullets: [
          "Walking or incline treadmill for low skill and easy recovery.",
          "Cycling for controllable intensity and lower impact.",
          "Rowing when technique is already competent.",
          "Running when current tissue tolerance supports it.",
          "Loaded carries or circuits as a supplement, not a substitute for clear intensity control.",
        ],
      },
      {
        heading: "Place it around strength",
        body: [
          "Keep hard intervals away from the most important lower-body strength session where possible. Easy work can often follow strength or sit on another day. If performance, sleep, soreness or motivation worsens across several sessions, reduce duration or intensity before adding more.",
        ],
      },
      {
        heading: "Progress one variable",
        body: [
          "Increase either duration, frequency or intensity at a time. Hold the new dose long enough to judge recovery. More suffering is not automatically more adaptation.",
        ],
      },
    ],
    checklist: [
      "The current activity baseline is honest.",
      "Most conditioning is repeatable and conversational.",
      "Vigorous work is introduced gradually.",
      "The mode matches skill and tissue tolerance.",
      "Hard conditioning does not repeatedly damage strength performance.",
      "Weekly volume progresses one variable at a time.",
    ],
    template: {
      title: "Conditioning week",
      intro: "Start below your maximum recoverable dose and build from completed weeks.",
      fields: [
        ["Current baseline", "Mode, frequency and comfortable duration."],
        ["Easy session", "Day, mode, duration and talk-test target."],
        ["Interval session", "Day, mode, work/rest and round count."],
        ["Placement", "Distance from key strength sessions."],
        ["Progression", "The one variable that may increase."],
        ["Recovery signals", "Performance, sleep, soreness and motivation."],
        ["Reduction rule", "What will be cut if recovery declines."],
      ],
    },
    sources: [sources.ukActivity],
  },
  {
    id: "recovery-sleep-fatigue",
    title: "Recovery, Sleep and Fatigue",
    category: "Fitness",
    type: "Recovery guide",
    level: "Core",
    minutes: 12,
    summary: "Use simple recovery signals and a stable sleep routine to adjust training before fatigue becomes a collapse.",
    outcome: "A personal recovery baseline, adjustment rule and sleep routine.",
    safety: "Persistent or unexplained fatigue, loud snoring or breathing interruption, significant mood change, weight change, pain or symptoms affecting daily life should be discussed with an appropriate healthcare professional.",
    sections: [
      {
        heading: "Recovery is part of training",
        body: [
          "Training provides a stimulus; adaptation depends on recovery. The goal is not to feel perfect every day. It is to notice when fatigue is normal, when load should change and when symptoms need proper assessment.",
        ],
      },
      {
        heading: "Track a small signal set",
        bullets: [
          "Sleep duration and whether it felt restorative.",
          "General energy and willingness to train.",
          "Soreness that changes movement.",
          "Performance on familiar warm-up loads.",
          "Unusual resting heart-rate trend if you already measure it reliably.",
          "Life stress or illness symptoms that materially change capacity.",
        ],
        body: [
          "Judge trends across several days, not a single number. Devices estimate recovery; they do not diagnose health or replace how performance and symptoms actually present.",
        ],
      },
      {
        heading: "Use a three-level adjustment",
        table: {
          headers: ["State", "Signs", "Training response"],
          rows: [
            ["Green", "Normal energy, warm-ups and soreness", "Run the plan"],
            ["Amber", "Several mild signals or clear life stress", "Keep movement; reduce load, sets or intensity"],
            ["Red", "Illness, acute pain, severe fatigue or abnormal symptoms", "Stop or replace training and seek appropriate help"],
          ],
        },
      },
      {
        heading: "Build a repeatable sleep opportunity",
        bullets: [
          "Keep sleep and wake times reasonably consistent.",
          "Aim for enough time in bed to meet your individual sleep need; the NHS suggests adults generally aim for 6 to 9 hours.",
          "Use a short wind-down routine and a dark, quiet, comfortable room.",
          "Avoid caffeine, intense exercise and bright screens close to bedtime when they disrupt sleep.",
          "Use daylight, movement and regular meals to support a stable daily rhythm.",
        ],
      },
      {
        heading: "Do not solve every problem with discipline",
        body: [
          "If fatigue persists for weeks, affects daily life or comes with other symptoms, seek assessment rather than adding more stimulants or forcing harder sessions. Recovery problems can have medical, psychological, nutritional, workload or sleep-related causes.",
        ],
      },
    ],
    checklist: [
      "A personal normal baseline is recorded.",
      "Trends use several signals, not one device score.",
      "Amber days have a pre-planned reduction.",
      "Red symptoms stop the session.",
      "Sleep opportunity and routine are protected.",
      "Persistent or unexplained fatigue is escalated appropriately.",
    ],
    template: {
      title: "Recovery decision card",
      intro: "Use a seven-day trend and keep the response proportionate.",
      fields: [
        ["Normal baseline", "Typical sleep, energy, soreness and warm-up performance."],
        ["Green response", "The normal training plan."],
        ["Amber triggers", "The combination of signals that reduces training."],
        ["Amber adjustment", "Load, volume, intensity or session change."],
        ["Red triggers", "Symptoms that stop training and require help."],
        ["Sleep routine", "Wind-down, sleep window and environment."],
        ["Review point", "When the plan returns to normal or escalates."],
      ],
    },
    sources: [sources.nhsFatigue, sources.ukActivity],
  },
  {
    id: "deload-testing-return",
    title: "Deload, Testing and Return-to-Training",
    category: "Fitness",
    type: "Protocol",
    level: "Intermediate",
    minutes: 14,
    summary: "Reduce fatigue, test progress safely and rebuild after interruption without trying to recover lost time in one week.",
    outcome: "A planned deload, a sensible test and a staged return route.",
    safety: "Return after injury, surgery or significant illness should follow the advice of the clinician responsible for your care. This guide addresses general training interruptions, not rehabilitation.",
    sections: [
      {
        heading: "A deload is a planned reduction",
        body: [
          "A deload keeps movement practice while reducing fatigue. It is useful at planned points in a demanding block or when several performance and recovery signals deteriorate together.",
        ],
        bullets: [
          "Reduce work sets by roughly one-third to one-half.",
          "Use easier loads and stay several repetitions from failure.",
          "Keep familiar movement patterns unless pain or technique requires a change.",
          "Reduce hard conditioning and maintain easy movement.",
          "Use the week to restore sleep, appetite and enthusiasm.",
        ],
      },
      {
        heading: "Test the quality you trained",
        body: [
          "A test should answer a question. If the block trained sets of five, a technically strong five-repetition best may be more useful than an unfamiliar one-repetition maximum. Conditioning can be tested with a repeatable route, duration or work-rate protocol.",
        ],
      },
      {
        heading: "Use testing guardrails",
        bullets: [
          "Standardise warm-up, equipment, range and technique.",
          "Choose the attempt plan before starting.",
          "Stop when technique or symptoms breach the standard.",
          "Keep at least one safe alternative, such as an estimated maximum from submaximal work.",
          "Record context so future comparisons are meaningful.",
        ],
      },
      {
        heading: "Return after a normal interruption",
        steps: [
          "For the first week back, use familiar exercises at clearly submaximal loads and about half to two-thirds of normal volume.",
          "Avoid testing, failure and a sudden jump in conditioning.",
          "Review soreness, symptoms and performance for 48 hours after sessions.",
          "Add volume first, then load, across several successful sessions.",
          "If pain, illness symptoms or abnormal fatigue persists, stop the progression and seek appropriate support.",
        ],
      },
      {
        heading: "Do not repay training debt",
        body: [
          "Missed sessions are gone. Cramming them into the next week raises fatigue without restoring the original adaptation. Resume from current capacity and rebuild.",
        ],
        callout: {
          label: "Return rule",
          text: "The first successful week back should feel deliberately easier than the last full week before the interruption.",
        },
      },
    ],
    checklist: [
      "The deload reduces volume and effort.",
      "Testing answers a specific question.",
      "Warm-up and technique are standardised.",
      "The test has a stop condition.",
      "The return begins below previous normal volume.",
      "Volume and load return across successful sessions.",
      "Clinical restrictions take priority over the programme.",
    ],
    template: {
      title: "Deload and return plan",
      intro: "Complete before the week starts so fatigue does not negotiate the plan session by session.",
      fields: [
        ["Reason", "Planned phase, fatigue trend or interruption."],
        ["Volume reduction", "Sets removed from each movement."],
        ["Intensity limit", "Load or RIR boundary."],
        ["Test question", "What the test should reveal, if testing."],
        ["Stop condition", "Technique, pain, symptom or effort boundary."],
        ["First week back", "Exercises, volume and intensity."],
        ["Progression gate", "Evidence required before adding work."],
      ],
    },
    sources: [sources.acsmStrength, sources.ukActivity, sources.nhsFatigue],
  },
];

const libraryExpansions = {
  "motion-only-operating-system": {
    "Choose fewer outcomes": [
      { label: "Weak version", title: "Too many directions", text: "Business growth, trading consistency, a physique goal, content growth, saving money and learning a new skill all compete for the same attention. Nothing gets enough pressure for long enough.", demo: "Better: choose one primary 12-week outcome, then let the other areas support it instead of fighting it." },
      { label: "Motion Only version", title: "One outcome with proof", text: "A useful outcome has a number, a deadline and a visible change. The member can tell whether it happened without explaining their effort.", demo: "Example: create a qualified £25,000 monthly pipeline by 30 September, measured by decision-maker conversations and written next steps." },
    ],
    "Score evidence, not emotion": [
      { label: "Application", title: "Separate mood from movement", text: "A bad mood does not cancel completed work. A confident mood does not prove progress. The scorecard protects you from both.", demo: "If you trained, sent the follow-ups and followed risk rules, the evidence stands even if the day felt messy." },
      { label: "Network use", title: "Ask for evidence-based feedback", text: "When sharing with another member, show the action, result and constraint. That invites better feedback than posting frustration or hype.", demo: "Instead of: 'Sales is dead.' Try: 'Sent 20 targeted messages, 3 replies, no booked calls. Here is the opener and audience. What would you change?'" },
    ],
  },
  "weekly-review-protocol": {
    "Part 1: collect the facts": [
      { label: "Example", title: "Facts before stories", text: "Write what happened before deciding what it means. This stops one rough day becoming a fake story about your discipline.", demo: "Fact: 2 of 3 sessions completed. Story to test: the missed session followed two late nights and no planned training time." },
      { label: "Evidence", title: "Keep the receipt", text: "The proof can be simple: calendar blocks, screenshots, journal entries, messages sent, workouts logged or CRM updates.", demo: "Do not over-document. Capture enough evidence to make the next decision cleaner." },
    ],
    "Part 3: make three decisions": [
      { label: "Decision", title: "Keep, change, stop", text: "The review should create decisions, not just reflection. Keep what worked, change one constraint and stop one leak.", demo: "Keep: morning planning. Change: sales calls before admin. Stop: checking charts outside planned trading windows." },
      { label: "Avoid", title: "Do not rewrite everything", text: "When a week goes badly, the temptation is to redesign your whole life. That usually creates more friction.", demo: "Make one useful adjustment and run it for a week before judging." },
    ],
  },
  "standards-habits-if-then": {
    "Build the habit around a cue": [
      { label: "Example", title: "A cue beats motivation", text: "A habit attached to a clear moment is easier to repeat than one held in memory.", demo: "After making coffee, open the daily plan. After training, log the session before leaving the gym. After market close, journal the trade decisions." },
      { label: "Design", title: "Make the start obvious", text: "The first action should be so clear that you do not negotiate with yourself.", demo: "Weak: 'Work on business.' Better: 'Open the prospect list and send the first five messages before 9:30.'" },
    ],
    "Use if-then plans for predictable friction": [
      { label: "Business", title: "When the day gets hijacked", text: "If a client issue takes the morning, the plan should shrink instead of disappear.", demo: "If the first sales block is lost, then I send five targeted follow-ups before lunch instead of abandoning outreach." },
      { label: "Fitness", title: "When time drops", text: "The fallback protects identity and continuity without pretending the full session happened.", demo: "If I cannot complete the planned workout, then I do 25 minutes: squat pattern, push, pull, carry." },
    ],
  },
  "accountability-without-oversharing": {
    "Use four sharing levels": [
      { label: "Private", title: "Only you need the raw details", text: "Health, money, screenshots, account size and private project files should remain hidden unless sharing them clearly helps.", demo: "Share the lesson or decision. Keep the sensitive evidence private." },
      { label: "Useful share", title: "Ask for a specific response", text: "Accountability works best when the other person knows what you want from them.", demo: "Example: 'Ask me on Friday whether the offer page is live. I do not need motivation; I need the deadline held.'" },
    ],
    "Share proof safely": [
      { label: "Better proof", title: "Blur what does not matter", text: "If proof contains money, client names, messages, addresses or account identifiers, remove them before posting.", demo: "A blurred screenshot plus a written lesson is usually stronger than raw evidence." },
      { label: "Boundary", title: "Proof is not performance theatre", text: "Sharing should create trust or feedback, not pressure other members to copy, compare or chase.", demo: "If a post mainly says 'look how much I made', it probably belongs outside the app." },
    ],
  },
  "offer-people-understand": {
    "The six-part offer": [
      { label: "Example", title: "From vague to clear", text: "A weak offer describes what you do. A strong offer describes who it helps, what problem it solves and what decision comes next.", demo: "Weak: 'I help businesses grow.' Better: 'I help local service businesses turn missed enquiries into booked calls using a 14-day follow-up system.'" },
      { label: "Proof", title: "Use believable evidence", text: "Proof can be a case study, before-and-after process, client quote, retention data or a small demo.", demo: "Do not exaggerate. Specific modest proof beats a loud claim people do not believe." },
    ],
    "Write the result responsibly": [
      { label: "Marketing", title: "Strong without hype", text: "A result should be attractive but not guaranteed unless you can genuinely guarantee it.", demo: "Better: 'designed to increase qualified conversations' rather than 'guaranteed to double revenue'." },
      { label: "Trust", title: "Name the conditions", text: "If the result depends on audience, effort, budget or market conditions, say so clearly.", demo: "This makes the offer feel more serious, not weaker." },
    ],
  },
  "qualified-pipeline-system": {
    "Define stages by buyer evidence": [
      { label: "Pipeline", title: "Evidence, not optimism", text: "A prospect moves stage because they did something, not because you feel hopeful.", demo: "Stage movement examples: replied with a problem, booked a call, confirmed budget range, introduced the decision-maker, requested proposal." },
      { label: "Bad forecast", title: "Do not count politeness as pipeline", text: "People can be friendly and still not be buyers. Forecast from behaviour.", demo: "'Sounds interesting' is not the same as a next meeting with the right person." },
    ],
    "Run a weekly pipeline meeting": [
      { label: "Simple agenda", title: "Clean the board", text: "The meeting should answer: what moved, what is stuck, what is next and what must be removed.", demo: "If an opportunity has no next action or date, it is not active pipeline." },
      { label: "Motion rule", title: "One next action per live deal", text: "Every live opportunity should have one named next action owned by you or the buyer.", demo: "Example: 'Send decision summary by Tuesday' or 'Buyer confirms technical stakeholder by Friday'." },
    ],
  },
  "discovery-conversation": {
    "Questions that reveal reality": [
      { label: "Useful question", title: "Ask for evidence", text: "Good discovery questions make the current situation visible. They avoid pitching too early.", demo: "Instead of 'Would you like more leads?' ask 'Where do enquiries currently come from, and what happens after someone asks for a quote?'" },
      { label: "Depth", title: "Find the cost of staying still", text: "A real business problem costs time, money, trust, opportunity or energy.", demo: "Ask: 'If this is unchanged in six months, what does it affect?'" },
    ],
    "End with a real decision": [
      { label: "Clear close", title: "No vague endings", text: "A useful call ends with yes, no, not now, or a specific next step. Anything else becomes follow-up fog.", demo: "Example: 'The next step is a 30-minute scope call with you and the operations lead on Thursday. Does that make sense?'" },
      { label: "Respect", title: "Fit beats pressure", text: "If the fit is weak, say so. Trust compounds when people feel you are diagnosing, not hunting.", demo: "A clean no can create a later referral." },
    ],
  },
  "ethical-follow-up-crm": {
    "Every follow-up must earn its place": [
      { label: "Weak", title: "Checking in is not value", text: "A message that only asks for attention teaches the buyer to ignore you.", demo: "Weak: 'Just checking in.' Better: 'You mentioned missed callbacks. Here is the two-step fix we discussed and the decision needed by Friday.'" },
      { label: "Timing", title: "Follow up from the agreed next step", text: "The strongest follow-up references what both sides already agreed.", demo: "If there was no agreed next step, your next message should create clarity, not pressure." },
    ],
    "Keep a trustworthy CRM": [
      { label: "CRM discipline", title: "Records should help future action", text: "Log the problem, decision process, next step, owner and deadline. Avoid turning the CRM into a diary.", demo: "A good note lets you reopen the deal in 30 seconds and know the next move." },
      { label: "Privacy", title: "Store only what you need", text: "Do not store unnecessary personal details, gossip or sensitive information that does not support the business relationship.", demo: "Useful: budget range. Not useful: private personal details unrelated to the decision." },
    ],
  },
  "thirteen-week-cash-control": {
    "Use clear categories": [
      { label: "Cash view", title: "Separate what can move from what cannot", text: "Cash gets clearer when inflows, essential outflows, committed outflows, discretionary spend and reserves are separated.", demo: "You cannot manage tax, payroll and experimental ad spend as if they carry the same consequence." },
      { label: "Decision", title: "Forecast for choices", text: "The forecast is not there to admire numbers. It tells you when to collect, cut, delay, sell or hold.", demo: "If week eight goes below the reserve floor, the decision must happen in week one, not week seven." },
    ],
    "Set decision thresholds": [
      { label: "Example", title: "Name the trigger early", text: "A threshold removes panic by deciding in advance what happens when cash moves.", demo: "If projected cash drops below two months of fixed costs, pause discretionary spend and chase overdue receivables within 48 hours." },
      { label: "Founder habit", title: "Cash first, ego second", text: "Revenue screenshots do not pay bills. Cash timing does.", demo: "A profitable month can still be dangerous if the money lands after payroll." },
    ],
  },
  "founder-weekly-scorecard": {
    "Use five views": [
      { label: "Balanced view", title: "Do not run from one number", text: "Revenue matters, but a serious operator also watches pipeline, delivery, cash, capacity and personal execution.", demo: "If sales are up but delivery quality is slipping, the scorecard should catch it before reputation does." },
      { label: "Simple", title: "Few numbers, real decisions", text: "A scorecard should be small enough to use every week. If a metric never changes a decision, remove it.", demo: "Better five numbers reviewed weekly than thirty numbers ignored." },
    ],
    "Read the chain, not isolated numbers": [
      { label: "Chain", title: "Find the constraint", text: "A weak result usually has an upstream cause. Read the chain before blaming the final number.", demo: "Low revenue may come from weak audience, low outreach, poor qualification, unclear offer, slow follow-up or delivery bottlenecks." },
      { label: "Action", title: "One constraint per week", text: "Trying to fix every number creates noise. Choose the constraint with the biggest leverage.", demo: "This week: improve qualified conversations. Next week: proposal conversion." },
    ],
  },
  "trading-risk-constitution": {
    "Define risk at four levels": [
      { label: "Account survival", title: "Risk has layers", text: "Per-trade risk is only one layer. A constitution also covers daily loss, weekly drawdown and total account drawdown.", demo: "A member can be 'safe' on each trade and still be reckless through overtrading." },
      { label: "Rule", title: "Limits must stop behaviour", text: "A risk limit is not a suggestion. It should automatically reduce size, pause trading or end the session.", demo: "If the daily loss limit is hit, the platform closes and the journal opens." },
    ],
    "Use automatic stop rules": [
      { label: "Emotion", title: "Decide before heat", text: "Stop rules exist because the worst decisions happen when money, ego and adrenaline are already involved.", demo: "After two rule breaches in a session, trading stops regardless of whether the next setup looks perfect." },
      { label: "Return", title: "Stopping is not quitting", text: "Stopping protects the ability to trade tomorrow. The return should be governed by review evidence, not anger.", demo: "A return gate may require one journal review, one reduced-size session and no rule breaches." },
    ],
  },
  "position-sizing-invalidation": {
    "Worked example": [
      { label: "Calculation", title: "Start with invalidation", text: "If the trade idea is wrong at a defined price, that distance controls position size. Size does not control the stop.", demo: "If account risk is £100 and the invalidation distance equals £2 per unit, maximum size is 50 units before fees/slippage adjustments." },
      { label: "Common mistake", title: "Do not move the stop to feel comfortable", text: "Moving invalidation just to take more size changes the trade idea after the fact.", demo: "If the correct invalidation makes the position too small, the answer is smaller size or no trade." },
    ],
    "Check the hidden inputs": [
      { label: "Hidden risk", title: "Fees, spread and slippage count", text: "The chart stop is not the only risk. Execution cost and liquidity can change the real loss.", demo: "High-volatility news conditions may turn a clean calculation into an unacceptable trade." },
      { label: "Practical", title: "Use conservative assumptions", text: "If you are unsure, reduce size or skip. The goal is repeatability, not squeezing every setup.", demo: "Professional behaviour is often choosing not to trade." },
    ],
  },
  "pre-trade-execution-checklist": {
    "The pre-trade gate": [
      { label: "Gate", title: "A trade must earn execution", text: "Context, setup, invalidation, size and risk conditions must all pass before an order is placed.", demo: "If one part is missing, the answer is wait. Not every idea deserves capital." },
      { label: "Example", title: "Clear before click", text: "Write the idea in plain language: why here, why now, what proves wrong, where risk is controlled.", demo: "If you cannot explain it before entering, you will probably invent reasons after entering." },
    ],
    "During the trade": [
      { label: "Behaviour", title: "Manage the plan, not the emotion", text: "The job during the trade is to follow the pre-written plan unless new evidence invalidates it.", demo: "Watching every tick and changing rules mid-trade is usually anxiety disguised as management." },
      { label: "Journal", title: "Capture deviations quickly", text: "If you break a rule, record it. Do not hide it behind the final P&L.", demo: "A winning rule breach is still a rule breach." },
    ],
  },
  "trading-journal-review": {
    "Capture four evidence groups": [
      { label: "Journal", title: "Record the decision, not just the result", text: "A journal should show setup quality, risk, execution and emotional state. P&L alone cannot teach enough.", demo: "Two profitable trades can include one excellent decision and one dangerous mistake." },
      { label: "Screenshots", title: "Before and after", text: "Capture the chart before entry and after exit so you can review what was knowable at the time.", demo: "Do not judge the entry using information that only appeared later." },
    ],
    "Grade adherence separately": [
      { label: "Discipline", title: "Good process can lose", text: "A losing trade that followed the plan may deserve a high adherence grade.", demo: "Grade execution separately from outcome so variance does not corrupt the review." },
      { label: "Danger", title: "Bad process can win", text: "A profitable impulse trade should not be celebrated as skill.", demo: "The journal should make dangerous wins visible before they become expensive habits." },
    ],
  },
  "drawdown-stop-trading": {
    "Create a ladder before losses": [
      { label: "Ladder", title: "Reduce risk by rule", text: "A drawdown ladder defines what happens at each loss level before the emotional pressure arrives.", demo: "Example: at 3% drawdown reduce size by half; at 5% stop live trading and run review; at 8% return to simulation only." },
      { label: "Purpose", title: "The ladder protects thinking", text: "The goal is not punishment. It reduces noise so the trader can diagnose the problem cleanly.", demo: "Smaller size makes it easier to see whether the issue is strategy, execution or emotional control." },
    ],
    "Diagnose in order": [
      { label: "Order", title: "Do not blame strategy first", text: "Review market conditions, setup selection, sizing, execution and rule adherence before declaring the system broken.", demo: "Many drawdowns come from trading outside the plan, not from the plan itself." },
      { label: "Return", title: "Evidence earns risk back", text: "The return to normal size should be gradual and evidence-led.", demo: "Three reduced-risk sessions with no rule breaches is more meaningful than one revenge win." },
    ],
  },
  "trading-network-compliance": {
    "Allowed contribution": [
      { label: "Setup review", title: "Educational, delayed and contextual", text: "A useful setup review teaches thinking. It includes market context, the planned invalidation, the reason the idea was considered and what would make it wrong.", demo: "Good: 'Here is yesterday's setup, why I waited, where invalidation sat and what I learned.' Avoid: 'Buy now, target here, thank me later.'" },
      { label: "Risk question", title: "Ask about process, not signals", text: "Questions should improve decision quality. Risk, execution, journaling and psychology are all fair game when they are not asking others what to buy or sell.", demo: "Good: 'How would you size this if invalidation is 30 points away?' Bad: 'Is everyone entering now?'" },
      { label: "Post-trade review", title: "Show both sides", text: "A credible review includes what worked, what did not, whether rules were followed and what changes next. It does not crop out losses or pretend certainty.", demo: "Good: 'Two trades, one loss, one win, same setup family. The loss followed rules; the win had a late entry I need to fix.'" },
      { label: "Product question", title: "No referral pressure", text: "Members can ask about platforms, journals or tools, but the post must not pressure deposits, affiliate sign-ups or private paid channels.", demo: "Good: 'Does anyone know a journal that exports execution screenshots?' Bad: 'Use my link and fund today for a bonus.'" },
    ],
    "Not allowed": [
      { label: "Live instruction", title: "No buy-now/sell-now calls", text: "Live instructions can create pressure and regulatory risk. Motion Only is not a signal room.", demo: "Remove or report posts like: 'Gold long now, stop here, target here.'" },
      { label: "Income claims", title: "No guaranteed returns language", text: "Trading is high risk. Guaranteed income, low-risk promises and daily-profit claims create the wrong culture and can mislead members.", demo: "Bad: 'Easy £250 daily.' Better educational framing: 'Here is the risk framework I use before deciding whether a trade is acceptable.'" },
      { label: "Selective screenshots", title: "No profit-only theatre", text: "Profit screenshots without context encourage comparison and risk-chasing. If performance is discussed, it needs limitations, losses and method.", demo: "A single winning screenshot with fire emojis is not education." },
      { label: "Commercial pressure", title: "Disclose incentives", text: "Affiliate links, commissions, gifts, paid groups and private channels must be disclosed and may still be removed if they pressure members.", demo: "If the post benefits the poster financially, the reader must know that before clicking." },
      { label: "Trust abuse", title: "No fake authority", text: "Impersonation, fake testimonials, fake regulatory approval or borrowed credibility destroys trust quickly.", demo: "Moderators should remove first, then investigate. Protecting the room matters more than preserving a questionable post." },
    ],
    "Use a responsible post structure": [
      { label: "Structure", title: "Context, risk, lesson", text: "A responsible trading post starts with context, states assumptions, names invalidation, explains risk and ends with a lesson or question.", demo: "Template: 'Context was..., my plan was..., invalidation was..., risk was..., result was..., lesson/question is...'" },
      { label: "Tone", title: "No pressure energy", text: "The post should make readers calmer and smarter, not urgent and greedy.", demo: "If a reader feels rushed to deposit or copy, the post has failed the standard." },
    ],
  },
  "twelve-week-strength-block": {
    "Weekly schedule": [
      { label: "Example week", title: "Simple and repeatable", text: "A strong week spreads stress so quality stays high. Strength sessions should not all fight for the same recovery.", demo: "Example: Monday full body, Wednesday upper/lower emphasis, Friday full body, Saturday easy conditioning." },
      { label: "Reality", title: "Schedule around life", text: "The best plan is the one you can repeat. If work and family make five sessions unrealistic, build a three-session standard first.", demo: "Consistency beats heroic weeks followed by collapse." },
    ],
    "Minimum effective week": [
      { label: "Fallback", title: "Protect the floor", text: "The minimum week is not failure. It keeps movement patterns alive when life gets tight.", demo: "Two full-body sessions and one easy conditioning session can maintain momentum until normal training returns." },
      { label: "Mindset", title: "Never turn one missed session into a lost month", text: "The minimum standard stops drift early.", demo: "If Monday is missed, train Tuesday or Wednesday. Do not wait for the next perfect week." },
    ],
  },
  "progressive-overload-without-ego": {
    "Use double progression": [
      { label: "How it works", title: "Earn load increases", text: "Choose a rep range. Add reps with clean technique before adding weight. This keeps progress tied to quality.", demo: "Example: 3 sets of 8-10. When all three sets hit 10 with two reps in reserve, add a small amount of load next time." },
      { label: "Ego check", title: "More load is not always progress", text: "If load increases but range, control or recovery collapses, you did not really progress.", demo: "Motion Only standard: quality first, then volume, then load." },
    ],
    "Respond to a stall": [
      { label: "Stall", title: "Inspect before forcing", text: "A stall can come from sleep, food, stress, exercise selection, volume or unrealistic jumps.", demo: "Do not max out because one lift was flat. Review the inputs first." },
      { label: "Adjustment", title: "Change one variable", text: "Adjusting one thing makes the result readable.", demo: "Reduce one set, improve sleep window, repeat the load or change rep target. Do not rewrite the whole programme." },
    ],
  },
  "durable-conditioning": {
    "Two-session framework": [
      { label: "Base", title: "Easy work builds capacity", text: "Most conditioning should be controlled enough to repeat. It supports recovery, work capacity and health.", demo: "Easy session: 30-45 minutes at a pace where conversation is possible." },
      { label: "Intensity", title: "Small dose, high quality", text: "Hard intervals are useful but expensive. They should not ruin strength work or the rest of the week.", demo: "Example: 6 rounds of 60 seconds hard, 120 seconds easy, only if recovery stays solid." },
    ],
    "Progress one variable": [
      { label: "Progression", title: "Do not add everything at once", text: "Increase duration, rounds, frequency or intensity — not all at the same time.", demo: "If easy work moves from 30 to 40 minutes, keep pace and frequency stable." },
      { label: "Signal", title: "Recovery decides the pace", text: "Conditioning is working when capacity rises without crushing sleep, mood or strength.", demo: "If legs are dead every lower session, the conditioning plan is interfering." },
    ],
  },
  "recovery-sleep-fatigue": {
    "Track a small signal set": [
      { label: "Signals", title: "Use boring indicators", text: "Sleep duration, waking energy, appetite, soreness, motivation and performance are enough for most members.", demo: "A single bad day is noise. Several signals worsening together means adjust." },
      { label: "Avoid", title: "Do not worship gadgets", text: "Wearables can help, but the plan should not depend on a perfect readiness score.", demo: "If performance, mood and sleep all say slow down, you do not need an app to approve it." },
    ],
    "Use a three-level adjustment": [
      { label: "Green", title: "Normal plan", text: "Signals are stable. Train as planned and do not invent complexity.", demo: "Good sleep, normal soreness, normal performance: execute." },
      { label: "Amber", title: "Reduce the dose", text: "Some signals are off. Keep the habit but lower volume, load or intensity.", demo: "Swap intervals for easy conditioning, or leave more reps in reserve." },
      { label: "Red", title: "Stop pretending", text: "Pain, illness symptoms, abnormal fatigue or repeated performance collapse need a real change.", demo: "Rest, deload or seek appropriate support. Discipline is not ignoring warning lights." },
    ],
  },
  "deload-testing-return": {
    "Use testing guardrails": [
      { label: "Guardrail", title: "Standardise the test", text: "Use the same warm-up, equipment, range and technique so the result means something.", demo: "A new deadlift best with a different bar, rushed warm-up and ugly range is not clean data." },
      { label: "Stop condition", title: "Know when to end it", text: "Testing should stop when technique, pain, symptoms or risk breaches the standard.", demo: "A missed rep is not an invitation to gamble with another heavier attempt." },
    ],
    "Do not repay training debt": [
      { label: "Return", title: "Missed sessions are gone", text: "Cramming missed work into the next week usually creates fatigue without adding useful adaptation.", demo: "Resume at current capacity. Build one clean week, then progress." },
      { label: "Identity", title: "You are still someone who trains", text: "An interruption does not require drama. Return with a controlled first week and let evidence rebuild confidence.", demo: "The win is not punishment. The win is being back in motion." },
    ],
  },
};

libraryContent.forEach((resource) => {
  const expansion = libraryExpansions[resource.id];
  if (!expansion) return;
  resource.sections = resource.sections.map((section) => ({
    ...section,
    examples: expansion[section.heading] || section.examples,
  }));
});

export const libraryStats = {
  resources: libraryContent.length,
  tracks: libraryCategories.length - 1,
  templates: libraryContent.filter((item) => item.template).length,
};
