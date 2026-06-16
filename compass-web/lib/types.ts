// TypeScript mirrors of the Compass.Api DTOs.

export type VentureStage = "Ideation" | "Validation" | "Mvp" | "Traction" | "Growth";
export type MilestoneStatus = "Locked" | "Active" | "Achieved";
export type ImpactLevel = "Low" | "Medium" | "High";

export interface VentureSummary {
  id: string;
  name: string;
  stage: VentureStage;
  createdAt: string;
}

export interface MicroTask {
  id: string;
  title: string;
  impact: ImpactLevel;
  estimateMinutes: number | null;
  dueDate: string | null;
  isCompleted: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  status: MilestoneStatus;
  sortOrder: number;
  targetDate: string | null;
  achievedAt: string | null;
  gateKey: string | null;
  dependsOnMilestoneId: string | null;
  stageOnAchieve: VentureStage | null;
  tasksTotal: number;
  tasksCompleted: number;
  tasks: MicroTask[];
  progress: number;
}

export interface Roadmap {
  ventureId: string;
  ventureName: string;
  stage: VentureStage;
  milestones: Milestone[];
}

export interface FocusTask {
  id: string;
  milestoneId: string;
  milestoneTitle: string;
  title: string;
  impact: ImpactLevel;
  estimateMinutes: number | null;
  dueDate: string | null;
}

export interface Today {
  ventureId: string;
  ventureName: string;
  stage: VentureStage;
  activeMilestoneTitle: string | null;
  activeMilestoneProgress: number;
  topTasks: FocusTask[];
}

export interface CompleteMilestoneResult {
  achievedMilestoneId: string;
  openedGateKey: string | null;
  unlockedMilestones: Milestone[];
  stage: VentureStage;
}

export interface Unlocks {
  ventureId: string;
  stage: VentureStage;
  unlockedGateKeys: string[];
}
