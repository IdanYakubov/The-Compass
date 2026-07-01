import type { VentureStage } from "@/lib/types";

/**
 * Local rule-based advisory engine — v1 of The Advisory Matrix.
 * Quick prompts and replies are tailored to the venture's current stage.
 * The API surface (getQuickPrompts / getAdvice) is deliberately shaped so a
 * real backend/LLM can replace the internals without touching the UI.
 * The North persona's system prompt for that swap-in lives in ./system-prompt.md.
 */

export interface AdvisorContext {
  stage: VentureStage;
  milestone: string | null;
  activeTask: string | null;
}

export function getQuickPrompts(stage: VentureStage): string[] {
  switch (stage) {
    case "Ideation":
    case "Validation":
      return [
        "How to draft a LinkedIn message for interviews?",
        "Give me examples of customer pain points.",
        "Critique my value proposition.",
      ];
    case "Mvp":
      return [
        "How do I scope my MVP down further?",
        "What should my landing page say?",
        "How do I pick my first metric?",
      ];
    default:
      return [
        "How do I get my next 10 users?",
        "When should I start charging?",
        "What should I measure weekly?",
      ];
  }
}

const PLAYBOOK: Array<{ match: RegExp; reply: (ctx: AdvisorContext) => string }> = [
  {
    match: /linkedin|message|outreach|interview/i,
    reply: (ctx) => `Here's a structure that gets replies for **${ctx.milestone ?? "your current milestone"}**:

1. **Subject/opener** — name the specific problem space, not your product: "Quick question about how you handle X".
2. **One line of credibility** — why you, why them: "I'm researching how solo founders plan their week."
3. **A tiny, concrete ask** — "Would you be open to a 15-minute call? I'm not selling anything — I want to learn how you do this today."
4. **Make saying yes effortless** — offer two time slots or async voice notes.

Send 10 today. Expect a 20–30% reply rate from 2nd-degree connections. Avoid pitching — at this stage you're buying information, not selling.`,
  },
  {
    match: /pain point|pains|problems/i,
    reply: () => `Strong pain points share three traits — frequent, expensive, and acknowledged. Listen for these patterns in interviews:

- **Workaround pain** — "I track it in a spreadsheet and it breaks constantly." (They already built a bad version of your product — best signal there is.)
- **Time pain** — "This eats 2 hours every Monday."
- **Money pain** — "We lost a client because of this."
- **Emotional pain** — "I never know if I'm working on the right thing." (Often the real driver behind productivity tools.)

Rank what you hear by *frequency × intensity*. One pain mentioned unprompted by 7 of 10 people beats five pains you had to suggest.`,
  },
  {
    match: /value prop|critique|proposition/i,
    reply: () => `Paste your value proposition here and I'll pressure-test it. The bar it has to clear:

- **Specific customer** — "solo founders in their first year", not "entrepreneurs".
- **Felt problem** — something they'd say in their own words.
- **Concrete outcome** — "ship your MVP 4 weeks faster", not "boost productivity".
- **Reason to believe** — why your approach works where alternatives fail.

Template: *For [customer] who [struggle], [product] is a [category] that [outcome]. Unlike [alternative], it [key difference].* If a stranger can't repeat it back after one read, it's not done.`,
  },
  {
    match: /mvp|scope/i,
    reply: () => `Scope test: your MVP should deliver the **single core value** in one user flow. Cut anything that doesn't directly serve it — auth, settings, polish can all wait. If building it takes more than 4–6 weeks of evenings, it's not minimal yet.`,
  },
  {
    match: /metric|measure/i,
    reply: () => `Pick **one** north-star metric per stage. Pre-launch: validated interviews per week. Post-launch: returning users (came back twice unprompted). Avoid vanity numbers — signups and page views don't tell you if the pain is real.`,
  },
];

export function getAdvice(input: string, ctx: AdvisorContext): string {
  const hit = PLAYBOOK.find((p) => p.match.test(input));
  if (hit) return hit.reply(ctx);

  return `Good question. Here's how I'd think about it at the **${ctx.stage}** stage${
    ctx.activeTask ? `, given your active task is “${ctx.activeTask}”` : ""
  }:

1. Tie it back to your current milestone — if it doesn't move “${ctx.milestone ?? "your milestone"}” forward, park it in a someday-list and stay on course.
2. Timebox the decision: 30 minutes of research, then commit.
3. Default to the option that puts you in front of customers sooner.

(The full Advisory Matrix engine with deeper, data-driven playbooks ships in a later iteration — right now I cover outreach, pain-point analysis, value props, MVP scoping, and metrics.)`;
}
