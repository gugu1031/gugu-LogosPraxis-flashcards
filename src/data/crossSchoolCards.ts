import { seedCard } from "@/data/cardFactory";
import type { StudyCard } from "@/types";

interface CrossSchoolRecord {
  id: string;
  institution: string;
  year: number;
  subjectCode?: string;
  subjectName: string;
  questionType: string;
  front: string;
  back: string;
  bookId: string;
  sourceTitle: string;
  difficulty?: StudyCard["tags"]["difficulty"];
}

const records: CrossSchoolRecord[] = [
  {
    id: "exam-nju-2024-ipe-management",
    institution: "南京大学",
    year: 2024,
    subjectName: "思想政治教育学原理",
    questionType: "名词解释",
    front: "思想政治教育管理",
    back: "思想政治教育管理是思想政治教育领导部门、主管机构及其管理人员，运用计划、组织、指挥、协调和控制等管理手段，对思想政治教育资源进行有效整合，以实现教育目的、完成教育任务的创造性活动。它兼具明确的政治方向、系统协调性和动态调控性。",
    bookId: "exam-topic-ideological-education",
    sourceTitle: "《思政专题》真题班资料"
  },
  {
    id: "exam-scute-2024-cultural-education",
    institution: "华南理工大学",
    year: 2024,
    subjectName: "思想政治教育学原理",
    questionType: "名词解释",
    front: "文化育人",
    back: "文化育人是以先进文化为内容和载体，通过文化环境、文化活动、文化产品与制度文化的熏陶感染，引导受教育者形成正确价值观念和稳定行为方式的育人过程。其关键是把价值引领融入日常文化生活，实现以文化人、以文育人。",
    bookId: "exam-topic-ideological-education",
    sourceTitle: "《思政专题》真题班资料"
  },
  {
    id: "exam-hnu-2024-ipe-tasks",
    institution: "湖南大学",
    year: 2024,
    subjectName: "思想政治教育学原理",
    questionType: "简答题",
    front: "思想政治教育的主要任务是什么？",
    back: "主要任务是以理想信念教育为核心，以爱国主义教育为重点，以基本道德规范为基础，以人的全面发展为目标，引导人们形成正确的世界观、人生观、价值观，坚定政治方向，提升思想道德素质，并把思想认同转化为服务社会的实际行动。",
    bookId: "exam-topic-ideological-education",
    sourceTitle: "《思政专题》真题班资料"
  },
  {
    id: "exam-nankai-2024-ideal-belief",
    institution: "南开大学",
    year: 2024,
    subjectName: "思想政治教育学原理",
    questionType: "简答题",
    front: "为什么理想信念教育是思想政治教育的核心？",
    back: "理想信念集中体现对社会发展规律、奋斗目标和人生价值的根本认识，规定思想政治教育的方向。它为个体提供精神支柱和行动动力，把政治认同、价值认同与道德实践贯通起来。抓住理想信念教育，就抓住了世界观、人生观、价值观建设的总开关。",
    bookId: "exam-topic-ideological-education",
    sourceTitle: "《思政专题》真题班资料",
    difficulty: "进阶"
  },
  {
    id: "exam-whu-2018-environment-education",
    institution: "武汉大学",
    year: 2018,
    subjectName: "思想政治教育学原理",
    questionType: "简答题",
    front: "如何正确对待环境影响和思想政治教育的关系？",
    back: "环境是思想品德形成的重要外部条件，但环境影响不是机械决定。思想政治教育能够帮助受教育者认识、选择和改造环境，并通过营造良好社会文化氛围增强积极影响。应坚持教育与环境建设并举，同时发挥受教育者的主观能动性。",
    bookId: "exam-topic-ideological-education",
    sourceTitle: "《思政专题》真题班资料",
    difficulty: "进阶"
  },
  {
    id: "exam-pku-2024-new-culture",
    institution: "北京大学",
    year: 2024,
    subjectName: "中国近现代史",
    questionType: "简答题",
    front: "简述新文化运动。",
    back: "新文化运动以《新青年》和北京大学为主要阵地，高举民主与科学旗帜，批判封建礼教，提倡新道德和白话文，推动思想解放。它为马克思主义在中国传播创造了条件，但早期也存在对传统文化简单否定、脱离群众等局限。五四运动后其主流逐步转向传播马克思主义。",
    bookId: "exam-topic-modern-history",
    sourceTitle: "《近现代史专题》真题班资料"
  },
  {
    id: "exam-tju-2024-modern-start",
    institution: "天津大学",
    year: 2024,
    subjectName: "中国近现代史",
    questionType: "简答题",
    front: "为什么1840年是中国近代史的开端？",
    back: "鸦片战争后，中国主权和领土完整遭到破坏，独立的封建中国逐步变为半殖民地半封建社会；社会主要矛盾由地主阶级与农民阶级的矛盾，扩展为帝国主义与中华民族、封建主义与人民大众的矛盾；反帝反封建成为近代中国的两大历史任务。",
    bookId: "exam-topic-modern-history",
    sourceTitle: "《近现代史专题》真题班资料"
  },
  {
    id: "exam-hit-2024-chinese-learning",
    institution: "哈尔滨工业大学",
    year: 2024,
    subjectName: "中国近现代史",
    questionType: "名词解释",
    front: "中体西用",
    back: "“中体西用”是洋务派的指导思想，即以中国封建伦理纲常和政治制度为根本，以西方近代军事、科技和工艺为辅助。它在一定程度上推动近代工业和技术发展，但拒绝触动封建制度，无法解决中国落后的根本问题。",
    bookId: "exam-topic-modern-history",
    sourceTitle: "《近现代史专题》真题班资料"
  },
  {
    id: "exam-muc-2024-three-principles",
    institution: "中央民族大学",
    year: 2024,
    subjectName: "中国近现代史",
    questionType: "简答题",
    front: "简述三民主义的基本内容。",
    back: "三民主义包括民族主义、民权主义和民生主义。民族主义主张反对民族压迫、实现民族独立；民权主义主张推翻君主专制、建立民主共和国；民生主义以平均地权为主要内容。它是较完整的资产阶级民主革命纲领，但没有明确彻底反帝反封建。",
    bookId: "exam-topic-modern-history",
    sourceTitle: "《近现代史专题》真题班资料"
  },
  {
    id: "exam-xjtu-2024-may-fourth",
    institution: "西安交通大学",
    year: 2024,
    subjectName: "中国近现代史",
    questionType: "简答题",
    front: "简述五四运动的历史意义。",
    back: "五四运动是一场彻底反帝反封建的伟大爱国革命运动、广泛深刻的社会革命运动和伟大思想启蒙运动。工人阶级开始以独立政治力量登上历史舞台，马克思主义进一步传播并同工人运动结合，为中国共产党成立作了思想上干部上的准备，是新民主主义革命的开端。",
    bookId: "exam-topic-modern-history",
    sourceTitle: "《近现代史专题》真题班资料"
  },
  {
    id: "exam-csu-2024-party-founding",
    institution: "中南大学",
    year: 2024,
    subjectName: "中国近现代史",
    questionType: "简答题",
    front: "为什么说中国共产党成立是开天辟地的大事变？",
    back: "中国共产党的成立使中国革命有了坚强领导核心、科学理论指导和新的革命方法，深刻改变了近代以后中华民族发展的方向和进程，改变了中国人民和中华民族的前途命运，也改变了世界发展的趋势和格局。自此中国革命面貌焕然一新。",
    bookId: "exam-topic-modern-history",
    sourceTitle: "《近现代史专题》真题班资料"
  },
  {
    id: "exam-buaa-2024-invasion-debate",
    institution: "北京航空航天大学",
    year: 2024,
    subjectCode: "882",
    subjectName: "中国近现代史",
    questionType: "辨析题",
    front: "辨析：资本—帝国主义的入侵推动了中国发展。",
    back: "该说法片面。外国资本主义的进入客观上传播了某些近代生产方式和技术，并冲击封建自然经济，但侵略的根本目的在于掠夺和控制中国。它破坏主权、阻碍民族工业独立发展，使中国陷入半殖民地半封建社会。不能用有限的客观影响掩盖侵略的主导性质和严重后果。",
    bookId: "exam-topic-modern-history",
    sourceTitle: "《近现代史专题》真题班资料",
    difficulty: "进阶"
  },
  {
    id: "exam-bit-2024-thinking-limit",
    institution: "北京理工大学",
    year: 2024,
    subjectName: "马克思主义经典著作",
    questionType: "简答题",
    front: "如何理解恩格斯所说人的思维既至上又非至上、认识能力既无限又有限？",
    back: "就人类世代延续的认识能力、本性和历史使命而言，思维能够不断接近并把握客观世界，因而是至上和无限的；就每个时代、每个个人及每次具体认识而言，又受实践水平、历史条件和对象复杂性限制，因而是非至上和有限的。二者体现认识的绝对性与相对性的统一。",
    bookId: "exam-topic-classics-history",
    sourceTitle: "《马克思主义经典著作和马克思主义发展史真题解析》",
    difficulty: "冲刺"
  },
  {
    id: "exam-tongji-2024-anatomy-method",
    institution: "同济大学",
    year: 2024,
    subjectName: "马克思主义经典著作",
    questionType: "论述题",
    front: "如何理解“人体解剖对于猴体解剖是一把钥匙”所体现的研究方法？",
    back: "马克思借此说明较高级、较成熟的社会形态有助于理解较低级形态中尚未充分展开的结构和关系。研究历史范畴不能把现代关系简单投射到过去，而要从成熟形态揭示一般联系，再具体分析其在早期形态中的特殊存在方式。这体现从抽象上升到具体和逻辑与历史相统一的方法。",
    bookId: "exam-topic-classics-history",
    sourceTitle: "《马克思主义经典著作和马克思主义发展史真题解析》",
    difficulty: "冲刺"
  },
  {
    id: "exam-zhongshan-2024-fetishism",
    institution: "中山大学",
    year: 2024,
    subjectName: "马克思主义经典著作",
    questionType: "论述题",
    front: "如何理解商品形式把人的社会关系反映成物的属性？",
    back: "私人劳动只有通过商品交换才表现为社会劳动，生产者之间的社会关系因而采取商品之间价值关系的物化形式。价值仿佛成了物的天然属性，人与人的关系被颠倒为物与物的关系，这就是商品拜物教的奥秘。其根源不是认识错误，而是商品生产的现实社会结构。",
    bookId: "exam-topic-classics-history",
    sourceTitle: "《马克思主义经典著作和马克思主义发展史真题解析》",
    difficulty: "冲刺"
  },
  {
    id: "exam-fudan-2024-party-relations",
    institution: "复旦大学",
    year: 2024,
    subjectName: "马克思主义经典著作",
    questionType: "论述题",
    front: "《共产党宣言》如何论述共产党同无产阶级及其他反对党派的关系？",
    back: "共产党没有同整个无产阶级利益不同的特殊利益，始终代表无产阶级运动的整体利益和未来方向，是最坚决、最先进的部分。对其他反对党派，共产党支持一切反对现存社会政治制度的革命运动，同时不放弃批判立场，并在联合行动中公开说明自己的最终目的。",
    bookId: "exam-topic-classics-history",
    sourceTitle: "《马克思主义经典著作和马克思主义发展史真题解析》",
    difficulty: "冲刺"
  },
  {
    id: "exam-pku-2024-production-relations",
    institution: "北京大学",
    year: 2024,
    subjectName: "马克思主义发展史",
    questionType: "论述题",
    front: "生产关系范畴在历史唯物主义和政治经济学中有何区别与联系？",
    back: "历史唯物主义把生产关系作为社会结构的基础，考察它同生产力、上层建筑及社会形态更替的关系；政治经济学则深入分析特定生产方式中生产、分配、交换、消费关系及其经济规律。二者研究层次不同但对象贯通，政治经济学的具体分析为唯物史观提供经济内容，唯物史观为政治经济学提供总体方法。",
    bookId: "exam-topic-classics-history",
    sourceTitle: "《马克思主义经典著作和马克思主义发展史真题解析》",
    difficulty: "冲刺"
  },
  {
    id: "exam-scu-2024-utopian-socialism",
    institution: "四川大学",
    year: 2024,
    subjectName: "马克思主义发展史",
    questionType: "简答题",
    front: "空想社会主义的历史贡献与局限是什么？",
    back: "空想社会主义深刻揭露资本主义弊端，提出消灭私有制、建立协作社会等理想，为科学社会主义提供思想材料。但它未能揭示资本主义运动规律和无产阶级历史使命，把社会主义寄托于理性设计、道德感化或少数人的示范实验，因而找不到实现理想的现实力量和正确道路。",
    bookId: "exam-topic-classics-history",
    sourceTitle: "《马克思主义经典著作和马克思主义发展史真题解析》",
    difficulty: "进阶"
  },
  {
    id: "exam-nwpu-2024-two-productions",
    institution: "西北工业大学",
    year: 2024,
    subjectName: "马克思主义经典著作",
    questionType: "简答题",
    front: "简述恩格斯在《家庭、私有制和国家的起源》中的“两种生产”理论。",
    back: "历史中的决定性因素归根到底包括两种生产：生活资料以及相应工具的生产，和人自身的生产即种的繁衍。一定历史时代和地区的社会制度，同时受劳动发展阶段和家庭发展阶段制约。理解该论断应坚持物质生产的基础地位，并看到人口生产与家庭关系的重要作用。",
    bookId: "exam-topic-classics-history",
    sourceTitle: "《马克思主义经典著作和马克思主义发展史真题解析》",
    difficulty: "进阶"
  }
];

const answerTemplate = (questionType: string) => {
  if (questionType === "名词解释") return "概念界定—核心内容—历史地位或影响。";
  if (questionType === "辨析题") return "先判断题干，再区分客观影响与根本性质，最后总结。";
  if (questionType === "论述题") return "解释原文或命题—展开理论逻辑—联系著作与历史—总结意义。";
  return "总述核心观点—分点展开—总结历史意义或方法论启示。";
};

export const crossSchoolExamCards: StudyCard[] = records.map((record) =>
  seedCard(
    record.id,
    record.front,
    record.back,
    {
      subjects: [record.subjectName, "院校真题"],
      thinkers: [],
      questionTypes: [record.questionType],
      difficulty: record.difficulty ?? (record.questionType === "名词解释" ? "基础" : "进阶"),
      eras: [`${record.year}年`],
      schools: [record.institution]
    },
    [{ bookId: record.bookId }],
    answerTemplate(record.questionType),
    {
      institution: record.institution,
      year: record.year,
      subjectCode: record.subjectCode,
      subjectName: record.subjectName,
      questionType: record.questionType,
      sourceTitle: record.sourceTitle
    }
  )
);
