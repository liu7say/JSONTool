<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { json } from '@codemirror/lang-json'
import { oneDark } from '@codemirror/theme-one-dark'
import { keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { lintGutter, linter, nextDiagnostic } from '@codemirror/lint'
import { useThemeStore } from '../stores/theme'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const editorContainer = ref(null)
const themeStore = useThemeStore()
let editorView = null
let shouldResetToTopAfterPaste = false

const stripBom = (text) => (text && text.charCodeAt(0) === 0xfeff ? text.slice(1) : text)

const getJsonErrorPosition = (errorMessage) => {
  const match = String(errorMessage || '').match(/position\s+(\d+)/i)
  if (!match) return null
  const pos = Number(match[1])
  return Number.isFinite(pos) ? pos : null
}

const findNonWhitespaceBackward = (text, start) => {
  for (let i = Math.min(start, text.length - 1); i >= 0; i--) {
    if (!/\s/.test(text[i])) return i
  }
  return 0
}

const buildJsonDiagnostics = (sourceText, parseError) => {
  const original = String(sourceText || '')
  if (!original.trim()) return []

  const hasBom = original.charCodeAt(0) === 0xfeff
  const cleanedOffset = hasBom ? 1 : 0

  const basePos = getJsonErrorPosition(parseError)
  const docLen = original.length

  let pos = basePos == null ? docLen - 1 : Math.min(Math.max(basePos + cleanedOffset, 0), docLen - 1)

  // 如果错误位置落在换行/空白，向前找到更“像错误点”的字符，避免高亮跑到下一行
  if (/\s/.test(original[pos])) {
    pos = findNonWhitespaceBackward(original, pos)
  }

  // 常见：缺逗号导致 "Unexpected string" 报在下一行的下一个 key 上（通常是引号）
  if (parseError && /Unexpected\s+string/i.test(parseError) && original[pos] === '"') {
    pos = findNonWhitespaceBackward(original, pos - 1)
  }

  const from = Math.max(0, pos)
  const to = Math.min(docLen, from + 1)
  return [
    {
      from,
      to,
      severity: 'error',
      message: String(parseError || 'JSON 解析失败'),
    },
  ]
}

const jsonSyntaxLinter = () => (view) => {
  const original = view.state.doc.toString()
  if (!original.trim()) return []

  const cleaned = stripBom(original)
  try {
    JSON.parse(cleaned)
    return []
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return buildJsonDiagnostics(original, message)
  }
}

const isFullDocumentSelection = (selection, docLength) => {
  if (!selection || !selection.ranges || selection.ranges.length !== 1) return false
  const range = selection.ranges[0]
  return range.from === 0 && range.to === docLength
}

const jumpToNextError = () => {
  if (!editorView) return
  nextDiagnostic(editorView)
  editorView.focus()
}

defineExpose({ jumpToNextError })

// 基础扩展：JSON 语法 + 历史记录 + 快捷键
const getExtensions = (isDark) => {
  const extensions = [
    basicSetup,
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    json(),
    lintGutter(),
    linter(jsonSyntaxLinter()),
    EditorView.domEventHandlers({
      paste(event, view) {
        const docLength = view.state.doc.length
        const isReplacingAll = docLength === 0 || isFullDocumentSelection(view.state.selection, docLength)
        if (!isReplacingAll) return false

        const pastedText = event.clipboardData?.getData('text/plain') || ''
        if (!pastedText) return false

        shouldResetToTopAfterPaste = true
        return false
      },
    }),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newVal = update.state.doc.toString()
        emit('update:modelValue', newVal)
        emit('change', newVal)

        if (shouldResetToTopAfterPaste) {
          shouldResetToTopAfterPaste = false
          update.view.dispatch({ selection: { anchor: 0 } })
          update.view.scrollDOM.scrollTop = 0
        }
      }
    }),
    EditorState.readOnly.of(props.readonly),
    // 样式微调：让编辑器铺满容器
    EditorView.theme({
        "&": { height: "100%", fontSize: "13px" },
        ".cm-scroller": { overflow: "auto", height: "100%" }
    })
  ]

  if (isDark) {
    extensions.push(oneDark)
  } else {
    // Light theme (默认就是 Light，但可以加点微调)
    extensions.push(EditorView.theme({
        "&": { backgroundColor: "#ffffff", color: "#333" },
        ".cm-gutters": { backgroundColor: "#f5f5f5", color: "#ddd", borderRight: "1px solid #ddd" },
        ".cm-activeLineGutter": { backgroundColor: "#e8f2ff" }
    }))
  }

  return extensions
}

const initEditor = () => {
  if (!editorContainer.value) return

  const state = EditorState.create({
    doc: props.modelValue,
    extensions: getExtensions(themeStore.isDark)
  })

  editorView = new EditorView({
    state,
    parent: editorContainer.value
  })
}

// 监听外部 modelValue 变化（单向数据流同步）
watch(() => props.modelValue, (newVal) => {
  if (editorView && newVal !== editorView.state.doc.toString()) {
    editorView.dispatch({
      changes: { from: 0, to: editorView.state.doc.length, insert: newVal }
    })
  }
})

// 监听主题变化，重建扩展（这是最稳的方式，动态 reconfigure 也可以但容易漏）
watch(() => themeStore.isDark, (isDark) => {
  if (!editorView) return
  // 保持当前内容和光标位置
  const content = editorView.state.doc.toString()
  const selection = editorView.state.selection
  
  editorView.destroy()
  
  const state = EditorState.create({
    doc: content,
    extensions: getExtensions(isDark),
    selection
  })
  
  editorView = new EditorView({
    state,
    parent: editorContainer.value
  })
})

// 监听 readonly 变化
watch(() => props.readonly, (val) => {
    if(!editorView) return
    // 重新注入扩展比较重，这里可以用 reconfigure 优化，但为了稳先重刷
    const content = editorView.state.doc.toString()
    editorView.destroy()
    const state = EditorState.create({
        doc: content,
        extensions: getExtensions(themeStore.isDark)
    })
    editorView = new EditorView({ state, parent: editorContainer.value })
})

onMounted(() => {
  initEditor()
})

onBeforeUnmount(() => {
  if (editorView) {
    editorView.destroy()
  }
})
</script>

<template>
  <div class="code-editor-wrapper" ref="editorContainer"></div>
</template>

<style scoped>
.code-editor-wrapper {
  height: 100%;
  width: 100%;
  overflow: hidden;
  min-height: 0;
}
</style>

