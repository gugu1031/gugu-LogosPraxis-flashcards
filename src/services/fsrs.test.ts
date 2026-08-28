import { describe, expect, it } from "vitest";
import {
  createInitialFsrsState,
  intervalFromStability,
  previewIntervals,
  retrievability,
  reviewFsrs
} from "./fsrs";

describe("FSRS-4 调度", () => {
  it("首次评分会生成稳定性、难度和到期时间", () => {
    const now = new Date("2026-07-27T00:00:00.000Z");
    const result = reviewFsrs(createInitialFsrsState(now), 3, now);
    expect(result.state.reps).toBe(1);
    expect(result.state.stability).toBeGreaterThan(0);
    expect(result.state.difficulty).toBeGreaterThanOrEqual(1);
    expect(result.state.difficulty).toBeLessThanOrEqual(10);
    expect(new Date(result.state.due).getTime()).toBeGreaterThan(now.getTime());
  });

  it("遗忘会增加 lapse 并安排较短间隔", () => {
    const first = reviewFsrs(createInitialFsrsState(), 3, new Date("2026-07-20T00:00:00.000Z")).state;
    const forgot = reviewFsrs(first, 1, new Date("2026-07-27T00:00:00.000Z")).state;
    expect(forgot.lapses).toBe(1);
    expect(forgot.scheduledDays).toBe(1);
  });

  it("易到难的预览间隔单调增加", () => {
    const intervals = previewIntervals(createInitialFsrsState(), new Date("2026-07-27T00:00:00.000Z"));
    expect(intervals[1]).toBeLessThanOrEqual(intervals[2]);
    expect(intervals[2]).toBeLessThanOrEqual(intervals[3]);
    expect(intervals[3]).toBeLessThanOrEqual(intervals[4]);
  });

  it("可提取率和稳定性换算保持合理范围", () => {
    expect(retrievability(10, 10)).toBeGreaterThan(0.8);
    expect(intervalFromStability(10)).toBeGreaterThan(0);
  });
});
