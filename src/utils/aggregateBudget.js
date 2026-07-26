import { DEFAULT_CATEGORY_MAPPING, BUDGET_CATEGORIES } from './constants.js'

export const groupByCategory = (rows, mapping = DEFAULT_CATEGORY_MAPPING) => {
  return rows.reduce((result, row) => {
    const target = mapping[row.item] || mapping[row.item.replace(/\s+合計$/, '')] || '生活費'
    result[target] = (result[target] || 0) + row.amount
    return result
  }, {})
}

export const buildBudgetSummary = (actuals, budget) => {
  const categories = BUDGET_CATEGORIES.map((category) => {
    const actual = actuals[category.label] || 0
    const budgetValue = budget[category.label] || 0
    return {
      label: category.label,
      actual,
      budget: budgetValue,
      variance: budgetValue - actual,
      annual: category.annual,
    }
  })
  const totalActual = categories.reduce((sum, item) => sum + item.actual, 0)
  const totalBudget = categories.reduce((sum, item) => sum + item.budget, 0)

  return { categories, totalActual, totalBudget }
}
