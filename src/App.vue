<script setup>
import { onMounted, ref } from 'vue'
import { useSessionStore } from './stores/session'
import { useHistoryStore } from './stores/history'
import { useThemeStore } from './stores/theme'
import JsonEditor from './components/JsonEditor.vue'
import { Plus, Close, Clock, Delete, Moon, Sunny } from '@element-plus/icons-vue'

const sessionStore = useSessionStore()
const historyStore = useHistoryStore()
const themeStore = useThemeStore()

const showHistory = ref(false)

onMounted(() => {
  if (sessionStore.tabs.length === 0) {
    sessionStore.createTab()
  }
  historyStore.loadIndex()
})

const onUpdateDoc = (id, text) => {
  sessionStore.updateTabDoc(id, text)
}

const onUpdateViewMode = (id, mode) => {
    sessionStore.updateTabViewMode(id, mode)
}

const onUpdateArrayPath = (id, path) => {
  sessionStore.updateTabArrayPath(id, path)
}

const onSaveHistory = async (tab) => {
    try {
        await historyStore.saveEntry({
            doc: { ...tab.doc, parsedValue: null },
            toolState: { viewMode: tab.viewMode },
            title: tab.title || '未命名快照'
        })
    } catch (e) {
        console.error(e)
    }
}

const loadHistoryEntry = async (entry) => {
    const data = await historyStore.loadEntry(entry.id)
    if (data && data.doc) {
        const tab = sessionStore.createTab(data.doc.sourceText)
        tab.title = entry.title || tab.title
        if (data.toolState?.viewMode) {
            tab.viewMode = data.toolState.viewMode === 'format' ? 'code' : data.toolState.viewMode
        }
        showHistory.value = false
    }
}
</script>

<template>
  <div class="app-container">
    <!-- 顶部 Tab 栏 -->
    <div class="header">
      <div class="brand">JSONTool</div>
      
      <div class="tabs-scroll">
          <div 
            v-for="tab in sessionStore.tabs" 
            :key="tab.id"
            class="tab-item"
            :class="{ active: sessionStore.activeTabId === tab.id }"
            @click="sessionStore.setActive(tab.id)"
          >
            <span class="tab-title">{{ tab.title }}</span>
            <span class="tab-close" @click.stop="sessionStore.closeTab(tab.id)">
                <el-icon><Close /></el-icon>
            </span>
          </div>
      </div>
      
      <div class="header-actions">
        <el-button circle size="small" @click="sessionStore.createTab()">
            <el-icon><Plus /></el-icon>
        </el-button>
        
        <div class="divider"></div>
        
        <!-- 主题切换 -->
        <el-button circle size="small" @click="themeStore.toggle">
            <el-icon v-if="themeStore.isDark"><Moon /></el-icon>
            <el-icon v-else><Sunny /></el-icon>
        </el-button>

        <el-button circle size="small" @click="showHistory = true" title="历史记录">
            <el-icon><Clock /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="content-area">
        <JsonEditor
            v-if="sessionStore.activeTab"
            :doc="sessionStore.activeTab.doc"
            :view-mode="sessionStore.activeTab.viewMode"
            :selected-array-path="sessionStore.activeTab.selectedArrayPath"
            @update:doc="(val) => onUpdateDoc(sessionStore.activeTab.id, val)"
            @update:view-mode="(val) => onUpdateViewMode(sessionStore.activeTab.id, val)"
            @update:selected-array-path="(val) => onUpdateArrayPath(sessionStore.activeTab.id, val)"
            @save="onSaveHistory(sessionStore.activeTab)"
        />
        <div v-else class="empty-state">
            <el-empty description="没有打开的标签页">
                <el-button type="primary" @click="sessionStore.createTab()">新建 JSON</el-button>
            </el-empty>
        </div>
    </div>

    <!-- 历史记录抽屉 -->
    <el-drawer v-model="showHistory" title="历史记录" size="300px">
        <div class="history-list">
             <div v-if="!historyStore.index.length" class="muted-text">暂无历史记录</div>
             <div 
                v-for="item in historyStore.index" 
                :key="item.id" 
                class="history-entry"
            >
                <div class="entry-main" @click="loadHistoryEntry(item)">
                    <div class="entry-title">{{ item.title }}</div>
                    <div class="entry-time">{{ new Date(item.createdAt).toLocaleString() }}</div>
                </div>
                <el-button 
                    link 
                    type="danger" 
                    class="entry-del" 
                    @click="historyStore.removeEntry(item.id)"
                >
                    <el-icon><Delete /></el-icon>
                </el-button>
             </div>
             
             <div v-if="historyStore.index.length" class="history-footer">
                <el-button type="danger" plain size="small" @click="historyStore.clearAll">清空全部</el-button>
             </div>
        </div>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
@use './styles/variables' as *;

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.header {
  height: 35px;
  background-color: var(--bg-secondary);
  display: flex;
  align-items: center;
  user-select: none;
  border-bottom: 1px solid var(--border-color);
}

.brand {
    padding: 0 16px;
    font-weight: bold;
    color: var(--accent-color);
    font-size: 14px;
}

.tabs-scroll {
    flex: 1;
    display: flex;
    overflow-x: auto;
    height: 100%;
}

.tabs-scroll::-webkit-scrollbar {
    height: 0;
}

.tab-item {
    display: flex;
    align-items: center;
    padding: 0 10px;
    background-color: var(--bg-tertiary);
    border-right: 1px solid var(--bg-primary);
    min-width: 100px;
    max-width: 200px;
    cursor: pointer;
    font-size: 13px;
    color: var(--text-secondary);
    transition: background-color 0.2s;

    &:hover {
        background-color: var(--hover-color);
        
        .tab-close {
            opacity: 1;
        }
    }

    &.active {
        background-color: var(--bg-primary);
        color: var(--text-primary);
        border-top: 2px solid var(--accent-color);
    }
}

.tab-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.tab-close {
    margin-left: 8px;
    border-radius: 4px;
    padding: 2px;
    display: flex;
    opacity: 0;
    transition: opacity 0.2s, background-color 0.2s;
    
    &:hover {
        background-color: var(--border-color);
    }
}

.header-actions {
    display: flex;
    align-items: center;
    padding: 0 10px;
    background-color: var(--bg-secondary);
    gap: 8px;
}

.divider {
    width: 1px;
    height: 16px;
    background-color: var(--border-color);
    margin: 0 4px;
}

.content-area {
    flex: 1;
    overflow: hidden;
    position: relative;
}

.empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
}

// 历史记录
.history-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.history-entry {
    display: flex;
    background-color: var(--bg-secondary);
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid var(--border-color);
}

.entry-main {
    flex: 1;
    padding: 8px;
    cursor: pointer;
    
    &:hover {
        background-color: var(--hover-color);
    }
}

.entry-title {
    font-weight: 500;
    color: var(--text-primary);
    font-size: 13px;
}

.entry-time {
    font-size: 11px;
    color: var(--text-secondary);
    margin-top: 4px;
}

.entry-del {
    padding: 0 12px;
}

.history-footer {
    margin-top: 16px;
    text-align: center;
}

.muted-text {
    color: var(--text-secondary);
    text-align: center;
    padding: 20px;
}
</style>
