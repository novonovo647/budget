export const BUDGET_CATEGORIES = [
  { label: '生活費', annual: false },
  { label: '外食費', annual: false },
  { label: 'ワイン費', annual: false },
  { label: '衣服費', annual: false },
  { label: '美容費', annual: false },
  { label: '車両費', annual: false },
  { label: '通信費', annual: false },
  { label: '予備費', annual: false },
  { label: '旅行費', annual: true },
  { label: '事業費', annual: false },
]

// チャートの色（予実比較の横棒グラフ用）
export const CHART_COLORS = {
  actual: '#007bff', // 実績バー
  budget: '#8bc34a', // 予算バー
  over: '#e53935', // 予算超過を示す色
}

// Firestore の保存先（コレクション名・ドキュメントID）。ハードコード禁止のため一元管理する。
export const FIRESTORE = {
  collection: 'budgetdata',
  docId: 'budget',
}

// Firestore ドキュメント内のフィールド名。ハードコード禁止のため一元管理する。
export const BUDGET_FIELDS = {
  actualData: 'actualData', // 実績データ（年→月→カテゴリ→金額）
  budgetData: 'budgetData', // 予算データ（年→カテゴリ→月目標。旅行費のみ年間額）
}

// 月の一覧（1〜12）。テーブルの横軸やセレクタで利用する。
export const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

// 年セレクタで表示する範囲（現在年から遡る年数・進む年数）
export const YEAR_RANGE_BACK = 5
export const YEAR_RANGE_FORWARD = 1


// マッピングに無い項目の既定カテゴリ（受け皿）。新しい項目が発生しても必ずここに集約される。
export const DEFAULT_CATEGORY = '生活費'

// 実績集計から除外するグループ（小計名）。
// 貼り付けデータは「◯◯ 合計」の小計行に続けて明細行が並ぶため、
// 指定した小計から次の小計までの明細をまとめて対象外にする。
// 現金・カードは電子マネーのチャージやカード引き落とし等の資金移動で、消費ではないため除外する。
export const EXCLUDED_GROUPS = ['現金・カード']

// グループ（小計名）→ カテゴリのマッピング。
// 「◯◯ 合計」から次の小計までの明細を、まとめて指定カテゴリへ集約する。
// 明細名が増えても自動で振り分けられる（項目名を個別に列挙する必要がない）。
// 項目単位のマッピング（DEFAULT_CATEGORY_MAPPING）が優先される。
export const GROUP_CATEGORY_MAPPING = {
  '交際費': '予備費',
  '衣服・美容': '美容費',
  '保険': '予備費',
}

// 項目名 → カテゴリのマッピング。
// 生活費は既定の受け皿（DEFAULT_CATEGORY）のため、ここには明示しない。
// （生活費に入れたい項目は列挙せず、未マッピングとして自動的に生活費へ集約する）
export const DEFAULT_CATEGORY_MAPPING = {
  'ワイン': 'ワイン費',
  '外食': '外食費',
  '衣服': '衣服費',
  'アクセサリー': '衣服費',
  '車検・整備': '車両費',
  '映画・音楽・ゲーム': '通信費',
  '携帯電話': '通信費',
  'インターネット': '通信費',
  '情報サービス': '通信費',
  '旅行': '旅行費',
  '事業経費': '事業費',
  '事業費': '事業費',
  '特別な支出': '予備費',
  '住宅': '予備費',
  '税・社会保障': '予備費',
  '所得税・住民税': '予備費',
  '保険': '予備費',
}
