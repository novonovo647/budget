<template>
  <div v-if="open" class="modal-overlay" @click.self="close">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="actual-modal-title">
      <div class="modal-header">
        <h2 id="actual-modal-title">実績入力</h2>
        <div class="modal-header-actions">
          <span v-if="syncStatus !== 'idle'" class="sync-status" :class="syncStatus">{{ syncLabel }}</span>
          <button class="modal-close" type="button" aria-label="閉じる" @click="close">×</button>
        </div>
      </div>

      <div class="modal-body">
        <div class="period-row">
          <div class="period-field">
            <label for="actual-year">年</label>
            <select id="actual-year" v-model.number="selectedYear">
              <option v-for="year in years" :key="year" :value="year">{{ year }}年</option>
            </select>
          </div>
          <div class="period-field">
            <label for="actual-month">月</label>
            <select id="actual-month" v-model.number="selectedMonth">
              <option v-for="month in months" :key="month" :value="month">{{ month }}月</option>
            </select>
          </div>
        </div>

        <div class="input-group">
          <label for="actual">実績データ</label>
          <textarea
            id="actual"
            v-model="text"
            rows="12"
            placeholder="表を貼り付けてください"
          ></textarea>
        </div>

        <p class="hint">閉じると、選択した年月の実績を貼り付け内容で置き換えます（貼り付けが空の場合は変更しません）。</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { MONTHS } from '../utils/constants.js'

const props = defineProps({
  open: { type: Boolean, default: false },
  years: { type: Array, default: () => [] },
  defaultYear: { type: Number, default: () => new Date().getFullYear() },
  syncStatus: { type: String, default: 'idle' },
})

const emit = defineEmits(['import', 'close'])

// 保存状態の表示文言
const syncLabel = computed(() => {
  switch (props.syncStatus) {
    case 'saving':
      return '保存中…'
    case 'error':
      return '⚠ 保存失敗'
    case 'loading':
      return '読込中…'
    default:
      return '✓ 保存済み'
  }
})

const months = MONTHS
const selectedYear = ref(props.defaultYear)
const selectedMonth = ref(new Date().getMonth() + 1)
const text = ref('')

// モーダルを開くたびに、選択年を既定値に合わせる
watch(
  () => props.open,
  (open) => {
    if (open) selectedYear.value = props.defaultYear
  }
)

// 閉じるときに、貼り付け内容があればその年月の実績として登録（置換）する
const close = () => {
  if (text.value.trim()) {
    emit('import', { year: selectedYear.value, month: selectedMonth.value, text: text.value })
    text.value = ''
  }
  emit('close')
}
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
  width: min(700px, 100%);
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

.sync-status.saving,
.sync-status.loading {
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
  padding: 20px;
}

.period-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.period-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.period-field select {
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 8px 12px;
  font-family: inherit;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hint {
  color: #888;
  font-size: 0.85rem;
  margin: 8px 0 0;
}

textarea {
  width: 100%;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 12px;
  min-height: 240px;
  resize: vertical;
  font-family: inherit;
}
</style>
