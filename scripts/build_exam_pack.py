from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SOURCE_ROOT = ROOT / "tmp" / "pdfs" / "exam-source"
OUTPUT = ROOT / "src" / "data" / "examRecords.generated.json"

YEAR_PATTERN = re.compile(r"^\f?(202[0-5])\s*$")
SECTION_PATTERN = re.compile(r"^\f?([一二三四五六七八九十]+)、\s*(.+?)\s*$")
QUESTION_PATTERN = re.compile(r"^\f?(\d+)[.、．，]\s*(.*)$")

QUESTION_TYPE_KEYWORDS = {
    "名词解释": "名词解释",
    "辨析": "辨析题",
    "判断": "判断题",
    "简答": "简答题",
    "论述": "论述题",
    "材料": "材料分析题",
}

ANSWER_TEMPLATES = {
    "名词解释": "概念界定—核心内容或基本特征—历史地位与现实意义。",
    "辨析题": "先作明确判断，再界定关键概念，分层说明合理性与局限，最后得出结论。",
    "判断题": "先判断正误，再给出理论依据，指出题干遗漏或混淆之处。",
    "简答题": "先用一句话总述，再按理论依据、核心要点、意义或要求分点展开。",
    "论述题": "审题定论—阐明理论依据—结合历史与现实分层论证—总结方法论意义。",
    "材料分析题": "概括材料主旨—调用对应原理—逐层分析材料—联系实践提出结论或路径。",
}

THINKERS = [
    "马克思",
    "恩格斯",
    "列宁",
    "毛泽东",
    "邓小平",
    "习近平",
    "费尔巴哈",
    "黑格尔",
    "孙中山",
]


@dataclass(frozen=True)
class SourceSpec:
    filename: str
    subject_code: str
    subject_name: str
    book_id: str


SOURCES = [
    SourceSpec(
        filename="buaa-781-answers.txt",
        subject_code="781",
        subject_name="马克思主义理论与思想政治教育",
        book_id="exam-buaa-781",
    ),
    SourceSpec(
        filename="buaa-882-answers.txt",
        subject_code="882",
        subject_name="马克思主义中国化",
        book_id="exam-buaa-882",
    ),
]


def canonical_question_type(label: str) -> str | None:
    normalized = re.sub(r"\s+", "", label)
    for keyword, question_type in QUESTION_TYPE_KEYWORDS.items():
        if keyword in normalized:
            return question_type
    return None


def clean_paragraphs(lines: list[str]) -> str:
    cleaned_lines: list[str] = []
    for raw in lines:
        line = raw.replace("\f", "").strip()
        if not line:
            continue
        if re.fullmatch(r"\d+", line):
            continue
        cleaned_lines.append(line)
    text = "".join(cleaned_lines)
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"(?<=[\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff，。；：？！、“”‘’（）])", "", text)
    text = re.sub(r"(?<=[，。；：？！、“”‘’（）])\s+(?=[\u4e00-\u9fff])", "", text)
    return text.strip()


def split_title_and_answer(lines: list[str]) -> tuple[str, str]:
    if not lines:
        return "", ""
    title_lines = [lines[0].strip()]
    answer_start = 1
    for index in range(1, len(lines)):
        if not lines[index].strip():
            answer_start = index + 1
            break
        title_lines.append(lines[index].strip())
        answer_start = index + 1
    title = re.sub(r"\s+", "", "".join(title_lines))
    answer = clean_paragraphs(lines[answer_start:])
    return title, answer


def normalize_front(title: str, question_type: str) -> str:
    title = title.strip("。；; ")
    if question_type in {"辨析题", "判断题"} and not title.startswith(("辨析", "判断")):
        return f"辨析：{title}"
    return title


def infer_subject(spec: SourceSpec, front: str, answer: str) -> str:
    text = f"{front}{answer}"
    if spec.subject_code == "781":
        if re.search(r"思想政治教育|思政|教育者|受教育者|灌输|育人|教师|理想信念教育", text):
            return "思想政治教育"
        return "马克思主义基本原理"
    if re.search(
        r"鸦片战争|辛亥|新文化运动|抗日战争|国民革命|新民主主义革命|古田会议|中共[一二三四五六七八九十]+大|近代中国|三民主义|清末|中华民国|长征|土地革命|解放战争",
        text,
    ):
        return "中国近现代史与中共党史"
    return "马克思主义中国化"


def infer_difficulty(question_type: str) -> str:
    if question_type == "名词解释":
        return "基础"
    if question_type in {"简答题", "判断题"}:
        return "进阶"
    return "冲刺"


def infer_thinkers(text: str) -> list[str]:
    return [name for name in THINKERS if name in text]


def parse_source(spec: SourceSpec) -> list[dict[str, object]]:
    source_path = SOURCE_ROOT / spec.filename
    lines = source_path.read_text(encoding="utf-8").splitlines()
    records: list[dict[str, object]] = []
    year = ""
    question_type: str | None = None
    current_lines: list[str] = []
    current_number = ""
    record_serial = 0

    def flush() -> None:
        nonlocal current_lines, current_number, record_serial
        if not year or not question_type or not current_lines:
            current_lines = []
            current_number = ""
            return
        title, answer = split_title_and_answer(current_lines)
        front = normalize_front(title, question_type)
        if not (2 <= len(front) <= 180 and len(answer) >= 90):
            current_lines = []
            current_number = ""
            return
        subject = infer_subject(spec, front, answer)
        text = f"{front}{answer}"
        record_serial += 1
        records.append(
            {
                "id": f"exam-buaa-{spec.subject_code}-{year}-{record_serial:02d}",
                "front": front,
                "back": answer,
                "answerTemplate": ANSWER_TEMPLATES[question_type],
                "sourceBookId": spec.book_id,
                "subject": subject,
                "thinkers": infer_thinkers(text),
                "questionType": question_type,
                "difficulty": infer_difficulty(question_type),
                "exam": {
                    "institution": "北京航空航天大学",
                    "year": int(year),
                    "subjectCode": spec.subject_code,
                    "subjectName": spec.subject_name,
                    "questionType": question_type,
                    "questionNumber": current_number,
                    "sourceTitle": f"北京航空航天大学 {year} 年 {spec.subject_code} 真题参考答案",
                },
            }
        )
        current_lines = []
        current_number = ""

    for raw_line in lines:
        year_match = YEAR_PATTERN.match(raw_line)
        if year_match:
            flush()
            year = year_match.group(1)
            question_type = None
            continue

        section_match = SECTION_PATTERN.match(raw_line)
        if section_match:
            section_label = section_match.group(2)
            candidate = canonical_question_type(section_label)
            if candidate or re.search(r"填空|选择|默写", section_label):
                flush()
                # 遇到填空题等不适合制成独立问答卡的章节时暂停收集，
                # 防止上一题答案把后续整章内容错误吞并。答案内部的分点标题不在此列。
                question_type = candidate
                continue

        question_match = QUESTION_PATTERN.match(raw_line)
        if question_match and question_type:
            flush()
            current_number = question_match.group(1)
            current_lines = [question_match.group(2)]
            continue

        if current_lines:
            current_lines.append(raw_line)

    flush()
    return records


def validate(records: list[dict[str, object]]) -> None:
    ids = [str(record["id"]) for record in records]
    if len(ids) != len(set(ids)):
        raise RuntimeError("Generated exam card IDs are not unique.")
    for record in records:
        exam = record["exam"]
        if not isinstance(exam, dict):
            raise RuntimeError(f"Missing exam metadata: {record['id']}")
        if not record["front"] or not record["back"]:
            raise RuntimeError(f"Incomplete card: {record['id']}")


def main() -> None:
    records: list[dict[str, object]] = []
    for source in SOURCES:
        records.extend(parse_source(source))
    records.sort(
        key=lambda item: (
            str(item["exam"]["institution"]),
            str(item["exam"]["subjectCode"]),
            -int(item["exam"]["year"]),
            str(item["questionType"]),
            str(item["id"]),
        )
    )
    validate(records)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    counts: dict[str, int] = {}
    for record in records:
        key = f"{record['exam']['subjectCode']}-{record['exam']['year']}"
        counts[key] = counts.get(key, 0) + 1
    print(f"Generated {len(records)} exam records -> {OUTPUT}")
    for key, count in sorted(counts.items()):
        print(f"{key}: {count}")


if __name__ == "__main__":
    main()
