<script setup lang="ts">
import { computed, reactive } from "vue";
import { PhX as X } from "@phosphor-icons/vue";
import { createInitialFsrsState } from "@/services/fsrs";
import type { SourceLink, StudyCard } from "@/types";

const props = withDefaults(
  defineProps<{
    card?: StudyCard;
    source?: SourceLink;
    excerpt?: string;
  }>(),
  {
    card: undefined,
    source: undefined,
    excerpt: ""
  }
);

const emit = defineEmits<{
  close: [];
  save: [card: StudyCard];
}>();

const form = reactive({
  front: props.card?.front ?? "",
  back: props.card?.back ?? "",
  answerTemplate: props.card?.answerTemplate ?? "",
  excerpt: props.card?.excerpt ?? props.excerpt,
  subjects: props.card?.tags.subjects.join("，") ?? "",
  thinkers: props.card?.tags.thinkers.join("，") ?? "",
  questionTypes: props.card?.tags.questionTypes.join("，") ?? "简答题",
  difficulty: props.card?.tags.difficulty ?? ("基础" as StudyCard["tags"]["difficulty"]),
  eras: props.card?.tags.eras.join("，") ?? "",
  schools: props.card?.tags.schools.join("，") ?? ""
});

const valid = computed(() => form.front.trim().length >= 2 && form.back.trim().length >= 2);
const split = (value: string) =>
  value
    .split(/[，,、]/)
    .map((item) => item.trim())
    .filter(Boolean);

const submit = () => {
  if (!valid.value) return;
  const timestamp = new Date().toISOString();
  const sources = props.card?.sources ?? (props.source ? [props.source] : []);
  const card: StudyCard = {
    id: props.card?.id ?? crypto.randomUUID(),
    front: form.front.trim(),
    back: form.back.trim(),
    answerTemplate: form.answerTemplate.trim() || undefined,
    excerpt: form.excerpt.trim() || undefined,
    sources,
    tags: {
      subjects: split(form.subjects),
      thinkers: split(form.thinkers),
      questionTypes: split(form.questionTypes),
      difficulty: form.difficulty,
      eras: split(form.eras),
      schools: split(form.schools)
    },
    flatTags: [],
    exam: props.card?.exam,
    fsrs: props.card?.fsrs ?? createInitialFsrsState(),
    suspended: props.card?.suspended ?? false,
    createdAt: props.card?.createdAt ?? timestamp,
    updatedAt: timestamp
  };
  emit("save", card);
};
</script>

<template>
  <div class="modal-backdrop" role="presentation" @mousedown.self="emit('close')">
    <section class="card-editor panel" role="dialog" aria-modal="true" aria-label="编辑闪卡">
      <header>
        <div>
          <h2>{{ card ? "编辑闪卡" : "新建闪卡" }}</h2>
          <p>结构化字段可用于复习筛选和知识库归档。</p>
        </div>
        <button class="icon-button" type="button" aria-label="关闭" @click="emit('close')">
          <X :size="19" />
        </button>
      </header>

      <form @submit.prevent="submit">
        <div class="field">
          <label for="card-front">正面问题</label>
          <textarea id="card-front" v-model="form.front" placeholder="输入考点名词或真题题干" required />
        </div>
        <div class="field">
          <label for="card-back">标准答案</label>
          <textarea id="card-back" v-model="form.back" placeholder="输入可直接用于闭卷复述的答案" required />
        </div>
        <div class="field field-wide">
          <label for="card-template">答题结构</label>
          <input id="card-template" v-model="form.answerTemplate" placeholder="例如：概念界定、理论展开、意义总结" />
        </div>
        <div class="field field-wide">
          <label for="card-excerpt">原著摘录</label>
          <textarea id="card-excerpt" v-model="form.excerpt" placeholder="可保留与考点直接相关的短摘录" />
        </div>
        <div class="field">
          <label for="card-subject">学科分类</label>
          <input id="card-subject" v-model="form.subjects" placeholder="马克思主义基本原理" />
        </div>
        <div class="field">
          <label for="card-thinker">哲学家或理论家</label>
          <input id="card-thinker" v-model="form.thinkers" placeholder="马克思，康德" />
        </div>
        <div class="field">
          <label for="card-type">考试题型</label>
          <input id="card-type" v-model="form.questionTypes" placeholder="名词解释，简答题" />
        </div>
        <div class="field">
          <label for="card-difficulty">难度</label>
          <select id="card-difficulty" v-model="form.difficulty">
            <option value="基础">基础</option>
            <option value="进阶">进阶</option>
            <option value="冲刺">冲刺</option>
          </select>
        </div>
        <div class="field">
          <label for="card-era">哲学史年代</label>
          <input id="card-era" v-model="form.eras" placeholder="19世纪" />
        </div>
        <div class="field">
          <label for="card-school">理论流派</label>
          <input id="card-school" v-model="form.schools" placeholder="德国古典哲学" />
        </div>
      </form>

      <footer>
        <button class="button" type="button" @click="emit('close')">取消</button>
        <button class="button button-primary" type="button" :disabled="!valid" @click="submit">
          保存卡片
        </button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.card-editor {
  width: min(780px, 100%);
  max-height: min(88dvh, 860px);
  overflow: auto;
  padding: 22px;
}

.card-editor header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}

.card-editor h2 {
  margin: 0;
  font-size: 20px;
}

.card-editor header p {
  margin: 5px 0 0;
  color: var(--text-soft);
  font-size: 12px;
}

.card-editor form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.field-wide {
  grid-column: 1 / -1;
}

.card-editor footer {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
}

.button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

@media (max-width: 700px) {
  .card-editor {
    max-height: 92dvh;
    padding: 18px;
    border-radius: 18px 18px 10px 10px;
  }

  .card-editor form {
    grid-template-columns: 1fr;
  }

  .field-wide {
    grid-column: auto;
  }
}
</style>
