import type { VentureStage } from "@/lib/types";

/**
 * Onboarding intake + the local "AI Rules Validation" engine (v1).
 *
 * The Compass is a focus tool for anyone building something — entrepreneurs,
 * recently-discharged soldiers, people stuck or between things, and anyone
 * finding their next path. The intro chat captures the person's situation,
 * where they are, their biggest obstacle, and their 30-day goal, then tailors
 * the app to them. `deriveUnlocks` maps the answers onto the stage-gate keys the
 * rest of the app understands. Shaped so a real backend/LLM can replace the
 * internals without touching the UI, like features/advisory/advisor.ts.
 */

/** Who the person is — drives tone, journaling prompts, and framing. */
export type SituationKey = "entrepreneur" | "veteran" | "stuck" | "exploring";
export type ObstacleKey = "focus" | "consistency" | "results";
export type GoalKey = "clarity" | "build" | "momentum";

export interface OnboardingAnswers {
  situation: SituationKey;
  stage: VentureStage;
  obstacle: ObstacleKey;
  goal: GoalKey;
}

export interface OnboardingOption<V extends string = string> {
  value: V;
  label: string;
}

export interface OnboardingQuestion<K extends keyof OnboardingAnswers = keyof OnboardingAnswers> {
  id: K;
  prompt: string;
  options: OnboardingOption<OnboardingAnswers[K]>[];
}

/**
 * The intro questions, asked one at a time. Question 1 sets the situation;
 * the rest use situation-neutral wording so they read naturally for a founder,
 * a veteran in transition, or someone simply trying to get unstuck. The "stage"
 * labels are generic but map onto the underlying VentureStage values, so all
 * downstream logic (roadmap, unlocks, daily focus) keeps working unchanged.
 */
export const ONBOARDING_QUESTIONS: [
  OnboardingQuestion<"situation">,
  OnboardingQuestion<"stage">,
  OnboardingQuestion<"obstacle">,
  OnboardingQuestion<"goal">,
] = [
  {
    id: "situation",
    prompt: "Welcome aboard. First — which best describes you right now?",
    options: [
      { value: "entrepreneur", label: "Building a business / startup" },
      { value: "veteran", label: "Just finished my military service" },
      { value: "stuck", label: "Stuck or between things" },
      { value: "exploring", label: "Figuring out my next path" },
    ],
  },
  {
    id: "stage",
    prompt: "Where are you in your journey right now?",
    options: [
      { value: "Ideation", label: "Just getting started" },
      { value: "Validation", label: "Exploring my direction" },
      { value: "Mvp", label: "Actively building something" },
      { value: "Traction", label: "Gaining real momentum" },
      { value: "Growth", label: "Leveling up what works" },
    ],
  },
  {
    id: "obstacle",
    prompt: "What's your single biggest obstacle this month?",
    options: [
      { value: "focus", label: "Knowing what to focus on" },
      { value: "consistency", label: "Staying consistent" },
      { value: "results", label: "Turning effort into results" },
    ],
  },
  {
    id: "goal",
    prompt: "And what's your main goal for the next 30 days?",
    options: [
      { value: "clarity", label: "Get clarity & direction" },
      { value: "build", label: "Build momentum on one thing" },
      { value: "momentum", label: "See concrete results" },
    ],
  },
];

/** Gate keys a person is assumed to have already cleared, by where they are. */
const GATES_BY_STAGE: Record<VentureStage, string[]> = {
  Ideation: [],
  Validation: [],
  Mvp: ["validation_done"],
  Traction: ["validation_done", "mvp_shipped"],
  Growth: ["validation_done", "mvp_shipped", "first_10_users"],
};

export interface DerivedUnlocks {
  stage: VentureStage;
  unlockedGateKeys: string[];
}

/**
 * Rules-based unlock derivation. Someone who reports being further along has,
 * by definition, already passed the earlier gates — so we open those features
 * up front instead of making them re-earn each milestone.
 */
export function deriveUnlocks(answers: OnboardingAnswers): DerivedUnlocks {
  return {
    stage: answers.stage,
    unlockedGateKeys: GATES_BY_STAGE[answers.stage] ?? [],
  };
}

/** One-line, personalized framing for the dashboard, by situation + obstacle. */
export function personalizedFocus(a: OnboardingAnswers): string {
  const byObstacle: Record<ObstacleKey, string> = {
    focus: "we've narrowed today down to what actually matters — one clear step at a time.",
    consistency: "we've kept today small and repeatable, so showing up is the easy part.",
    results: "we've prioritized the work that turns effort into visible progress.",
  };
  const lead: Record<SituationKey, string> = {
    entrepreneur: "Your venture",
    veteran: "Your transition",
    stuck: "Your way forward",
    exploring: "Your search for direction",
  };
  return `${lead[a.situation]}: ${byObstacle[a.obstacle]}`;
}
