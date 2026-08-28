import { seedCard } from "@/data/cardFactory";
import type { StudyCard } from "@/types";

interface CoreCardRecord {
  id: string;
  front: string;
  back: string;
  subject: string;
  thinker?: string;
  questionType: string;
  difficulty: StudyCard["tags"]["difficulty"];
  era: string;
  school: string;
  bookId: string;
}

const templateByType: Record<string, string> = {
  名词解释: "概念界定—核心特征—理论地位或现实意义。",
  简答题: "先作总述，再分点展开理论内容，最后点明方法论意义。",
  辨析题: "明确判断—界定概念—分析题干的合理性与片面性—得出结论。",
  论述题: "提出中心论点—阐明理论依据—分层论证—联系现实—总结提升。"
};

const records: CoreCardRecord[] = [
  {
    id: "core-mp-material-unity",
    front: "如何理解世界的物质统一性原理？",
    back: "世界的本原是物质，物质不依赖于人的意识而客观存在；意识是物质世界长期发展的产物和人脑的机能。世界虽有多样的事物和现象，但统一于物质。方法论上要求一切从实际出发，在实践中认识和改造世界。",
    subject: "马克思主义基本原理",
    questionType: "简答题",
    difficulty: "基础",
    era: "19世纪",
    school: "辩证唯物主义",
    bookId: "textbook-marxism-2023"
  },
  {
    id: "core-mp-consciousness",
    front: "意识的能动作用及其正确发挥条件是什么？",
    back: "意识能够能动地认识世界、指导实践改造世界，并调控人的行为和生理活动。正确发挥主观能动性必须以尊重客观规律为前提，以实践为基本途径，并依赖一定的物质条件和手段。既反对宿命论，也反对唯意志论。",
    subject: "马克思主义基本原理",
    questionType: "简答题",
    difficulty: "基础",
    era: "19世纪",
    school: "辩证唯物主义",
    bookId: "textbook-marxism-2023"
  },
  {
    id: "core-mp-practice",
    front: "实践的本质、基本特征和基本形式是什么？",
    back: "实践是人类能动改造世界的社会性物质活动，具有客观实在性、自觉能动性和社会历史性。基本形式包括物质生产实践、社会政治实践和科学文化实践。实践是认识的来源、动力、目的，也是检验真理的唯一标准。",
    subject: "马克思主义基本原理",
    questionType: "名词解释",
    difficulty: "基础",
    era: "19世纪",
    school: "马克思主义认识论",
    bookId: "textbook-marxism-2023"
  },
  {
    id: "core-mp-contradiction-universal-particular",
    front: "矛盾的普遍性与特殊性是什么关系？",
    back: "矛盾的普遍性指矛盾存在于一切事物及其发展全过程，特殊性指不同事物、同一事物不同阶段以及矛盾双方各有特点。二者相互联结：普遍性寓于特殊性之中，并通过特殊性表现；特殊性又包含普遍性。二者在一定条件下可以相互转化。",
    subject: "马克思主义基本原理",
    questionType: "简答题",
    difficulty: "进阶",
    era: "19世纪",
    school: "唯物辩证法",
    bookId: "textbook-marxism-2023"
  },
  {
    id: "core-mp-principal-contradiction",
    front: "主要矛盾与矛盾主要方面应如何区分？",
    back: "主要矛盾是在复杂矛盾体系中居支配地位、对事物发展起决定作用的矛盾，回答“诸多矛盾中抓哪一个”；矛盾主要方面是同一矛盾内部居支配地位的一方，主要规定事物性质，回答“同一矛盾中哪一方占主导”。二者都可能随条件变化而转化。",
    subject: "马克思主义基本原理",
    questionType: "辨析题",
    difficulty: "进阶",
    era: "19世纪",
    school: "唯物辩证法",
    bookId: "textbook-marxism-2023"
  },
  {
    id: "core-mp-quantity-quality",
    front: "量变与质变的辩证关系是什么？",
    back: "量变是事物数量增减和次序变动，质变是根本性质变化。量变是质变的必要准备，质变是量变的必然结果；质变又为新的量变开辟道路。方法论上既要重视日常积累，也要把握条件成熟时的飞跃，并坚持适度原则。",
    subject: "马克思主义基本原理",
    questionType: "简答题",
    difficulty: "基础",
    era: "19世纪",
    school: "唯物辩证法",
    bookId: "textbook-marxism-2023"
  },
  {
    id: "core-mp-negation",
    front: "辩证否定观的基本内容是什么？",
    back: "辩证否定是事物的自我否定，是发展和联系的环节，其实质是扬弃，即既克服又保留。事物发展表现为前进性与曲折性的统一。方法论上既不能全盘肯定，也不能全盘否定，而要以实践为尺度进行批判继承和创新发展。",
    subject: "马克思主义基本原理",
    questionType: "简答题",
    difficulty: "基础",
    era: "19世纪",
    school: "唯物辩证法",
    bookId: "textbook-marxism-2023"
  },
  {
    id: "core-mp-truth-absolute-relative",
    front: "真理的绝对性与相对性为什么是统一的？",
    back: "真理的绝对性指任何真理都包含不依赖于主体的客观内容，人类认识原则上能够正确认识无限发展的物质世界；相对性指具体真理都有适用条件和范围，对对象的认识也有待深化。绝对真理通过相对真理表现，无数相对真理构成绝对真理的发展过程。",
    subject: "马克思主义基本原理",
    questionType: "辨析题",
    difficulty: "进阶",
    era: "19世纪",
    school: "马克思主义认识论",
    bookId: "textbook-marxism-2023"
  },
  {
    id: "core-mp-truth-value",
    front: "真理尺度与价值尺度应如何统一？",
    back: "真理尺度要求人的实践符合客观规律，价值尺度要求实践满足人的合理需要。成功实践必须同时遵循二者：脱离真理的价值追求会陷入主观任性，脱离价值的真理运用也不能回答“为了谁”。二者在社会实践基础上具体地、历史地统一。",
    subject: "马克思主义基本原理",
    questionType: "简答题",
    difficulty: "进阶",
    era: "19世纪",
    school: "马克思主义认识论",
    bookId: "textbook-marxism-2023"
  },
  {
    id: "core-mp-social-being",
    front: "社会存在与社会意识的辩证关系是什么？",
    back: "社会存在决定社会意识，社会意识是社会存在的反映，并随社会存在变化发展。社会意识又具有相对独立性，表现为发展不完全同步、历史继承性、各种形式相互作用以及对社会存在的能动反作用。先进社会意识促进社会发展，落后社会意识阻碍社会发展。",
    subject: "马克思主义基本原理",
    questionType: "简答题",
    difficulty: "基础",
    era: "19世纪",
    school: "历史唯物主义",
    bookId: "textbook-marxism-2023"
  },
  {
    id: "core-mp-productive-relations",
    front: "生产力与生产关系的矛盾运动规律是什么？",
    back: "生产力决定生产关系的性质、形式及其变革，生产关系对生产力具有能动反作用：适合时促进，不适合时阻碍。二者由基本适合到基本不适合，再到新的基本适合，推动社会发展。改革生产关系必须以生产力状况为客观依据。",
    subject: "马克思主义基本原理",
    questionType: "简答题",
    difficulty: "基础",
    era: "19世纪",
    school: "历史唯物主义",
    bookId: "textbook-marxism-2023"
  },
  {
    id: "core-mp-base-superstructure",
    front: "经济基础与上层建筑的辩证关系是什么？",
    back: "经济基础是一定社会中占统治地位的生产关系总和，上层建筑是建立其上的意识形态以及相应制度、组织和设施。经济基础决定上层建筑，上层建筑反作用于经济基础；上层建筑是否进步，根本上取决于它所服务的经济基础是否符合生产力发展要求。",
    subject: "马克思主义基本原理",
    questionType: "简答题",
    difficulty: "基础",
    era: "19世纪",
    school: "历史唯物主义",
    bookId: "textbook-marxism-2023"
  },
  {
    id: "core-mp-masses",
    front: "为什么说人民群众是历史的创造者？",
    back: "人民群众是社会物质财富和精神财富的创造者，也是社会变革的决定力量。其创造作用受一定社会历史条件制约，并通过具体实践实现。坚持群众史观要求贯彻群众观点和群众路线，把人民立场作为根本政治立场，同时正确认识杰出人物的历史作用。",
    subject: "马克思主义基本原理",
    questionType: "论述题",
    difficulty: "进阶",
    era: "19世纪",
    school: "历史唯物主义",
    bookId: "textbook-marxism-2023"
  },
  {
    id: "core-pe-value",
    front: "商品价值量由什么决定？",
    back: "商品价值量由生产该商品的社会必要劳动时间决定，与社会必要劳动时间成正比，与劳动生产率成反比。简单劳动与复杂劳动的差别通过社会过程折算。个别劳动时间低于社会必要劳动时间的生产者可以获得竞争优势。",
    subject: "马克思主义政治经济学",
    thinker: "马克思",
    questionType: "简答题",
    difficulty: "基础",
    era: "19世纪",
    school: "马克思主义政治经济学",
    bookId: "marx-capital"
  },
  {
    id: "core-pe-surplus-value",
    front: "剩余价值是怎样生产出来的？",
    back: "劳动力成为商品是货币转化为资本的前提。劳动力价值由维持和再生产劳动力所需生活资料的价值决定，但劳动力的使用能创造大于自身价值的新价值。雇佣工人在剩余劳动时间创造的、被资本家无偿占有的价值就是剩余价值。",
    subject: "马克思主义政治经济学",
    thinker: "马克思",
    questionType: "论述题",
    difficulty: "进阶",
    era: "19世纪",
    school: "剩余价值理论",
    bookId: "marx-capital"
  },
  {
    id: "core-pe-absolute-relative",
    front: "绝对剩余价值与相对剩余价值有何区别和联系？",
    back: "绝对剩余价值是在必要劳动时间不变时延长工作日形成的；相对剩余价值是在工作日长度不变时，通过提高社会劳动生产率、降低劳动力价值而缩短必要劳动时间形成的。二者都以延长剩余劳动时间为实质，是资本家提高剥削程度的基本方法。",
    subject: "马克思主义政治经济学",
    thinker: "马克思",
    questionType: "辨析题",
    difficulty: "进阶",
    era: "19世纪",
    school: "剩余价值理论",
    bookId: "marx-capital"
  },
  {
    id: "core-pe-accumulation",
    front: "资本积累的实质和主要后果是什么？",
    back: "资本积累是剩余价值资本化，实质是资本家用无偿占有的剩余价值扩大资本规模，继续占有更多剩余价值。积累推动资本有机构成提高、资本积聚与集中，并形成相对过剩人口，使财富在资本一端积累、贫困在劳动一端积累，体现资本主义积累的一般规律。",
    subject: "马克思主义政治经济学",
    thinker: "马克思",
    questionType: "论述题",
    difficulty: "冲刺",
    era: "19世纪",
    school: "资本积累理论",
    bookId: "marx-capital"
  },
  {
    id: "core-pe-crisis",
    front: "资本主义经济危机的实质与根源是什么？",
    back: "经济危机的实质是生产相对过剩，即相对于劳动群众有支付能力的需求而过剩。根本原因是生产社会化与生产资料资本主义私人占有之间的基本矛盾，具体表现为个别企业生产有组织性与全社会生产无政府状态的矛盾、生产无限扩大的趋势与劳动群众有支付能力需求相对缩小的矛盾。",
    subject: "马克思主义政治经济学",
    thinker: "马克思",
    questionType: "论述题",
    difficulty: "冲刺",
    era: "19世纪",
    school: "资本主义基本矛盾",
    bookId: "marx-capital"
  },
  {
    id: "core-mao-living-soul",
    front: "毛泽东思想活的灵魂包括哪些基本方面？",
    back: "毛泽东思想活的灵魂是贯穿其立场、观点、方法的三个基本方面：实事求是、群众路线、独立自主。实事求是是根本思想路线，群众路线是党的根本工作路线，独立自主是立足自身力量走自己道路的必然结论，三者相互贯通。",
    subject: "毛泽东思想和中国特色社会主义理论体系",
    thinker: "毛泽东",
    questionType: "简答题",
    difficulty: "基础",
    era: "20世纪",
    school: "毛泽东思想",
    bookId: "textbook-mao-2023"
  },
  {
    id: "core-mao-new-democracy",
    front: "新民主主义革命的性质为什么仍是资产阶级民主主义革命？",
    back: "其任务是反对帝国主义、封建主义和官僚资本主义，所要改变的是半殖民地半封建社会形态，因此性质属于民主主义革命；但它由无产阶级领导，以马克思主义为指导，以社会主义和共产主义为前途，属于世界无产阶级社会主义革命的一部分，因而是新式的资产阶级民主革命。",
    subject: "毛泽东思想和中国特色社会主义理论体系",
    thinker: "毛泽东",
    questionType: "辨析题",
    difficulty: "进阶",
    era: "20世纪",
    school: "新民主主义革命理论",
    bookId: "textbook-mao-2023"
  },
  {
    id: "core-mao-three-weapons",
    front: "中国革命取得胜利的三大法宝是什么？",
    back: "统一战线、武装斗争、党的建设是中国革命的三大法宝。统一战线解决团结谁的问题，武装斗争是主要斗争形式，党的建设是掌握前两者并取得胜利的根本保证。三者必须在党的领导下相互配合。",
    subject: "毛泽东思想和中国特色社会主义理论体系",
    thinker: "毛泽东",
    questionType: "简答题",
    difficulty: "基础",
    era: "20世纪",
    school: "新民主主义革命理论",
    bookId: "textbook-mao-2023"
  },
  {
    id: "core-mao-socialist-transformation",
    front: "我国社会主义改造道路的基本特点是什么？",
    back: "我国创造性地开辟了适合中国特点的社会主义改造道路：对农业、手工业采取合作化道路，对资本主义工商业实行和平赎买；把制度改造同人的改造结合，把改造所有制同发展生产力结合，采取积极引导、逐步过渡的方法，实现了由新民主主义向社会主义的转变。",
    subject: "毛泽东思想和中国特色社会主义理论体系",
    thinker: "毛泽东",
    questionType: "论述题",
    difficulty: "进阶",
    era: "20世纪",
    school: "社会主义改造理论",
    bookId: "textbook-mao-2023"
  },
  {
    id: "core-mao-socialist-contradictions",
    front: "社会主义社会两类不同性质的矛盾如何处理？",
    back: "社会主义社会存在敌我矛盾和人民内部矛盾。敌我矛盾是对抗性的，要用专政方法解决；人民内部矛盾一般是非对抗性的，要用民主方法，即“团结—批评—团结”的方针解决。两类矛盾在一定条件下可能相互转化，必须正确区分、妥善处理。",
    subject: "毛泽东思想和中国特色社会主义理论体系",
    thinker: "毛泽东",
    questionType: "简答题",
    difficulty: "进阶",
    era: "20世纪",
    school: "社会主义建设理论",
    bookId: "textbook-mao-2023"
  },
  {
    id: "core-deng-socialism-essence",
    front: "邓小平关于社会主义本质的概括是什么？",
    back: "社会主义的本质是解放生产力、发展生产力，消灭剥削、消除两极分化，最终达到共同富裕。这一概括把生产力目标与社会主义价值目标统一起来，突破了仅从制度特征理解社会主义的局限，为改革开放和社会主义现代化建设提供了根本遵循。",
    subject: "毛泽东思想和中国特色社会主义理论体系",
    thinker: "邓小平",
    questionType: "名词解释",
    difficulty: "基础",
    era: "20世纪",
    school: "邓小平理论",
    bookId: "textbook-mao-2023"
  },
  {
    id: "core-primary-stage",
    front: "社会主义初级阶段基本路线的核心内容是什么？",
    back: "领导和团结全国各族人民，以经济建设为中心，坚持四项基本原则，坚持改革开放，自力更生、艰苦创业，为把我国建设成为富强民主文明和谐美丽的社会主义现代化强国而奋斗。通常概括为“一个中心、两个基本点”。",
    subject: "毛泽东思想和中国特色社会主义理论体系",
    questionType: "简答题",
    difficulty: "基础",
    era: "当代",
    school: "中国特色社会主义理论体系",
    bookId: "textbook-mao-2023"
  },
  {
    id: "core-new-era-contradiction",
    front: "新时代我国社会主要矛盾是什么？",
    back: "新时代我国社会主要矛盾已经转化为人民日益增长的美好生活需要和不平衡不充分的发展之间的矛盾。这一变化反映我国发展阶段和人民需要的深刻变化，但没有改变我国仍处于并将长期处于社会主义初级阶段的基本国情，也没有改变我国的国际地位。",
    subject: "习近平新时代中国特色社会主义思想",
    thinker: "习近平",
    questionType: "简答题",
    difficulty: "基础",
    era: "当代",
    school: "新时代中国特色社会主义",
    bookId: "textbook-xi-2023"
  },
  {
    id: "core-chinese-modernization",
    front: "中国式现代化的中国特色有哪些？",
    back: "中国式现代化是人口规模巨大的现代化，是全体人民共同富裕的现代化，是物质文明和精神文明相协调的现代化，是人与自然和谐共生的现代化，是走和平发展道路的现代化。其本质要求贯穿党的领导、中国特色社会主义和人的全面发展。",
    subject: "习近平新时代中国特色社会主义思想",
    thinker: "习近平",
    questionType: "简答题",
    difficulty: "基础",
    era: "当代",
    school: "中国式现代化",
    bookId: "textbook-xi-2023"
  },
  {
    id: "core-two-combinations",
    front: "如何理解“两个结合”？",
    back: "“两个结合”是把马克思主义基本原理同中国具体实际相结合、同中华优秀传统文化相结合。第一个结合强调从国情出发解决实际问题，第二个结合拓展理论创新的文化根基与思想空间。二者共同揭示马克思主义中国化时代化的根本途径。",
    subject: "习近平新时代中国特色社会主义思想",
    thinker: "习近平",
    questionType: "论述题",
    difficulty: "进阶",
    era: "当代",
    school: "马克思主义中国化时代化",
    bookId: "textbook-xi-2023"
  },
  {
    id: "core-ipe-essence",
    front: "思想政治教育的本质是什么？",
    back: "思想政治教育是一定阶级、政党和社会群体用一定思想观念、政治观点和道德规范，对成员施加有目的、有计划、有组织的影响，使其形成符合一定社会要求的思想品德的社会实践活动。社会主义思想政治教育的本质在于坚持主流意识形态主导并促进人的全面发展。",
    subject: "思想政治教育",
    questionType: "名词解释",
    difficulty: "基础",
    era: "当代",
    school: "思想政治教育学原理",
    bookId: "ideological-education"
  },
  {
    id: "core-ipe-elements",
    front: "思想政治教育过程包含哪些基本要素？",
    back: "基本要素通常包括教育者、受教育者、教育内容、教育方法和教育环境。教育者发挥组织引导作用，受教育者是教育对象也是能动主体，内容是价值与理论载体，方法连接教育目的与效果，环境构成活动条件。各要素相互联系并动态作用。",
    subject: "思想政治教育",
    questionType: "简答题",
    difficulty: "基础",
    era: "当代",
    school: "思想政治教育学原理",
    bookId: "ideological-education"
  },
  {
    id: "core-ipe-process",
    front: "思想政治教育过程的基本规律是什么？",
    back: "思想政治教育过程是教育者按照社会要求施加教育影响，促使受教育者思想品德形成和发展的过程。其基本规律集中体现为教育者的教育引导与受教育者思想品德自主建构之间的矛盾运动，并受社会要求、个体需要和环境因素共同制约。",
    subject: "思想政治教育",
    questionType: "简答题",
    difficulty: "进阶",
    era: "当代",
    school: "思想政治教育过程论",
    bookId: "ideological-education"
  },
  {
    id: "core-ipe-internalization",
    front: "思想品德形成中的内化与外化是什么关系？",
    back: "内化是受教育者把社会思想道德要求转化为自身认识、情感、信念和意志，外化是把内在品德转化为行为和习惯。内化是外化的思想基础，外化是内化的表现与检验；实践中的外化结果又会反馈并深化内化，二者循环推进。",
    subject: "思想政治教育",
    questionType: "辨析题",
    difficulty: "进阶",
    era: "当代",
    school: "思想品德形成发展",
    bookId: "ideological-education"
  },
  {
    id: "core-ipe-direction",
    front: "思想政治教育为什么必须坚持方向原则？",
    back: "方向原则要求思想政治教育始终以正确政治方向和价值导向统摄内容、方法与实践。它由思想政治教育的意识形态属性和育人使命决定。贯彻这一原则既要坚持马克思主义指导和党的领导，也要把坚定方向与尊重教育规律、回应现实问题结合起来。",
    subject: "思想政治教育",
    questionType: "论述题",
    difficulty: "进阶",
    era: "当代",
    school: "思想政治教育原则",
    bookId: "ideological-education"
  },
  {
    id: "core-ipe-theory-practice",
    front: "如何贯彻理论教育与实践教育相结合原则？",
    back: "理论教育提供科学认识和价值方向，实践教育使受教育者在真实活动中体验、检验并转化理论。贯彻时要坚持理论联系实际，围绕现实问题组织社会调查、志愿服务和劳动实践，并通过反思总结实现从感性体验到理性认同、再到稳定行为的转化。",
    subject: "思想政治教育",
    questionType: "简答题",
    difficulty: "进阶",
    era: "当代",
    school: "思想政治教育原则",
    bookId: "ideological-education"
  },
  {
    id: "core-ipe-methods",
    front: "思想政治教育常用的基本方法有哪些？",
    back: "常用方法包括理论教育法、实践教育法、批评与自我批评法、榜样示范法、比较鉴别法、咨询辅导法以及自我教育法等。方法选择要服务教育目标，依据对象特点、内容性质和环境条件灵活组合，并在实践反馈中调整。",
    subject: "思想政治教育",
    questionType: "简答题",
    difficulty: "基础",
    era: "当代",
    school: "思想政治教育方法论",
    bookId: "ideological-education"
  },
  {
    id: "core-ipe-carrier",
    front: "什么是思想政治教育载体？",
    back: "思想政治教育载体是承载并传递教育内容、连接教育者与受教育者的活动形式和物质依托。主要包括管理、文化、活动、大众传播和网络等载体。有效运用载体要把思想内容融入具体业务和日常生活，避免载体形式与育人目的相脱节。",
    subject: "思想政治教育",
    questionType: "名词解释",
    difficulty: "基础",
    era: "当代",
    school: "思想政治教育载体论",
    bookId: "ideological-education"
  },
  {
    id: "core-ipe-environment",
    front: "思想政治教育环境具有怎样的作用？",
    back: "环境通过社会制度、经济生活、文化舆论、组织氛围和家庭交往等因素，对人的思想品德产生广泛而持续的影响。环境既可能强化教育，也可能抵消教育。教育者要主动认识、选择、优化和利用环境，同时提升受教育者辨别与改造环境的能力。",
    subject: "思想政治教育",
    questionType: "论述题",
    difficulty: "进阶",
    era: "当代",
    school: "思想政治教育环境论",
    bookId: "ideological-education"
  },
  {
    id: "core-ipe-evaluation",
    front: "思想政治教育评估应遵循哪些基本要求？",
    back: "评估要坚持方向性、客观性、全面性、动态性和可操作性，兼顾过程与结果、定性与定量、社会评价与个体发展。既考察知识掌握，更关注价值认同和行为变化；评估结果应反馈到目标、内容和方法调整中，形成改进闭环。",
    subject: "思想政治教育",
    questionType: "简答题",
    difficulty: "进阶",
    era: "当代",
    school: "思想政治教育评估",
    bookId: "ideological-education"
  },
  {
    id: "core-plato-forms",
    front: "柏拉图的理念论如何说明理念与具体事物的关系？",
    back: "理念是普遍、恒常且可知的本质，具体事物处于生成变化之中。具体事物因分有或摹仿理念而成为某种事物，理念则不因个别事物变化而改变。理念论试图为知识的普遍必然性奠基，但也留下两个世界如何关联的难题。",
    subject: "西方哲学史",
    thinker: "柏拉图",
    questionType: "简答题",
    difficulty: "基础",
    era: "古希腊",
    school: "古希腊哲学",
    bookId: "plato-republic"
  },
  {
    id: "core-aristotle-substance",
    front: "亚里士多德的实体学说核心是什么？",
    back: "实体首先是具体个体，是其他范畴的承担者而自身不述说一个主体。具体实体由质料与形式构成：质料提供可能性，形式使事物成为现实的某物。通过实体、形式与四因说，亚里士多德既批评理念与个物分离，也解释具体事物的生成变化。",
    subject: "西方哲学史",
    thinker: "亚里士多德",
    questionType: "名词解释",
    difficulty: "进阶",
    era: "古希腊",
    school: "古希腊哲学",
    bookId: "aristotle-metaphysics"
  },
  {
    id: "core-descartes-cogito",
    front: "“我思故我在”在笛卡尔哲学中有何作用？",
    back: "笛卡尔以方法论怀疑排除一切可疑知识，但怀疑本身是一种思想活动，因此正在思想的“我”不能被怀疑。“我思故我在”成为清楚分明的第一原则，并以此重建知识体系。它突出主体性，也加深了心灵与物体的二元区分。",
    subject: "西方哲学史",
    thinker: "笛卡尔",
    questionType: "论述题",
    difficulty: "进阶",
    era: "17世纪",
    school: "近代唯理论",
    bookId: "descartes-meditations"
  },
  {
    id: "core-hume-causality",
    front: "休谟如何分析因果关系？",
    back: "经验只呈现事件的恒常会合和先后相继，并不呈现一种必然联系。我们因重复观察形成习惯，由一个事件期待另一个事件，因果必然性由此成为心灵的信念而非可直接经验的属性。这一分析动摇了传统形而上学和归纳知识的必然性基础。",
    subject: "西方哲学史",
    thinker: "休谟",
    questionType: "简答题",
    difficulty: "进阶",
    era: "18世纪",
    school: "近代经验论",
    bookId: "hume-enquiry"
  },
  {
    id: "core-kant-synthetic-apriori",
    front: "什么是先天综合判断？",
    back: "先天综合判断不依赖具体经验而具有普遍必然性，同时谓词又为主词增加新内容。康德认为数学和自然科学基本原理属于此类判断，并把“先天综合判断如何可能”作为批判哲学的核心问题，通过感性形式和知性范畴说明经验知识的先天条件。",
    subject: "西方哲学史",
    thinker: "康德",
    questionType: "名词解释",
    difficulty: "进阶",
    era: "18世纪",
    school: "德国古典哲学",
    bookId: "kant-pure-reason"
  },
  {
    id: "core-hegel-dialectic",
    front: "黑格尔辩证法中的“否定性”有何意义？",
    back: "否定性不是对存在的外部破坏，而是概念和现实内部矛盾所形成的自我运动。规定因包含自身界限而转化为对立面，并在扬弃中既被取消又被保存，从而达到更具体的统一。否定性使真理成为展开的过程，而不是静止结论。",
    subject: "西方哲学史",
    thinker: "黑格尔",
    questionType: "论述题",
    difficulty: "冲刺",
    era: "19世纪",
    school: "德国古典哲学",
    bookId: "hegel-phenomenology"
  },
  {
    id: "core-heidegger-dasein",
    front: "海德格尔的“此在”概念为何重要？",
    back: "此在指我们自己所是的存在者，其独特性在于它在存在中总已领会存在，并能追问存在意义。此在不是孤立主体，而是“在世存在”，其基本结构涉及操心、与他人共在、被抛与筹划。通过分析此在，海德格尔重新开启存在问题。",
    subject: "西方哲学史",
    thinker: "海德格尔",
    questionType: "名词解释",
    difficulty: "进阶",
    era: "20世纪",
    school: "存在主义与现象学",
    bookId: "heidegger-selected"
  },
  {
    id: "core-merleau-body",
    front: "梅洛-庞蒂为何强调“身体主体”？",
    back: "身体不是被心灵操纵的客体，而是我们通达世界、形成意义的原初方式。知觉并非先接收感觉材料再作理智判断，而是身体在情境中的整体把握。身体主体概念克服主客二分，揭示意识、行动和世界之间前反思的交织关系。",
    subject: "西方哲学史",
    thinker: "梅洛-庞蒂",
    questionType: "简答题",
    difficulty: "进阶",
    era: "20世纪",
    school: "现象学",
    bookId: "merleau-ponty-phenomenology"
  },
  {
    id: "core-frankfurt-culture-industry",
    front: "法兰克福学派的“文化工业”批判指向什么？",
    back: "文化工业指文化在垄断资本和技术复制条件下按标准化商品逻辑生产。它用表面差异和娱乐满足遮蔽同质化，使受众趋于被动顺从，并把休闲纳入资本再生产。该批判揭示现代统治不仅依靠经济强制，也通过文化消费塑造意识。",
    subject: "西方马克思主义",
    thinker: "阿多诺",
    questionType: "名词解释",
    difficulty: "进阶",
    era: "20世纪",
    school: "法兰克福学派",
    bookId: "frankfurt-dialectic"
  },
  {
    id: "core-althusser-isa",
    front: "阿尔都塞如何区分镇压性国家机器与意识形态国家机器？",
    back: "镇压性国家机器以政府、军队、警察和法院等为代表，主要通过强制发挥作用；意识形态国家机器包括学校、家庭、宗教、媒体和文化机构等，主要通过意识形态发挥作用。二者都服务于既定生产关系的再生产，但作用方式和组织形态不同。",
    subject: "西方马克思主义",
    thinker: "阿尔都塞",
    questionType: "辨析题",
    difficulty: "冲刺",
    era: "20世纪",
    school: "结构主义马克思主义",
    bookId: "althusser-reading-capital"
  },
  {
    id: "core-lefebvre-everyday",
    front: "列斐伏尔为什么把日常生活作为资本主义批判对象？",
    back: "现代资本主义的统治不仅发生在生产领域，也通过消费、空间、时间节奏和符号渗透日常生活。日常生活既被异化和程序化，又保留需要、创造与抵抗的可能。批判日常生活旨在揭示宏观结构如何进入微观经验，并寻找生活革命的实践空间。",
    subject: "西方马克思主义",
    thinker: "列斐伏尔",
    questionType: "论述题",
    difficulty: "冲刺",
    era: "20世纪",
    school: "日常生活批判",
    bookId: "lefebvre-everyday"
  }
];

export const coreCards: StudyCard[] = records.map((record) =>
  seedCard(
    record.id,
    record.front,
    record.back,
    {
      subjects: [record.subject],
      thinkers: record.thinker ? [record.thinker] : [],
      questionTypes: [record.questionType],
      difficulty: record.difficulty,
      eras: [record.era],
      schools: [record.school]
    },
    [{ bookId: record.bookId }],
    templateByType[record.questionType]
  )
);
