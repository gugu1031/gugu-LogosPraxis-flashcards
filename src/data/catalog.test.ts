import { describe, expect, it } from "vitest";
import { initialCards, initialCatalog } from "@/data/catalog";

describe("curated study content", () => {
  it("ships the complete core and exam card pack with stable unique IDs", () => {
    expect(initialCards).toHaveLength(253);
    expect(new Set(initialCards.map((card) => card.id)).size).toBe(initialCards.length);
  });

  it("keeps historical papers and syllabus forecasts explicitly separated", () => {
    const bookIds = new Set(initialCatalog.map((book) => book.id));
    const examCards = initialCards.filter((card) => card.exam);
    const pastExamCards = examCards.filter((card) => card.exam?.sourceKind !== "syllabus_forecast");
    const forecastCards = examCards.filter((card) => card.exam?.sourceKind === "syllabus_forecast");
    const buaaPastExamCards = pastExamCards.filter(
      (card) => card.exam?.institution === "北京航空航天大学" && card.exam.subjectCode
    );
    const buaa781Forecasts = forecastCards.filter((card) => card.exam?.subjectCode === "781");
    const buaa882Forecasts = forecastCards.filter((card) => card.exam?.subjectCode === "882");

    expect(examCards).toHaveLength(198);
    expect(pastExamCards).toHaveLength(143);
    expect(forecastCards).toHaveLength(55);
    expect(buaaPastExamCards).toHaveLength(125);
    expect(buaa781Forecasts).toHaveLength(28);
    expect(buaa882Forecasts).toHaveLength(27);
    expect(forecastCards.every((card) => card.exam?.sourceTitle?.includes("非历年真题"))).toBe(true);
    expect(examCards.every((card) => bookIds.has(card.sources[0]?.bookId ?? ""))).toBe(true);
    expect(
      examCards.every(
        (card) =>
          card.flatTags.includes(card.exam?.institution ?? "") &&
          card.flatTags.includes(String(card.exam?.year))
      )
    ).toBe(true);
  });
});
