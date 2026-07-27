<template>
  <span ref="root" class="info-hint">
    <button ref="btn" type="button" class="info-btn" aria-label="説明を表示" @click.stop="toggle">ⓘ</button>
    <Teleport to="body">
      <span v-if="open" class="info-pop" :style="popStyle" @click.stop>
        <slot>{{ text }}</slot>
      </span>
    </Teleport>
  </span>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

defineProps({
  text: { type: String, default: '' },
})

const POP_WIDTH = 280 // ポップアップの最大幅（px）。画面端でのはみ出し補正に使う。
const MARGIN = 8

const open = ref(false)
const root = ref(null)
const btn = ref(null)
const popStyle = ref({})

// ボタン位置を基準に、ビューポート座標（fixed）でポップアップを配置する
const place = () => {
  const rect = btn.value?.getBoundingClientRect()
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

// 外側クリック・スクロール・リサイズで閉じる
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
.info-hint {
  position: relative;
  display: inline-block;
}

.info-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #007bff;
  font-size: 0.85rem;
  line-height: 1;
  padding: 0 4px;
}

.info-pop {
  position: fixed;
  z-index: 2000;
  min-width: 180px;
  max-width: 280px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  padding: 8px 10px;
  font-size: 0.8rem;
  font-weight: 400;
  color: #444;
  white-space: normal;
  text-align: left;
}
</style>
