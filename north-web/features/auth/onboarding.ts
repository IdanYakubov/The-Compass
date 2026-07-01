import type { VentureStage } from "@/lib/types";

/**
 * Onboarding intake + the local "AI Rules Validation" engine (v1).
 *
 * North is a focus tool for anyone building something — entrepreneurs,
 * recently-discharged soldiers, people stuck or between things, and anyone
 * finding their next path. The intro chat captures the person's situation,
 * where they are, their biggest obstacle, and their 30-day goal, then tailors
 * the app to them. Shaped so a real backend/LLM can replace the internals
 * without touching the UI, like features/advisory/advisor.ts.
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
  /**
   * Free-text, in the person's own words: their field, what they're building,
   * and what they want. Optional. This is the raw material a real AI mentor will
   * use as context later — captured now so the data is ready when the LLM lands.
   * (Optional in the type for backward-compat with sessions saved before this field.)
   */
  about?: string;
}

export interface OnboardingOption<V extends string = string> {
  value: V;
  label: string;
}

/** The multiple-choice keys — excludes the free-text `about` field. */
type ChoiceKey = Exclude<keyof OnboardingAnswers, "about">;

export interface OnboardingQuestion<K extends ChoiceKey = ChoiceKey> {
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

/**
 * NOTE: onboarding no longer grants feature-gate access. Self-reported stage is
 * used only to personalize and to label the current stage on the dashboard;
 * gated modules are unlocked solely by real milestone progress on the backend
 * (GET /ventures/{id}/unlocks). See features/auth/AuthContext.tsx (issue #5).
 */

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
