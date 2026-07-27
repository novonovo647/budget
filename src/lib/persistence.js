import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { FIRESTORE } from '../utils/constants.js'

// 世代バックアップの保持件数（最新から N 件を残す）
export const MAX_HISTORY = 10

/**
 * budgetdata/{docId} を上書き保存する前に、現行内容を
 * budgetdata/{docId}_backups の history 配列に退避する。
 *
 * - バックアップ失敗は本保存を妨げない（データ保存を最優先）
 *
 * @param {string} docId   コレクション内のドキュメントID
 * @param {object} payload 新しく保存する内容
 */
export async function saveWithHistory(docId, payload) {
  const liveRef   = doc(db, FIRESTORE.collection, docId)
  const backupRef = doc(db, FIRESTORE.collection, `${docId}_backups`)

  // 1) 現行内容をバックアップ履歴へ退避（失敗しても続行）
  try {
    const current = await getDoc(liveRef)
    if (current.exists()) {
      const bk = await getDoc(backupRef)
      const history = bk.exists() ? (bk.data().history ?? []) : []
      history.push({ data: current.data(), at: Date.now() })
      // 最新 MAX_HISTORY 件だけ残す
      await setDoc(backupRef, { history: history.slice(-MAX_HISTORY) })
    }
  } catch {
    /* バックアップ失敗は無視（本保存を優先） */
  }

  // 2) 新データを保存
  await setDoc(liveRef, payload)
}

/**
 * バックアップ履歴を取得する（新しい順）。
 * @param {string} docId
 * @returns {Promise<Array<{ data: object, at: number }>>}
 */
export async function loadHistory(docId) {
  const backupRef = doc(db, FIRESTORE.collection, `${docId}_backups`)
  const bk = await getDoc(backupRef)
  if (!bk.exists()) return []
  return [...(bk.data().history ?? [])].reverse()
}
