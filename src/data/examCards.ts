import rawRecords from "@/data/examRecords.generated.json";
import { seedCard } from "@/data/cardFactory";
import type { ExamMetadata, StudyCard } from "@/types";

interface RawExamRecord {
  id: string;
  front: string;
  back: string;
  answerTemplate: string;
  sourceBookId: string;
  subject: string;
  thinkers: string[];
  questionType: string;
  difficulty: StudyCard["tags"]["difficulty"];
  exam: ExamMetadata;
}

const records = rawRecords as RawExamRecord[];

export const examCards: StudyCard[] = records.map((record) =>
  seedCard(
    record.id,
    record.front,
    record.back,
    {
      subjects: [record.subject, "院校真题"],
      thinkers: record.thinkers,
      questionTypes: [record.questionType],
      difficulty: record.difficulty,
      eras: [`${record.exam.year}年`],
      schools: [record.exam.institution]
    },
    [{ bookId: record.sourceBookId }],
    record.answerTemplate,
    record.exam
  )
);
