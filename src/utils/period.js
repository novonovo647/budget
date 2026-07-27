import { YEAR_RANGE_BACK, YEAR_RANGE_FORWARD } from './constants.js'

// 実績・予算に存在する年と、現在年の前後範囲をマージして年の選択肢を生成する。
// 返り値は昇順の数値配列。
export const buildYearOptions = (availableYears = [], baseYear = new Date().getFullYear()) => {
  const years = new Set()
  for (const year of availableYears) {
    const numeric = Number(year)
    if (Number.isFinite(numeric)) years.add(numeric)
  }
  for (let year = baseYear - YEAR_RANGE_BACK; year <= baseYear + YEAR_RANGE_FORWARD; year += 1) {
    years.add(year)
  }
  return [...years].sort((a, b) => a - b)
}
