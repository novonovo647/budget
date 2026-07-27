<template>
  <span ref="root" class="breakdown-cell">
    <button
      v-if="items.length"
      type="button"
      class="amount-btn"
      @click.stop="toggle"
    >{{ formatYen(amount) }}</button>
    <span v-else>{{ formatYen(amount) }}</span>

    <Teleport to="body">
      <div v-if="open" class="breakdown-pop" :style="popStyle" @click.stop>
        <div v-for="row in items" :key="row.item" class="breakdown-row">
          <span class="breakdown-item">{{ row.item }}</span>
          <span class="breakdown-amount">{{ formatYen(row.amount) }}</span>
        </div>
      </div>
    </Teleport>
  </span>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  amount: { type: Number, default: 0 },
  items: { type: Array, default: () => [] }, // [{ item, amount }]
})

const POP_WIDTH = 260
const MARGIN = 8

const open = ref(false)
const root = ref(null)
const popStyle = ref({})

const formatYen = (value) =>
  value.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 })

// クリックしたセル位置を基準に、ビューポート座標（fixed）でポップアップを配置する
const place = () => {
  const rect = root.value?.getBoundingClientRect()
  if (!rect) return
  const left = Math.min(rect.left, window.innerWidth - POP_WIDTH - MARGIN)
  popStyle.value = {
    top: `${rect.bottom + 4}px`,
    left: `${Math.max(MARGIN, left)}px`,
  }
}

const toggle = async () => {
  open.value = !open.value
  if (open.value) {
    await nextTick()
    place()
  }
}

const onDocClick = (event) => {
  if (root.value && !root.value.contains(event.target)) open.value = false
}
const close = () => {
  open.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  window.addEventListener('scroll', close, true)
  window.addEventListener('resize', close)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  window.removeEventListener('scroll', close, true)
  window.removeEventListener('resize', close)
})
</script>

<style scoped>
.breakdown-cell {
  display: inline-block;
}

.amount-btn {
  border: none;
  background: transparent;
  padding: 0;
  font: inherit;
  color: #0b57d0;
  cursor: pointer;
  text-decoration: underline dotted;
}

.breakdown-pop {
  position: fixed;
  z-index: 2000;
  min-width: 200px;
  max-width: 260px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  padding: 8px 10px;
  font-size: 0.8rem;
  font-weight: 400;
  color: #444;
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 2px 0;
}

.breakdown-item {
  color: #333;
}

.breakdown-amount {
  color: #555;
  white-space: nowrap;
}
</style>
