<template>
  <div v-if="open" class="modal-overlay" @click.self="close">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="budget-modal-title">
      <div class="modal-header">
        <h2 id="budget-modal-title">予算入力</h2>
        <div class="modal-header-actions">
          <span v-if="syncLabel" class="sync-status" :class="syncStatus">{{ syncLabel }}</span>
          <button class="modal-close" type="button" aria-label="閉じる" @click="close">×</button>
        </div>
      </div>

      <div class="modal-body">
        <div class="period-row">
          <select id="budget-year" v-model.number="selectedYear">
            <option v-for="year in years" :key="year" :value="year">{{ year }}年</option>
          </select>
        </div>

        <section class="target-frame">
          <h3 class="frame-title">月目標</h3>
          <div v-for="category in monthlyCategories" :key="category.label" class="input-group">
            <label :for="`budget-${category.label}`">{{ category.label }}</label>
            <div class="amount-field">
              <input
                :id="`budget-${category.label}`"
                type="text"
                inputmode="numeric"
                :value="displayValue(category.label)"
                @input="onInput(category.label, $event.target.value)"
              />
              <span class="unit">円</span>
            </div>
          </div>
          <p class="hint">月目標は 12 か月共通で適用されます。</p>
          <div class="total-row">
            <span class="total-label">月目標 合計<span class="note">（旅行費を除く）</span></span>
            <span class="total-value">{{ monthlyTotal.toLocaleString('ja-JP') }} 円</span>
          </div>
        </section>

        <section class="target-frame">
          <h3 class="frame-title">年目標</h3>
          <div v-for="category in annualCategories" :key="category.label" class="input-group">
            <label :for="`budget-${category.label}`">{{ category.label }}</label>
            <div class="amount-field">
              <input
                :id="`budget-${category.label}`"
                type="text"
                inputmode="numeric"
                :value="displayValue(category.label)"
                @input="onInput(category.label, $event.target.value)"
              />
              <span class="unit">円</span>
            </div>
          </div>
          <div class="total-row">
            <span class="total-label">年目標 合計<span class="note">（旅行費含む）</span></span>
            <span class="total-value">{{ annualTotal.toLocaleString('ja-JP') }} 円</span>
          </div>
        </section>
      </div>

      <div class="modal-footer">
        <button class="primary" type="button" @click="onSave">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { BUDGET_CATEGORIES } from '../utils/constants.js'
import { parseAmount } from '../utils/parseBudgetText.js'
import { annualBudgetOf } from '../utils/aggregateBudget.js'

const props = defineProps({
  open: { type: Boolean, default: false },
  budgetData: { type: Object, default: () => ({}) },
  years: { type: Array, default: () => [] },
  defaultYear: { type: Number, default: () => new Date().getFullYear() },
  syncStatus: { type: String, default: 'idle' },
})

const emit = defineEmits(['save', 'close', 'activity'])

// 保存状態の表示文言
const syncLabel = computed(() => {
  switch (props.syncStatus) {
    case 'saving':
      return '保存中'
    case 'saved':
      return '保存しました'
    case 'error':
      return '⚠ 保存失敗'
    default:
      return ''
  }
})

const categories = BUDGET_CATEGORIES
// 枠ごとに表示するカテゴリを分ける（月目標＝月次カテゴリ、年目標＝年間カテゴリ）
const monthlyCategories = categories.filter((category) => !category.annual)
const annualCategories = categories.filter((category) => category.annual)
const selectedYear = ref(props.defaultYear)

// 入力中の値はローカルに保持し、保存ボタンを押すまで表・グラフには反映しない
const localAmounts = ref({})
const syncLocal = () => {
  localAmounts.value = { ...(props.budgetData[selectedYear.value] ?? {}) }
}

// モーダルを開いたら選択年を既定値に合わせ、その年の予算を読み込む
watch(
  () => props.open,
  (open) => {
    if (open) {
      selectedYear.value = props.defaultYear
      syncLocal()
    }
  }
)

// 年を切り替えたらその年の予算を読み込み直し、保存メッセージを消す
watch(selectedYear, () => {
  syncLocal()
  emit('activity')
})

// 入力欄にはカンマ区切りで表示する（0/未入力は空欄）
const displayValue = (label) => {
  const value = localAmounts.value[label] ?? 0
  return value ? value.toLocaleString('ja-JP') : ''
}

// 月目標の合計（旅行費などの年間カテゴリは除外）
const monthlyTotal = computed(() =>
  monthlyCategories.reduce((sum, category) => sum + (localAmounts.value[category.label] ?? 0), 0)
)

// 年目標の合計（旅行費を含む）：生活系は月目標×12、旅行費は年間額
const annualTotal = computed(() =>
  categories.reduce(
    (sum, category) => sum + annualBudgetOf(category, localAmounts.value[category.label] ?? 0),
    0
  )
)

// カテゴリ別の入力を数値化してローカルに反映し、保存メッセージを消す
const onInput = (label, raw) => {
  localAmounts.value = { ...localAmounts.value, [label]: parseAmount(raw) }
  emit('activity')
}

// 保存ボタン：選択年の月目標を確定して保存する
const onSave = () => {
  emit('save', { year: selectedYear.value, amounts: localAmounts.value })
}

const close = () => emit('close')
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 12px;
  width: min(520px, 100%);
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 0;
}

.modal-header h2 {
  margin: 0;
}

.modal-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sync-status {
  font-size: 0.78rem;
  padding: 4px 10px;
  border-radius: 6px;
  white-space: nowrap;
}

.sync-status.saved {
  color: #2e7d32;
}

.sync-status.saving {
  color: #888;
}

.sync-status.error {
  color: #e53935;
}

.modal-close {
  border: none;
  background: transparent;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: #666;
  padding: 4px 8px;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
}

.period-row {
  display: flex;
  gap: 16px;
}

.period-row select {
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 8px 12px;
  font-family: inherit;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.target-frame {
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.frame-title {
  margin: 0;
  font-size: 1rem;
}

.amount-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.amount-field input {
  flex: 1;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 10px 12px;
  font-family: inherit;
  text-align: right;
}

.unit {
  color: #555;
}

.hint {
  color: #888;
  font-size: 0.85rem;
  margin: 0;
}

.total-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.total-label {
  font-weight: 600;
}

.note {
  color: #888;
  font-size: 0.8rem;
  font-weight: 400;
  margin-left: 4px;
}

.total-value {
  font-weight: 600;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 0 20px 20px;
}

.modal-footer .primary {
  background: #007bff;
  color: #fff;
  border: 1px solid #007bff;
  border-radius: 8px;
  padding: 10px 20px;
  cursor: pointer;
}
</style>
