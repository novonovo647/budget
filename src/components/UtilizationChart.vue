<template>
  <div class="util-chart">
    <p v-if="!items.length" class="empty-text">表示できるデータがありません。</p>

    <div v-for="item in items" :key="item.label" class="util-row">
      <div class="util-label">{{ item.label }}</div>
      <div class="util-bar">
        <div class="util-track">
          <div
            class="util-fill"
            :style="{ width: fillWidth(item) + '%', background: item.percent > 100 ? colors.over : colors.actual }"
          ></div>
        </div>
        <span class="util-percent" :class="{ over: item.percent > 100 }">
          {{ item.budget > 0 ? Math.round(item.percent) + '%' : '—' }}
        </span>
      </div>
      <div class="util-amounts">{{ formatYen(item.actual) }} / {{ formatYen(item.budget) }}</div>
    </div>
  </div>
</template>

<script setup>
import { CHART_COLORS } from '../utils/constants.js'

defineProps({
  // { label, actual, budget, percent } の配列
  items: { type: Array, default: () => [] },
})

const colors = CHART_COLORS

// バーの塗り幅（0〜100%。超過分は色で表現）
const fillWidth = (item) => {
  if (item.budget <= 0) return 0
  return Math.min(100, item.percent)
}

const formatYen = (value) =>
  value.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 })
</script>

<style scoped>
.util-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-text {
  color: #888;
  margin: 0;
}

.util-row {
  display: grid;
  grid-template-columns: 90px 1fr auto;
  align-items: center;
  gap: 12px;
}

.util-label {
  font-weight: 600;
}

.util-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.util-track {
  flex: 1;
  height: 16px;
  background: #eef1f5;
  border-radius: 8px;
  overflow: hidden;
}

.util-fill {
  height: 100%;
  border-radius: 8px;
  min-width: 2px;
  transition: width 0.3s ease;
}

.util-percent {
  min-width: 48px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.util-percent.over {
  color: #e53935;
  font-weight: 600;
}

.util-amounts {
  color: #666;
  font-size: 0.8rem;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .util-row {
    grid-template-columns: 72px 1fr;
  }

  .util-amounts {
    grid-column: 2;
  }
}
</style>
