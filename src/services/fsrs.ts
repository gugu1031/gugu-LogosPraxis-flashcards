import type { FsrsState, ReviewRating } from "@/types";

// FSRS-4 官方默认参数。状态量以天为单位，目标记忆保持率为 90%。
export const FSRS4_WEIGHTS = [
  0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61
] as const;

export const DESIRED_RETENTION = 0.9;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const round = (value: number, digits = 4) => Number(value.toFixed(digits));
const dayMs = 86_400_000;

export function createInitialFsrsState(now = new Date()): FsrsState {
  return {
    due: now.toISOString(),
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0
  };
}

export function retrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + elapsedDays / (9 * stability), -1);
}

export function intervalFromStability(stability: number, retention = DESIRED_RETENTION): number {
  const interval = 9 * stability * (1 / retention - 1);
  return clamp(Math.round(interval), 1, 36_500);
}

function initialStability(rating: ReviewRating): number {
  return FSRS4_WEIGHTS[rating - 1];
}

function initialDifficulty(rating: ReviewRating): number {
  return clamp(FSRS4_WEIGHTS[4] - (rating - 3) * FSRS4_WEIGHTS[5], 1, 10);
}

function nextDifficulty(difficulty: number, rating: ReviewRating): number {
  const delta = -FSRS4_WEIGHTS[6] * (rating - 3);
  const candidate = difficulty + delta;
  const meanReverted =
    FSRS4_WEIGHTS[7] * initialDifficulty(3) + (1 - FSRS4_WEIGHTS[7]) * candidate;
  return clamp(meanReverted, 1, 10);
}

function nextRecallStability(
  difficulty: number,
  stability: number,
  recall: number,
  rating: ReviewRating
): number {
  const hardPenalty = rating === 2 ? FSRS4_WEIGHTS[15] : 1;
  const easyBonus = rating === 4 ? FSRS4_WEIGHTS[16] : 1;
  return (
    stability *
    (1 +
      Math.exp(FSRS4_WEIGHTS[8]) *
        (11 - difficulty) *
        Math.pow(stability, -FSRS4_WEIGHTS[9]) *
        (Math.exp((1 - recall) * FSRS4_WEIGHTS[10]) - 1) *
        hardPenalty *
        easyBonus)
  );
}

function nextForgetStability(difficulty: number, stability: number, recall: number): number {
  return (
    FSRS4_WEIGHTS[11] *
    Math.pow(difficulty, -FSRS4_WEIGHTS[12]) *
    (Math.pow(stability + 1, FSRS4_WEIGHTS[13]) - 1) *
    Math.exp((1 - recall) * FSRS4_WEIGHTS[14])
  );
}

export interface FsrsReviewResult {
  state: FsrsState;
  elapsedDays: number;
  previousStability: number;
}

export function reviewFsrs(
  previous: FsrsState,
  rating: ReviewRating,
  reviewedAt = new Date()
): FsrsReviewResult {
  const previousStability = previous.stability;
  const elapsedDays = previous.lastReview
    ? Math.max(0, (reviewedAt.getTime() - new Date(previous.lastReview).getTime()) / dayMs)
    : 0;

  let stability: number;
  let difficulty: number;

  if (previous.reps === 0 || previous.stability <= 0) {
    stability = initialStability(rating);
    difficulty = initialDifficulty(rating);
  } else {
    const recall = retrievability(elapsedDays, previous.stability);
    difficulty = nextDifficulty(previous.difficulty, rating);
    stability =
      rating === 1
        ? nextForgetStability(difficulty, previous.stability, recall)
        : nextRecallStability(difficulty, previous.stability, recall, rating);
  }

  stability = clamp(stability, 0.05, 36_500);
  let scheduledDays = intervalFromStability(stability);
  if (rating === 1) scheduledDays = 1;
  if (rating === 2) scheduledDays = Math.max(1, Math.round(scheduledDays * 0.7));
  if (rating === 4) scheduledDays = Math.max(2, Math.round(scheduledDays * 1.15));

  const due = new Date(reviewedAt.getTime() + scheduledDays * dayMs);
  const state: FsrsState = {
    due: due.toISOString(),
    stability: round(stability),
    difficulty: round(difficulty),
    elapsedDays: round(elapsedDays, 2),
    scheduledDays,
    reps: previous.reps + 1,
    lapses: previous.lapses + (rating === 1 ? 1 : 0),
    lastReview: reviewedAt.toISOString()
  };

  return { state, elapsedDays, previousStability };
}

export function previewIntervals(state: FsrsState, now = new Date()): Record<ReviewRating, number> {
  return {
    1: reviewFsrs(state, 1, now).state.scheduledDays,
    2: reviewFsrs(state, 2, now).state.scheduledDays,
    3: reviewFsrs(state, 3, now).state.scheduledDays,
    4: reviewFsrs(state, 4, now).state.scheduledDays
  };
}
