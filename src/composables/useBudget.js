import { ref, computed } from 'vue'
import { parseBudgetText } from '../utils/parseBudgetText.js'
import { groupByCategory, buildBudgetSummary } from '../utils/aggregateBudget.js'
import { BUDGET_CATEGORIES } from '../utils/constants.js'

export const useBudget = () => {
  const actualText = ref('')
  const budgetText = ref('')
  const budgetConfig = ref({})

  const actualRows = computed(() => parseBudgetText(actualText.value))
  const budgetRows = computed(() => parseBudgetText(budgetText.value))
  const actualGrouped = computed(() => groupByCategory(actualRows.value, budgetConfig.value))
  const budgetGrouped = computed(() => groupByCategory(budgetRows.value, budgetConfig.value))
  const summary = computed(() => buildBudgetSummary(actualGrouped.value, budgetGrouped.value))

  const monthlyCategories = computed(() => summary.value.categories.filter((item) => !item.annual))
  const annualCategories = computed(() => summary.value.categories.filter((item) => item.annual))

  const chartData = computed(() => ({
    labels: summary.value.categories.map((item) => item.label),
    actuals: summary.value.categories.map((item) => item.actual),
    budgets: summary.value.categories.map((item) => item.budget),
  }))

  const categoryOptions = computed(() => BUDGET_CATEGORIES.map((item) => item.label))

  return {
    actualText,
    budgetText,
    budgetConfig,
    actualRows,
    budgetRows,
    actualGrouped,
    budgetGrouped,
    summary,
    monthlyCategories,
    annualCategories,
    chartData,
    categoryOptions,
  }
}
