import { ref, computed } from 'vue'
import { doc, onSnapshot } from 'firebase/firestore'
import { parseBudgetText } from '../utils/parseBudgetText.js'
import { buildMonthlyTable, buildAnnualTable } from '../utils/aggregateBudget.js'
import { buildYearOptions } from '../utils/period.js'
import { FIRESTORE, BUDGET_FIELDS } from '../utils/constants.js'
import { db, auth } from '../firebase.js'
import { saveWithHistory } from '../lib/persistence.js'

export const useBudget = () => {
  // 実績: { [年]: { [月]: 明細配列 [{ item, amount }] } }（集計は表示時に行う）
  const actualData = ref({})
  // 予算: { [年]: { [カテゴリ]: 月目標 } }（旅行費のみ年間額）
  const budgetData = ref({})

  // 保存状態: idle | saving | saved | error（保存はボタン操作のときだけ行う）
  const syncStatus = ref('idle')
  let unsub = null
  let ready = false // 初回ロード完了フラグ

  // Firestore の購読を開始（ログイン後に呼ぶ）
  const startSync = () => {
    if (unsub) return
    unsub = onSnapshot(
      doc(db, FIRESTORE.collection, FIRESTORE.docId),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data()
          actualData.value = d[BUDGET_FIELDS.actualData] ?? {}
          budgetData.value = d[BUDGET_FIELDS.budgetData] ?? {}
        }
        ready = true
      },
      () => {
        syncStatus.value = 'error'
      }
    )
  }

  // 購読を解除
  const stopSync = () => {
    unsub?.()
    unsub = null
    ready = false
    syncStatus.value = 'idle'
  }

  // 現在の実績・予算を Firestore に保存する（保存ボタンから呼ぶ）。
  const save = async () => {
    if (!ready) return
    syncStatus.value = 'saving'
    try {
      await saveWithHistory(FIRESTORE.docId, {
        [BUDGET_FIELDS.actualData]: actualData.value,
        [BUDGET_FIELDS.budgetData]: budgetData.value,
        savedBy: auth.currentUser?.uid ?? '',
        editorName: auth.currentUser?.displayName ?? '',
        updatedAt: Date.now(),
      })
      syncStatus.value = 'saved'
    } catch {
      syncStatus.value = 'error'
    }
  }

  // 保存メッセージを消す（保存以外の操作をしたときに呼ぶ）。
  const resetStatus = () => {
    syncStatus.value = 'idle'
  }

  // 貼り付けテキストを解析し、指定した年月の実績（明細配列）を丸ごと差し替える（置換登録）。
  // 集計は表示時に行うため、ここでは明細（項目・金額）を順序どおりそのまま保存する。
  const importActual = (year, month, text) => {
    const rows = parseBudgetText(text).map((row) => ({ item: row.item, amount: row.amount }))
    const nextYear = { ...(actualData.value[year] ?? {}) }
    nextYear[month] = rows
    actualData.value = { ...actualData.value, [year]: nextYear }
  }

  // 指定した年の予算（カテゴリ別月目標）をまとめて更新する。
  const setBudgetForYear = (year, amounts) => {
    budgetData.value = { ...budgetData.value, [year]: { ...amounts } }
  }

  // 実績・予算に含まれる年 + 現在年前後をマージした選択肢（昇順）
  const yearOptions = computed(() =>
    buildYearOptions([...Object.keys(actualData.value), ...Object.keys(budgetData.value)])
  )

  // データが存在する年（昇順）。年次テーブルの列に使う。
  const dataYears = computed(() => {
    const set = new Set([...Object.keys(actualData.value), ...Object.keys(budgetData.value)])
    return [...set].map(Number).filter(Number.isFinite).sort((a, b) => a - b)
  })

  // 指定年の月次テーブルを生成する
  const monthlyTableFor = (year) =>
    buildMonthlyTable(actualData.value[year] ?? {}, budgetData.value[year] ?? {})

  // 全対象年の年次テーブル
  const annualTable = computed(() =>
    buildAnnualTable(dataYears.value, actualData.value, budgetData.value)
  )

  return {
    budgetData,
    yearOptions,
    dataYears,
    monthlyTableFor,
    annualTable,
    importActual,
    setBudgetForYear,
    syncStatus,
    startSync,
    stopSync,
    save,
    resetStatus,
  }
}
