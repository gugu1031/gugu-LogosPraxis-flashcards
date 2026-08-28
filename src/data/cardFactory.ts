import { createInitialFsrsState } from "@/services/fsrs";
import { buildCardFlatTags } from "@/services/cards";
import type { ExamMetadata, StudyCard } from "@/types";

const contentReleaseAt = "2026-07-27T00:00:00.000Z";

export function seedCard(
  id: string,
  front: string,
  back: string,
  tags: StudyCard["tags"],
  sources: StudyCard["sources"],
  answerTemplate?: string,
  exam?: ExamMetadata
): StudyCard {
  const card: StudyCard = {
    id,
    front,
    back,
    answerTemplate,
    excerpt: sources[0]?.quote,
    sources,
    tags,
    flatTags: [],
    exam,
    fsrs: createInitialFsrsState(),
    suspended: false,
    createdAt: contentReleaseAt,
    updatedAt: contentReleaseAt
  };
  card.flatTags = buildCardFlatTags(card);
  return card;
}
