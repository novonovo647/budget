import { ref, computed, watch } from 'vue'
import { doc, onSnapshot } from 'firebase/firestore'
import { parseBudgetText } from '../utils/parseBudgetText.js'
import { groupByCategory, buildMonthlyTable, buildAnnualTable } from '../utils/aggregateBudget.js'
import { buildYearOptions } from '../utils/period.js'
import { DEFAULT_CATEGORY_MAPPING, FIRESTORE, BUDGET_FIELDS, AUTOSAVE_DEBOUNCE_MS } from '../utils/constants.js'
import { db, auth } from '../firebase.js'
import { saveWithHistory } from '../lib/persistence.js'

export const useBudget = () => {
  // 実績: { [年]: { [月]: { [カテゴリ]: 金額 } } }
  const actualData = ref({})
  // 予算: { [年]: { [カテゴリ]: 月目標 } }（旅行費のみ年間額）
  const budgetData = ref({})
  // マッチング設定は UI から編集せず、定数の既定マッピングを直接利用する
  const budgetConfig = ref(DEFAULT_CATEGORY_MAPPING)

  // 同期状態: idle | loading | saving | saved | error
  const syncStatus = ref('idle')
  let unsub = null
  let saveTimer = null
  let applyingRemote = false // リモート反映中はローカル保存を抑止
  let ready = false // 初回ロード完了フラグ

  // Firestore の購読を開始（ログイン後に呼ぶ）
  const startSync = () => {
    if (unsub) return
    syncStatus.value = 'loading'
    unsub = onSnapshot(
      doc(db, FIRESTORE.collection, FIRESTORE.docId),
      (snap) => {
        applyingRemote = true
        if (snap.exists()) {
          const d = snap.data()
          actualData.value = d[BUDGET_FIELDS.actualData] ?? {}
          budgetData.value = d[BUDGET_FIELDS.budgetData] ?? {}
        }
        ready = true
        syncStatus.value = 'saved'
        // watch の発火を無視するため、次のマイクロタスクでフラグ解除
        queueMicrotask(() => {
          applyingRemote = false
        })
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
    clearTimeout(saveTimer)
    syncStatus.value = 'idle'
  }

  const doSave = async () => {
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

  // 入力変更を検知して自動保存（デバウンス）
  watch(
    [actualData, budgetData],
    () => {
      if (applyingRemote || !ready) return
      syncStatus.value = 'saving'
      clearTimeout(saveTimer)
      saveTimer = setTimeout(doSave, AUTOSAVE_DEBOUNCE_MS)
    },
    { deep: true }
  )

  // 保留中のデバウンス保存を待たず、即時に保存する（モーダルを閉じたときなどに使用）。
  const flushSave = () => {
    if (applyingRemote || !ready) return
    clearTimeout(saveTimer)
    return doSave()
  }

  // 貼り付けテキストを解析し、指定した年月の実績を丸ごと差し替える（置換登録）。
  // 上書きではなく置換のため、項目が無くなったケースにも対応できる。
  const importActual = (year, month, text) => {
    const grouped = groupByCategory(parseBudgetText(text), budgetConfig.value)
    const nextYear = { ...(actualData.value[year] ?? {}) }
    nextYear[month] = grouped
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
    actualData,
    budgetData,
    budgetConfig,
    yearOptions,
    dataYears,
    monthlyTableFor,
    annualTable,
    importActual,
    setBudgetForYear,
    syncStatus,
    startSync,
    stopSync,
    flushSave,
  }
}
