<template>
  <div class="app-shell">
    <header class="app-header">
      <h1>生活費予実管理</h1>
      <div v-if="currentUser" ref="menuWrap" class="menu-wrap">
        <button
          class="hamburger"
          type="button"
          aria-label="メニュー"
          :aria-expanded="isMenuOpen"
          @click.stop="isMenuOpen = !isMenuOpen"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <ul v-if="isMenuOpen" class="menu" @click="isMenuOpen = false">
          <li class="menu-user">👤 {{ currentUser.displayName }}</li>
          <li>
            <button type="button" @click="isActualModalOpen = true">実績入力</button>
          </li>
          <li>
            <button type="button" @click="isBudgetModalOpen = true">予算入力</button>
          </li>
          <li>
            <button type="button" @click="handleSignOut">ログアウト</button>
          </li>
          <li class="menu-version">バージョン {{ appVersion }}</li>
        </ul>
      </div>
    </header>

    <div v-if="!currentUser" class="login-gate">
      <p v-if="!authReady">読み込み中…</p>
      <template v-else>
        <p>閲覧・編集にはログインが必要です。</p>
        <button class="primary" type="button" @click="signIn">Googleでログイン</button>
        <p v-if="loginError" class="error-text">{{ loginError }}</p>
      </template>
    </div>

    <section v-else class="section">
      <div class="section-head">
        <h2>予実表</h2>
        <div class="section-controls">
          <div class="tabs">
            <button :class="{ active: viewMode === 'monthly' }" @click="viewMode = 'monthly'">月次</button>
            <button :class="{ active: viewMode === 'annual' }" @click="viewMode = 'annual'">年次</button>
          </div>
          <div v-if="viewMode === 'monthly'" class="year-picker">
            <label for="monthly-year">対象年</label>
            <select id="monthly-year" v-model.number="monthlyYear">
              <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}年</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 月次表示：年を選び、1〜12月・累計・予算・累計差額を表示 -->
      <template v-if="viewMode === 'monthly'">
        <div class="table-scroll">
          <table class="budget-table">
            <thead>
              <tr>
                <th class="sticky-col">カテゴリ</th>
                <th v-for="month in months" :key="month">{{ month }}月</th>
                <th>累計</th>
                <th>予算</th>
                <th>累計差額</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in monthlyRows" :key="row.label">
                <td class="sticky-col">
                  {{ row.label }}
                  <InfoHint v-if="categoryItems[row.label]" :text="categoryItems[row.label]" />
                </td>
                <td v-for="(value, index) in row.monthly" :key="index">
                  <BreakdownCell :amount="value" :items="row.monthlyItems[index]" />
                </td>
                <td class="emphasis">
                  <BreakdownCell :amount="row.cumulative" :items="row.cumulativeItems" />
                </td>
                <td>{{ formatYen(row.budget) }}</td>
                <td :class="{ over: row.variance < 0 }">{{ formatYen(row.variance) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td class="sticky-col">合計<InfoHint text="月列は旅行費を除く／累計・予算は含む" /></td>
                <td v-for="(value, index) in monthlyTotals.monthly" :key="index">{{ formatYen(value) }}</td>
                <td class="emphasis">{{ formatYen(monthlyTotals.cumulative) }}</td>
                <td>{{ formatYen(monthlyTotals.budget) }}</td>
                <td :class="{ over: monthlyTotals.variance < 0 }">{{ formatYen(monthlyTotals.variance) }}</td>
              </tr>
              <tr class="total-row variance-row">
                <td class="sticky-col">差額<InfoHint text="月予算−月実績（旅行費を除く）" /></td>
                <td
                  v-for="(value, index) in monthlyTotals.monthlyVariance"
                  :key="index"
                  :class="{ over: value < 0 }"
                >{{ formatYen(value) }}</td>
                <td class="emphasis" :class="{ over: monthlyTotals.varianceExcl < 0 }">{{ formatYen(monthlyTotals.varianceExcl) }}</td>
                <td>—</td>
                <td>—</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <h3>予算消化率（{{ monthlyYear }}年 累計）<InfoHint text="実績累計 ÷ 年間予算（100% 超過は赤）" /></h3>
        <UtilizationChart :items="utilizationItems" />
      </template>

      <!-- 年次表示：年ごとに実績と差額を表示 -->
      <template v-else>
        <p v-if="!dataYears.length" class="empty-text">データがある年がありません。</p>
        <div v-else class="table-scroll">
          <table class="budget-table">
            <thead>
              <tr>
                <th class="sticky-col" rowspan="2">カテゴリ</th>
                <th v-for="year in dataYears" :key="year" colspan="2">{{ year }}年</th>
              </tr>
              <tr>
                <template v-for="year in dataYears" :key="year">
                  <th>実績</th>
                  <th>差額</th>
                </template>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in annualRows" :key="row.label">
                <td class="sticky-col">
                  {{ row.label }}
                  <InfoHint v-if="categoryItems[row.label]" :text="categoryItems[row.label]" />
                </td>
                <template v-for="cell in row.perYear" :key="cell.year">
                  <td><BreakdownCell :amount="cell.actual" :items="cell.items" /></td>
                  <td :class="{ over: cell.variance < 0 }">{{ formatYen(cell.variance) }}</td>
                </template>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td class="sticky-col">合計</td>
                <template v-for="cell in annualTotals" :key="cell.year">
                  <td>{{ formatYen(cell.actual) }}</td>
                  <td :class="{ over: cell.variance < 0 }">{{ formatYen(cell.variance) }}</td>
                </template>
              </tr>
            </tfoot>
          </table>
        </div>

        <div v-if="dataYears.length" class="table-summary">
          <div v-for="cell in annualTotals" :key="cell.year" class="summary-item">
            <span class="summary-label">{{ cell.year }}年 合計</span>
            <span class="summary-amount">実績 {{ formatYen(cell.actual) }}</span>
            <span class="summary-amount" :class="{ over: cell.variance < 0 }">差額 {{ formatYen(cell.variance) }}</span>
          </div>
        </div>

        <template v-if="dataYears.length">
          <h3>予算消化率（年別）<InfoHint text="年計実績 ÷ 年間予算（100% 超過は赤）" /></h3>
          <UtilizationChart :items="annualUtilization" />
        </template>
      </template>
    </section>

    <ActualInputModal
      :open="isActualModalOpen"
      :years="yearOptions"
      :default-year="defaultYear"
      :sync-status="syncStatus"
      @save="handleSaveActual"
      @activity="resetStatus"
      @close="isActualModalOpen = false"
    />
    <BudgetInputModal
      :open="isBudgetModalOpen"
      :budget-data="budgetData"
      :years="yearOptions"
      :default-year="defaultYear"
      :sync-status="syncStatus"
      @save="handleSaveBudget"
      @activity="resetStatus"
      @close="isBudgetModalOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useBudget } from './composables/useBudget.js'
import { useAuth } from './composables/useAuth.js'
import ActualInputModal from './components/ActualInputModal.vue'
import BudgetInputModal from './components/BudgetInputModal.vue'
import UtilizationChart from './components/UtilizationChart.vue'
import InfoHint from './components/InfoHint.vue'
import BreakdownCell from './components/BreakdownCell.vue'

import { MONTHS, DEFAULT_CATEGORY, DEFAULT_CATEGORY_MAPPING, GROUP_CATEGORY_MAPPING } from './utils/constants.js'
import { sumMonthlyRows, sumAnnualRows } from './utils/aggregateBudget.js'
import { APP_VERSION } from './utils/version.js'

const viewMode = ref('monthly')
const isActualModalOpen = ref(false)
const isBudgetModalOpen = ref(false)
const isMenuOpen = ref(false)
const months = MONTHS

// カテゴリごとの内訳（対象の項目名・グループ名）。ⓘ の説明に使う。
// 複数項目を集約するカテゴリ（1:n）に対して表示する。
const categoryItems = (() => {
  const map = {}
  const add = (category, name) => {
    ;(map[category] ||= []).push(name)
  }
  for (const [item, category] of Object.entries(DEFAULT_CATEGORY_MAPPING)) add(category, item)
  for (const [group, category] of Object.entries(GROUP_CATEGORY_MAPPING)) add(category, `${group}（グループ）`)
  const result = {}
  for (const [category, names] of Object.entries(map)) result[category] = names.join('、')
  // 生活費は未マッピング項目の受け皿
  result[DEFAULT_CATEGORY] = 'マッピングされていない項目（その他）'
  return result
})()
const {
  budgetData,
  yearOptions,
  dataYears,
  monthlyTableFor,
  annualTable,
  importActual,
  setBudgetForYear,
  startSync,
  stopSync,
  save,
  resetStatus,
  syncStatus,
} = useBudget()

const { currentUser, authReady, loginError, signIn, handleSignOut, start, stop } = useAuth({
  onLogin: startSync,
  onLogout: stopSync,
})

// ハンバーガーメニューの外側クリックで閉じる
const menuWrap = ref(null)
const onDocClick = (event) => {
  if (menuWrap.value && !menuWrap.value.contains(event.target)) isMenuOpen.value = false
}

onMounted(() => {
  start()
  document.addEventListener('click', onDocClick)
})
onUnmounted(() => {
  stop()
  stopSync()
  document.removeEventListener('click', onDocClick)
})

// 既定年：データがある最新年、無ければ現在年
const defaultYear = computed(() => {
  const years = dataYears.value
  return years.length ? years[years.length - 1] : new Date().getFullYear()
})

const monthlyYear = ref(defaultYear.value)
// データ読込などで既定年が変わったら、月次表示の対象年も追従する
watch(defaultYear, (year) => {
  monthlyYear.value = year
})

const monthlyRows = computed(() => monthlyTableFor(monthlyYear.value))
const annualRows = computed(() => annualTable.value)

// 合計行（旅行費などの年間カテゴリは除外）
const monthlyTotals = computed(() => sumMonthlyRows(monthlyRows.value))
const annualTotals = computed(() => sumAnnualRows(annualRows.value, dataYears.value))

// 予算消化率チャート用データ（カテゴリ別）。実績累計 ÷ 年間予算 の割合。
const utilizationItems = computed(() =>
  monthlyRows.value.map((row) => ({
    label: row.label,
    actual: row.cumulative,
    budget: row.budget,
    percent: row.budget > 0 ? (row.cumulative / row.budget) * 100 : 0,
  }))
)

// 予算消化率チャート用データ（年別）。各年の全カテゴリ合計（旅行費を含む）。
const annualUtilization = computed(() =>
  dataYears.value.map((year, index) => {
    let actual = 0
    let budget = 0
    for (const row of annualRows.value) {
      actual += row.perYear[index].actual
      budget += row.perYear[index].budget
    }
    return {
      label: `${year}年`,
      actual,
      budget,
      percent: budget > 0 ? (actual / budget) * 100 : 0,
    }
  })
)

// 実績保存：選択年月を置換登録して保存する
const handleSaveActual = ({ year, month, text }) => {
  importActual(year, month, text)
  save()
}

// 予算保存：選択年の月目標を確定して保存する
const handleSaveBudget = ({ year, amounts }) => {
  setBudgetForYear(year, amounts)
  save()
}

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

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.app-header h1 {
  margin: 0;
}

.menu-wrap {
  position: relative;
}

.hamburger {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 40px;
  height: 34px;
  padding: 8px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
}

.hamburger span {
  display: block;
  width: 100%;
  height: 2px;
  background: #333;
  border-radius: 2px;
}

.menu {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  list-style: none;
  margin: 0;
  padding: 6px;
  min-width: 180px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  z-index: 900;
}

.menu li {
  margin: 0;
}

.menu button {
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.menu button:hover {
  background: #f2f6fb;
}

.menu-user {
  padding: 8px 12px;
  color: #555;
  font-size: 0.9rem;
  border-bottom: 1px solid #eee;
}

.menu-version {
  padding: 8px 12px;
  color: #888;
  font-size: 0.8rem;
  border-top: 1px solid #eee;
}

.login-gate {
  background: #fff;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.login-gate .primary {
  background: #007bff;
  color: #fff;
  border: 1px solid #007bff;
  border-radius: 8px;
  padding: 10px 20px;
  cursor: pointer;
}

.error-text {
  color: #e53935;
  margin-top: 12px;
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
  font: inherit;
}

button.active {
  background: #007bff;
  color: #fff;
  border-color: #007bff;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.section-head h2 {
  margin: 0;
}

.section-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.section-controls .tabs {
  margin-bottom: 0;
}

.section-controls .year-picker {
  margin-bottom: 0;
}

.year-picker {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.year-picker select {
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 8px 12px;
  font-family: inherit;
}

.table-scroll {
  overflow-x: auto;
  margin-bottom: 20px;
}

.budget-table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
}

.budget-table th,
.budget-table td {
  border: 1px solid #e0e0e0;
  padding: 8px 10px;
  text-align: right;
}

.budget-table th {
  background: #f2f6fb;
  text-align: right;
}

.budget-table .sticky-col {
  position: sticky;
  left: 0;
  z-index: 1;
  background: #f2f6fb;
  text-align: left;
}

.budget-table td.sticky-col {
  background: #fff;
  font-weight: 600;
}

.budget-table td.emphasis {
  font-weight: 600;
}

.budget-table td.over {
  color: #e53935;
}

.budget-table .total-row td {
  background: #eef3f9;
  font-weight: 600;
}

.budget-table .total-row td.sticky-col {
  background: #eef3f9;
}

.empty-text {
  color: #888;
}

.table-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  margin-bottom: 20px;
}

.summary-item {
  display: flex;
  align-items: baseline;
  gap: 12px;
  background: #f2f6fb;
  border-radius: 8px;
  padding: 10px 16px;
}

.summary-label {
  font-weight: 600;
}

.summary-amount {
  font-weight: 600;
}

.summary-amount.over {
  color: #e53935;
}
</style>
