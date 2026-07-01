import type { SituationKey } from "@/features/auth/onboarding";

/**
 * Situation-aware journaling prompts. The reflection that helps a founder is not
 * the one that helps a soldier returning to civilian life, or someone trying to
 * get unstuck — so the prompts adapt to who the person said they are.
 */
export function getJournalPrompts(situation: SituationKey): string[] {
  switch (situation) {
    case "entrepreneur":
      return [
        "What did I learn from a customer or the market today?",
        "What's the one bet I'm really making this week?",
        "Where did I spend time that didn't move the needle?",
      ];
    case "veteran":
      return [
        "What strength from my service showed up today?",
        "What felt unfamiliar in civilian life — and how did I handle it?",
        "What's one small step toward the life I want to build?",
      ];
    case "stuck":
      return [
        "What's one thing — however small — I can move forward today?",
        "What's really holding me back right now?",
        "When did I last feel momentum, and what created it?",
      ];
    case "exploring":
      return [
        "What gave me energy today, and what drained it?",
        "What am I curious about that I haven't acted on yet?",
        "If I knew I couldn't fail, what would I try next?",
      ];
  }
}
