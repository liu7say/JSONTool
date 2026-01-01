<script setup>
import { computed, ref } from 'vue'
import { formatJsonText } from '../features/json/format'
import { sortJsonKeys } from '../features/json/sort'
import { jsonToTable, findArrayPaths } from '../features/json/table'
import { DocumentCopy, ScaleToOriginal, Operation, Rank, Grid, Back } from '@element-plus/icons-vue'
import CodeEditor from './CodeEditor.vue'

const props = defineProps({
  doc: {
    type: Object,
    required: true,
  },
  viewMode: {
    type: String, // 'code' | 'table' | 'diff'
    default: 'code',
  },
  selectedArrayPath: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:doc', 'update:viewMode', 'update:selectedArrayPath', 'save']);

const inputText = computed({
  get: () => props.doc.sourceText,
  set: (val) => emit('update:doc', val),
});

// 计算可用的数组路径
const availableArrayPaths = computed(() => {
  if (!props.doc || props.doc.parseError) return []
  return findArrayPaths(props.doc.parsedValue)
})

// 当前选中的路径
const selectedPath = computed({
  get: () => props.selectedArrayPath,
  set: (val) => emit('update:selectedArrayPath', val)
})

// 计算属性：表格视图数据（仅在 viewMode === 'table' 时使用）
const tableResult = computed(() => jsonToTable(props.doc, selectedPath.value));

const isSorting = ref(false)
const codeEditorRef = ref(null)

const jumpToNextError = () => {
  if (!codeEditorRef.value || !codeEditorRef.value.jumpToNextError) return
  codeEditorRef.value.jumpToNextError()
}

// 操作：原地修改
const applyFormat = () => {
  const { text, error } = formatJsonText(props.doc, { indent: 2 })
  if (!error && text) {
    emit('update:doc', text)
  }
}

const applyCompact = () => {
  const { text, error } = formatJsonText(props.doc, { indent: 0 })
  if (!error && text) {
    emit('update:doc', text)
  }
}

const applySort = () => {
  if (isSorting.value) return
  isSorting.value = true

  // 先让 loading 渲染出来，避免大 JSON 看起来“卡死”
  setTimeout(() => {
    try {
      const { text, error } = sortJsonKeys(props.doc, { indent: 2 })
      if (!error && text) {
        emit('update:doc', text)
      }
    } finally {
      isSorting.value = false
    }
  }, 0)
}

const toggleTableMode = () => {
  if (props.viewMode === 'table') {
    emit('update:viewMode', 'code')
  } else {
    emit('update:viewMode', 'table')
  }
}

</script>

<template>
  <div class="json-editor">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="group">
        <!-- 核心编辑操作 (仅在代码模式可用) -->
        <template v-if="viewMode === 'code'">
            <el-tooltip content="格式化 (Pretty)" placement="bottom">
                <el-button size="small" @click="applyFormat">
                    <el-icon><DocumentCopy /></el-icon> 格式化
                </el-button>
            </el-tooltip>
            
            <el-tooltip content="压缩 (Compact)" placement="bottom">
                <el-button size="small" @click="applyCompact">
                    <el-icon><ScaleToOriginal /></el-icon> 压缩
                </el-button>
            </el-tooltip>

            <el-tooltip content="键排序 (Sort Keys)" placement="bottom">
                <el-button size="small" @click="applySort">
                    <el-icon><Rank /></el-icon> 排序
                </el-button>
            </el-tooltip>

            <el-tooltip content="跳到错误位置" placement="bottom">
                <el-button size="small" :disabled="!doc.parseError" @click="jumpToNextError">
                    跳到错误
                </el-button>
            </el-tooltip>
        </template>

        <!-- 视图切换 -->
        <el-tooltip :content="viewMode === 'table' ? '返回代码 (Code)' : '表格视图 (Table)'" placement="bottom">
             <el-button 
                size="small" 
                :type="viewMode === 'table' ? 'primary' : ''" 
                @click="toggleTableMode"
            >
                <el-icon v-if="viewMode === 'table'"><Back /></el-icon>
                <el-icon v-else><Grid /></el-icon>
                {{ viewMode === 'table' ? '返回代码' : '表格视图' }}
            </el-button>
        </el-tooltip>
      </div>
      
      <div class="group">
           <el-button size="small" type="success" plain @click="$emit('save')">
             <el-icon><Operation /></el-icon> 保存快照
           </el-button>
      </div>
    </div>

    <!-- 主编辑区 -->
    <div class="editor-main">
        <!-- 表格模式 -->
        <div v-if="viewMode === 'table'" class="table-wrapper">
             <!-- 路径选择器（始终显示） -->
             <div v-if="availableArrayPaths.length > 0" class="path-selector">
               <span>选择数组字段：</span>
               <el-select v-model="selectedPath" size="small" style="width: 200px" placeholder="请选择">
                 <el-option
                   v-for="path in availableArrayPaths"
                   :key="path"
                   :label="path || '(顶层数组)'"
                   :value="path"
                 />
               </el-select>
             </div>

             <el-empty v-if="!selectedPath && availableArrayPaths.length > 0" description="请选择一个数组字段" />
             <el-empty v-else-if="tableResult.error" :description="tableResult.error" />
             <div v-else class="table-container">
               <el-table :data="tableResult.rows" stripe border height="100%">
                 <el-table-column
                   v-for="col in tableResult.columns"
                   :key="col"
                   :prop="col"
                   :label="col"
                   min-width="150"
                 />
               </el-table>
             </div>
        </div>
        
        <!-- 代码模式 (CodeMirror) -->
        <div
          v-else
          class="code-wrapper"
          v-loading="isSorting"
          element-loading-text="排序中..."
        >
             <CodeEditor 
                ref="codeEditorRef"
                v-model="inputText" 
                @change="(val) => emit('update:doc', val)"
             />
             
             <!-- 状态栏覆盖在编辑器底部 -->
             <div class="status-bar" :class="doc.parseError ? 'error' : 'ok'">
                <span v-if="!String(doc.sourceText || '').trim()">请输入 JSON</span>
                <span v-else-if="doc.parseError">{{ doc.parseError }}</span>
                <span v-else>JSON 有效 • {{ (doc.sourceText || '').length }} 字符</span>
             </div>
        </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '../styles/variables' as *;

.json-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--bg-primary);
}

.toolbar {
  height: 40px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background-color: var(--bg-secondary);
}

.group {
    display: flex;
    gap: 8px;
}

.editor-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  min-height: 0;
}

.table-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: var(--bg-primary);
}

.table-container {
  flex: 1;
  overflow: hidden;
}

.path-selector {
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-secondary);

  span {
    font-size: 14px;
    color: var(--text-primary);
  }
}

.code-wrapper {
    flex: 1;
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.code-wrapper :deep(.code-editor-wrapper) {
    flex: 1;
    min-height: 0;
}

.status-bar {
    height: 24px;
    padding: 0 10px;
    font-size: 12px;
    display: flex;
    align-items: center;
    color: white;
    z-index: 10;
    
    &.error {
        background-color: #c72e0f;
    }
    
    &.ok {
        background-color: var(--accent-color);
    }
}
</style>
