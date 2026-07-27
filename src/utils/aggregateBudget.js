import { DEFAULT_CATEGORY_MAPPING, DEFAULT_CATEGORY, EXCLUDED_GROUPS, IGNORED_ITEMS, GROUP_CATEGORY_MAPPING, BUDGET_CATEGORIES, MONTHS } from './constants.js'

// 明細行（項目・金額、順序どおり。小計「◯◯ 合計」を含む）を分類する。
// 返り値: [{ item, amount, category }]（小計行と除外グループの明細は除く）
// 振り分けの優先順位: 項目マッピング → グループマッピング → 既定カテゴリ
export const classifyRows = (rows) => {
  if (!Array.isArray(rows)) return []
  const out = []
  let currentGroup = null
  let excludingGroup = false
  for (const row of rows) {
    if (/合計$/.test(row.item)) {
      currentGroup = row.item.replace(/\s*合計$/, '')
      excludingGroup = EXCLUDED_GROUPS.includes(currentGroup)
      continue
    }
    if (excludingGroup) continue
    // 見出し行など集計対象外の項目はスキップ
    if (IGNORED_ITEMS.includes(row.item)) continue
    const category =
      DEFAULT_CATEGORY_MAPPING[row.item] || GROUP_CATEGORY_MAPPING[currentGroup] || DEFAULT_CATEGORY
    out.push({ item: row.item, amount: row.amount, category })
  }
  return out
}

// 1か月分の明細をカテゴリ別に集計する。
// 返り値: { [カテゴリ]: { total, items: [{ item, amount }] } }
const aggregateMonth = (rows) => {
  const acc = {}
  for (const { item, amount, category } of classifyRows(rows)) {
    if (!acc[category]) acc[category] = { total: 0, items: [] }
    acc[category].total += amount
    acc[category].items.push({ item, amount })
  }
  return acc
}

// 複数の明細リストを項目ごとに合算し、金額の降順で返す（内訳表示用）。
const sumItems = (itemLists) => {
  const map = {}
  for (const items of itemLists) {
    for (const { item, amount } of items) {
      map[item] = (map[item] || 0) + amount
    }
  }
  return Object.entries(map)
    .map(([item, amount]) => ({ item, amount }))
    .sort((a, b) => b.amount - a.amount)
}

// カテゴリの年間予算を求める。
// 月次カテゴリは「月目標 × 12」、年間カテゴリ（旅行費など）は入力値をそのまま年間額とする。
export const annualBudgetOf = (category, monthlyTarget) => {
  const value = monthlyTarget || 0
  return category.annual ? value : value * MONTHS.length
}

// 指定年の月次テーブル行を生成する（表示時に明細から集計）。
// actualsByMonth: { [月]: 明細配列 } / budgetForYear: { [カテゴリ]: 月目標 }
export const buildMonthlyTable = (actualsByMonth = {}, budgetForYear = {}) => {
  const monthlyAgg = MONTHS.map((month) => aggregateMonth(actualsByMonth?.[month]))
  return BUDGET_CATEGORIES.map((category) => {
    const monthly = monthlyAgg.map((agg) => agg[category.label]?.total ?? 0)
    const monthlyItems = monthlyAgg.map((agg) => agg[category.label]?.items ?? [])
    const cumulative = monthly.reduce((sum, value) => sum + value, 0)
    const cumulativeItems = sumItems(monthlyItems)
    const budget = annualBudgetOf(category, budgetForYear?.[category.label] ?? 0)
    return {
      label: category.label,
      annual: category.annual,
      monthly,
      monthlyItems,
      cumulative,
      cumulativeItems,
      budget,
      variance: budget - cumulative,
    }
  })
}

// 複数年の年次テーブル行を生成する（表示時に明細から集計）。
// actualData: { [年]: { [月]: 明細配列 } } / budgetData: { [年]: { [カテゴリ]: 月目標 } }
export const buildAnnualTable = (years = [], actualData = {}, budgetData = {}) => {
  return BUDGET_CATEGORIES.map((category) => {
    const perYear = years.map((year) => {
      const months = actualData?.[year] ?? {}
      const monthlyAgg = MONTHS.map((month) => aggregateMonth(months?.[month]))
      const actual = monthlyAgg.reduce((sum, agg) => sum + (agg[category.label]?.total ?? 0), 0)
      const items = sumItems(monthlyAgg.map((agg) => agg[category.label]?.items ?? []))
      const budget = annualBudgetOf(category, budgetData?.[year]?.[category.label] ?? 0)
      return { year, actual, items, budget, variance: budget - actual }
    })
    return { label: category.label, annual: category.annual, perYear }
  })
}

// 月次テーブルの合計行・差額行を求める。
// - 月列と差額（月予算−月実績）は旅行費などの年間カテゴリを除外
// - 累計・予算・累計差額は旅行費を含む（全カテゴリ）
export const sumMonthlyRows = (rows = []) => {
  const sumMonthly = (list) =>
    MONTHS.map((_, index) => list.reduce((sum, row) => sum + row.monthly[index], 0))
  const sumBy = (list, key) => list.reduce((sum, row) => sum + row[key], 0)

  const excl = rows.filter((row) => !row.annual)

  // 月列（旅行費を除く）
  const monthly = sumMonthly(excl)

  // 累計・予算・累計差額（旅行費を含む）
  const cumulative = sumBy(rows, 'cumulative')
  const budget = sumBy(rows, 'budget')
  const variance = budget - cumulative

  // 差額行（旅行費を除く）：月予算 = 除外後の年間予算 ÷ 12
  const monthlyBudget = sumBy(excl, 'budget') / MONTHS.length
  const monthlyVariance = monthly.map((value) => monthlyBudget - value)
  // 差額行の累計（旅行費を除く）
  const varianceExcl = sumBy(excl, 'budget') - sumBy(excl, 'cumulative')

  return { monthly, cumulative, budget, variance, monthlyVariance, varianceExcl }
}

// 年次テーブルの合計行を年ごとに求める（旅行費を含む全カテゴリ）。
export const sumAnnualRows = (rows = [], years = []) => {
  return years.map((year, index) => {
    const actual = rows.reduce((sum, row) => sum + row.perYear[index].actual, 0)
    const budget = rows.reduce((sum, row) => sum + row.perYear[index].budget, 0)
    return { year, actual, budget, variance: budget - actual }
  })
}

