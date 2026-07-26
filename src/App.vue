<template>
  <div class="app-shell">
    <h1>生活費予実管理</h1>

    <section class="section">
      <h2>実績 / 予算入力</h2>
      <div class="flex-row">
        <div class="input-group">
          <label for="actual">実績データ</label>
          <textarea id="actual" v-model="actualText" rows="12" placeholder="サンプルの表を貼り付けてください"></textarea>
        </div>
        <div class="input-group">
          <label for="budget">予算データ</label>
          <textarea id="budget" v-model="budgetText" rows="12" placeholder="予算をテキストで入力してください"></textarea>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>マッチング設定</h2>
      <div class="mapping-area">
        <label for="mapping">カテゴリマッピング（JSON）</label>
        <textarea id="mapping" v-model="mappingText" rows="10"></textarea>
        <p class="help-text">実績のカテゴリ名を予算カテゴリに変換します。サンプルは固定の JSON です。</p>
        <p class="error-text" v-if="mappingError">{{ mappingError }}</p>
      </div>
    </section>

    <section class="section">
      <h2>表示</h2>
      <div class="tabs">
        <button :class="{ active: viewMode === 'monthly' }" @click="viewMode = 'monthly'">月次</button>
        <button :class="{ active: viewMode === 'annual' }" @click="viewMode = 'annual'">年次</button>
      </div>

      <div class="summary-card">
        <p>実績合計: {{ formatYen(summary.totalActual) }}</p>
        <p>予算合計: {{ formatYen(summary.totalBudget) }}</p>
        <p>差額合計: {{ formatYen(summary.totalBudget - summary.totalActual) }}</p>
        <p class="app-version">バージョン: {{ appVersion }}</p>
      </div>

      <table class="budget-table">
        <thead>
          <tr>
            <th>カテゴリ</th>
            <th>実績</th>
            <th>予算</th>
            <th>差額</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in displayedItems" :key="item.label">
            <td>{{ item.label }}</td>
            <td>{{ formatYen(item.actual) }}</td>
            <td>{{ formatYen(item.budget) }}</td>
            <td>{{ formatYen(item.variance) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="chart-grid">
        <div class="chart-box">
          <h3>実績</h3>
          <ul>
            <li v-for="item in displayedItems" :key="item.label + '-actual'">
              <span>{{ item.label }}</span>
              <strong>{{ formatYen(item.actual) }}</strong>
            </li>
          </ul>
        </div>
        <div class="chart-box">
          <h3>予算</h3>
          <ul>
            <li v-for="item in displayedItems" :key="item.label + '-budget'">
              <span>{{ item.label }}</span>
              <strong>{{ formatYen(item.budget) }}</strong>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useBudget } from './composables/useBudget.js'
import { DEFAULT_CATEGORY_MAPPING } from './utils/constants.js'

import { APP_VERSION } from './utils/version.js'

const viewMode = ref('monthly')
const mappingText = ref(JSON.stringify(DEFAULT_CATEGORY_MAPPING, null, 2))
const mappingError = ref('')
const {
  actualText,
  budgetText,
  budgetConfig,
  summary,
  monthlyCategories,
  annualCategories,
} = useBudget()

const applyMapping = () => {
  try {
    const parsed = JSON.parse(mappingText.value)
    budgetConfig.value = parsed
    mappingError.value = ''
  } catch (err) {
    mappingError.value = 'JSON の読み込みに失敗しました。正しい形式を入力してください。'
  }
}

watch(mappingText, applyMapping, { immediate: true })

const displayedItems = computed(() => {
  return viewMode.value === 'annual' ? annualCategories.value : monthlyCategories.value
})

const formatYen = (value) => {
  return value.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 })
}

const appVersion = APP_VERSION
</script>

<style>
:root {
  font-family: 'Segoe UI', 'Hiragino Kaku Gothic Pro', Meiryo, sans-serif;
  color: #222;
  background: #f8f9fb;
}

.app-shell {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}

h1,
h2,
h3 {
  margin: 0 0 12px;
}

.section {
  margin-bottom: 24px;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.flex-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
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

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

button {
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 8px;
  padding: 10px 16px;
  cursor: pointer;
}

button.active {
  background: #007bff;
  color: #fff;
  border-color: #007bff;
}

.budget-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.budget-table th,
.budget-table td {
  border: 1px solid #e0e0e0;
  padding: 12px;
  text-align: right;
}

.budget-table th {
  background: #f2f6fb;
  text-align: left;
}

.chart-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.chart-box {
  background: #f7f9fc;
  border-radius: 12px;
  padding: 16px;
}

.chart-box ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.chart-box li {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.summary-card {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.app-version {
  color: #666;
  font-size: 0.9rem;
}
</style>
