export type EventStatus = "DRAFT" | "REGISTRATION" | "LIVE" | "PAUSED" | "ENDED";
export type TeamStatus = "ACTIVE" | "FINISHED" | "DISQUALIFIED";

export type TeamSafeState = {
  teamId: string;
  teamName: string;
  currentQuestion: number;
  questionsCompleted: number;
  totalQuestions: number;
  status: TeamStatus;
  eventStatus: EventStatus;
};

export type PublicLeaderboardEntry = {
  rank: number;
  teamName: string;
  questionsCompleted: number;
  totalQuestions: number;
  finished: boolean;
};

export type EventStatusPayload = {
  id: string;
  name: string;
  status: EventStatus;
  registration_open: boolean;
  total_questions: number;
  hunt_start_time: string | null;
  hunt_end_time: string | null;
  team_count: number;
};

export type CurrentQuestion = {
  questionId: string;
  questionNumber: number;
  title: string | null;
  questionText: string;
  mediaUrl: string | null;
};

export type CheckpointScanResult = {
  code: string;
  expiresAt: string;
};

export type CheckpointVerifyResult = {
  correct: boolean;
  code: string;
  currentQuestion?: number;
  questionsCompleted?: number;
  finished?: boolean;
};
