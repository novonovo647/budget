import { DEFAULT_CATEGORY_MAPPING, DEFAULT_CATEGORY, EXCLUDED_GROUPS, GROUP_CATEGORY_MAPPING, BUDGET_CATEGORIES, MONTHS } from './constants.js'

// 貼り付けデータ（項目・金額の行）をカテゴリ別金額に集計する。
// - 「◯◯ 合計」の小計行はグループ見出しとして扱い、集計には含めない（明細と二重計上しない）
// - EXCLUDED_GROUPS に該当する小計以降、次の小計までの明細はまとめて対象外にする（資金移動など）
// - 振り分けの優先順位: 項目マッピング → グループマッピング → 既定カテゴリ
export const groupByCategory = (rows, mapping = DEFAULT_CATEGORY_MAPPING) => {
  const result = {}
  let currentGroup = null
  let excludingGroup = false
  for (const row of rows) {
    if (/合計$/.test(row.item)) {
      currentGroup = row.item.replace(/\s*合計$/, '')
      excludingGroup = EXCLUDED_GROUPS.includes(currentGroup)
      continue
    }
    if (excludingGroup) continue
    const target = mapping[row.item] || GROUP_CATEGORY_MAPPING[currentGroup] || DEFAULT_CATEGORY
    result[target] = (result[target] || 0) + row.amount
  }
  return result
}

// カテゴリの年間予算を求める。
// 月次カテゴリは「月目標 × 12」、年間カテゴリ（旅行費など）は入力値をそのまま年間額とする。
export const annualBudgetOf = (category, monthlyTarget) => {
  const value = monthlyTarget || 0
  return category.annual ? value : value * MONTHS.length
}

// 指定年の月次テーブル行を生成する。
// actualsByMonth: { [月]: { [カテゴリ]: 金額 } } / budgetForYear: { [カテゴリ]: 月目標 }
export const buildMonthlyTable = (actualsByMonth = {}, budgetForYear = {}) => {
  return BUDGET_CATEGORIES.map((category) => {
    const monthly = MONTHS.map((month) => actualsByMonth?.[month]?.[category.label] ?? 0)
    const cumulative = monthly.reduce((sum, value) => sum + value, 0)
    const budget = annualBudgetOf(category, budgetForYear?.[category.label] ?? 0)
    return {
      label: category.label,
      annual: category.annual,
      monthly,
      cumulative,
      budget,
      variance: budget - cumulative,
    }
  })
}

// 複数年の年次テーブル行を生成する。
// actualData: { [年]: { [月]: { [カテゴリ]: 金額 } } } / budgetData: { [年]: { [カテゴリ]: 月目標 } }
export const buildAnnualTable = (years = [], actualData = {}, budgetData = {}) => {
  return BUDGET_CATEGORIES.map((category) => {
    const perYear = years.map((year) => {
      const monthsObj = actualData?.[year] ?? {}
      const actual = MONTHS.reduce(
        (sum, month) => sum + (monthsObj?.[month]?.[category.label] ?? 0),
        0
      )
      const budget = annualBudgetOf(category, budgetData?.[year]?.[category.label] ?? 0)
      return { year, actual, budget, variance: budget - actual }
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

