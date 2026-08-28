import type { StudyCard } from "@/types";

export function buildCardFlatTags(
  card: Pick<StudyCard, "tags" | "exam">
): string[] {
  const values = [
    ...card.tags.subjects,
    ...card.tags.thinkers,
    ...card.tags.questionTypes,
    card.tags.difficulty,
    ...card.tags.eras,
    ...card.tags.schools,
    card.exam?.institution,
    card.exam?.year ? String(card.exam.year) : undefined,
    card.exam?.subjectCode,
    card.exam?.subjectName,
    card.exam?.questionType,
    card.exam?.sourceKind === "syllabus_forecast" ? "大纲题" : card.exam ? "历年真题" : undefined
  ].filter((value): value is string => Boolean(value));

  return [...new Set(values)];
}
