<template>
  <k-layout class="page-microcommands" menu="microcommands">
    <template #header>微指令{{ currentName ? " - " + currentName : "" }}</template>

    <template #left>
      <el-scrollbar ref="scrollbar" class="command-scrollbar">
        <div class="search">
          <el-input v-model="filter" #suffix>
            <k-icon name="search"></k-icon>
          </el-input>
        </div>
        <div class="command-list" ref="listEl">
          <button
            v-for="name in filteredNames"
            :key="name"
            type="button"
            class="command-item"
            :class="{ active: currentName === name && !isDraft }"
            @click="selectCommand(name)"
          >
            {{ name }}
          </button>
        </div>
      </el-scrollbar>
    </template>

    <section class="editor-pane">
      <div v-if="error" class="error-message" role="alert">{{ error }}</div>
      <k-codemirror-editor
        ref="editor"
        v-if="currentName"
        :key="currentName"
        v-model="code"
        language="javascript"
        scroll-past-end
        class="source-editor"
      />
      <k-empty v-else>
        <div>从左侧选择微指令，或新建一个定义</div>
      </k-empty>
      <div v-if="currentName" class="editor-toolbar" role="toolbar" aria-label="编辑工具">
        <el-button-group>
          <el-tooltip content="全选" placement="top">
            <el-button text bg @mousedown.prevent @click="selectAll">
              <k-icon name="select-all" />
            </el-button>
          </el-tooltip>
          <el-tooltip content="撤销" placement="top">
            <el-button text bg @mousedown.prevent @click="undo">
              <k-icon name="undo" />
            </el-button>
          </el-tooltip>
          <el-tooltip content="重做" placement="top">
            <el-button text bg @mousedown.prevent @click="redo">
              <k-icon name="redo" />
            </el-button>
          </el-tooltip>
          <el-tooltip content="减少缩进" placement="top">
            <el-button text bg @mousedown.prevent @click="indentLess">
              <k-icon name="indent-less" />
            </el-button>
          </el-tooltip>
          <el-tooltip content="增加缩进" placement="top">
            <el-button text bg @mousedown.prevent @click="indentMore">
              <k-icon name="indent-more" />
            </el-button>
          </el-tooltip>
          <el-tooltip content="自动缩进" placement="top">
            <el-button text bg @mousedown.prevent @click="indentSelection">
              <k-icon name="auto-indent" />
            </el-button>
          </el-tooltip>
          <el-tooltip content="查找/替换" placement="top">
            <el-button text bg @mousedown.prevent @click="toggleFindReplace">
              <k-icon name="find-replace" />
            </el-button>
          </el-tooltip>
        </el-button-group>
      </div>
    </section>

    <el-dialog
      v-model="nameDialogVisible"
      title="新建微指令"
      width="28rem"
      @open="handleOpen"
    >
      <el-form @submit.prevent="submitDraft">
        <el-form-item :error="nameError">
          <el-input
            ref="nameInput"
            v-model="draftName"
            placeholder="请输入名称"
            @input="nameError = ''"
            @keyup.enter="submitDraft"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="nameDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitDraft">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="confirmationVisible"
      title="确认操作"
      width="28rem"
      :before-close="cancelConfirmation"
    >
      <p>{{ confirmationMessage }}</p>
      <template #footer>
        <el-button @click="settleConfirmation(false)">取消</el-button>
        <el-button type="danger" @click="settleConfirmation(true)">
          {{ confirmationAction }}
        </el-button>
      </template>
    </el-dialog>
  </k-layout>
</template>

<script setup lang="ts">
import { computed, nextTick, onActivated, onMounted, ref } from "vue"
import { send, useContext } from "@koishijs/client"

const ctx = useContext()

ctx.action("microcommands.new", {
  shortcut: "ctrl+n",
  action: createDraft,
})
ctx.action("microcommands.save", {
  shortcut: "ctrl+s",
  disabled: () => !dirty.value || !currentName.value || busy.value,
  action: save,
})
ctx.action("microcommands.delete", {
  disabled: () => isDraft.value || !currentName.value || busy.value,
  action: remove,
})
ctx.action("microcommands.refresh", {
  disabled: () => busy.value,
  action: refresh,
})

const names = ref<string[]>([])
const currentName = ref("")
const code = ref("")
const savedCode = ref("")
const filter = ref("")
const error = ref("")
const isDraft = ref(false)
const busy = ref(false)
const nameDialogVisible = ref(false)
const draftName = ref("")
const nameError = ref("")
const nameInput = ref<{ focus: () => void }>()
const confirmationVisible = ref(false)
const confirmationMessage = ref("")
const confirmationAction = ref("")
const listEl = ref<HTMLElement>()
const scrollbar = ref<{ setScrollTop(value: number): void }>()
const editor = ref<{
  selectAll(): void
  undo(): void
  redo(): void
  indentLess(): void
  indentMore(): void
  indentSelection(): void
  toggleFindReplace(): void
}>()
let resolveConfirmation: ((confirmed: boolean) => void) | undefined

const dirty = computed(() => code.value !== savedCode.value)
const filteredNames = computed(() =>
  names.value.filter(name =>
    name.toLocaleLowerCase().includes(filter.value.toLocaleLowerCase()),
  ),
)

function reportError(cause: unknown) {
  error.value = cause instanceof Error ? cause.message : String(cause)
}

async function handleOpen() {
  await nextTick()
  nameInput.value?.focus()
}

function selectAll() {
  editor.value?.selectAll()
}

function undo() {
  editor.value?.undo()
}

function redo() {
  editor.value?.redo()
}

function indentLess() {
  editor.value?.indentLess()
}

function indentMore() {
  editor.value?.indentMore()
}

function indentSelection() {
  editor.value?.indentSelection()
}

function toggleFindReplace() {
  editor.value?.toggleFindReplace()
}

function askConfirmation(message: string, action: string) {
  confirmationMessage.value = message
  confirmationAction.value = action
  confirmationVisible.value = true
  return new Promise<boolean>(resolve => {
    resolveConfirmation = resolve
  })
}

function settleConfirmation(confirmed: boolean) {
  confirmationVisible.value = false
  resolveConfirmation?.(confirmed)
  resolveConfirmation = undefined
}

function cancelConfirmation(done: () => void) {
  settleConfirmation(false)
  done()
}

async function canDiscard() {
  return !dirty.value || (await askConfirmation("放弃未保存的更改？", "放弃"))
}

function clearSelection() {
  currentName.value = ""
  code.value = ""
  savedCode.value = ""
  isDraft.value = false
}

async function loadCommand(name: string) {
  busy.value = true
  error.value = ""
  try {
    const source = await send("microcommands/get", name)
    if (typeof source !== "string") throw new Error("未能读取微指令")
    currentName.value = name
    code.value = source
    savedCode.value = source
    isDraft.value = false
  } catch (cause) {
    reportError(cause)
  } finally {
    busy.value = false
  }
}

async function selectCommand(name: string) {
  if (name === currentName.value && !isDraft.value) return
  if (busy.value || !(await canDiscard())) return
  await loadCommand(name)
}

async function fetchNames() {
  const result = await send("microcommands/list")
  if (!Array.isArray(result)) throw new Error("未能读取微指令列表")
  names.value = result
}

async function refresh() {
  if (busy.value || !(await canDiscard())) return
  const keepName = isDraft.value ? "" : currentName.value
  busy.value = true
  error.value = ""
  try {
    await fetchNames()
    if (keepName && names.value.includes(keepName)) {
      const source = await send("microcommands/get", keepName)
      if (typeof source !== "string") throw new Error("未能读取微指令")
      currentName.value = keepName
      code.value = source
      savedCode.value = source
      isDraft.value = false
    } else {
      clearSelection()
    }
  } catch (cause) {
    reportError(cause)
  } finally {
    busy.value = false
  }
}

async function createDraft() {
  if (busy.value || !(await canDiscard())) return
  draftName.value = ""
  nameError.value = ""
  nameDialogVisible.value = true
}

function submitDraft() {
  const name = draftName.value.trim()
  if (!name) {
    nameError.value = "名称不能为空"
    return
  }
  if (/[\s\x00-\x1f"#%&'()/<>?\x7f-\x9f]|^\.|\.$/.test(name)) {
    nameError.value = "名称包含无效字符"
    return
  }
  if (names.value.includes(name)) {
    nameError.value = "该名称已存在"
    return
  }
  currentName.value = name
  code.value = ""
  savedCode.value = ""
  isDraft.value = true
  error.value = ""
  nameDialogVisible.value = false
}

async function save() {
  if (!currentName.value || !dirty.value || busy.value) return
  busy.value = true
  error.value = ""
  const source = code.value
  try {
    const savedName = await send(
      "microcommands/save",
      currentName.value,
      source,
      !isDraft.value,
    )
    if (typeof savedName !== "string") throw new Error("未能保存微指令")
    currentName.value = savedName
    savedCode.value = source
    isDraft.value = false
    await fetchNames()
  } catch (cause) {
    reportError(cause)
  } finally {
    busy.value = false
  }
}

async function remove() {
  if (!currentName.value || isDraft.value || busy.value || !(await canDiscard())) return
  if (!(await askConfirmation(`删除微指令“${currentName.value}”？`, "删除"))) return
  busy.value = true
  error.value = ""
  try {
    const removed = await send("microcommands/delete", currentName.value)
    if (!removed) throw new Error("微指令不存在或已被删除")
    await fetchNames()
    clearSelection()
  } catch (cause) {
    reportError(cause)
  } finally {
    busy.value = false
  }
}

onMounted(refresh)

onActivated(async () => {
  await nextTick()
  const active = listEl.value?.querySelector(".active") as HTMLElement | null
  const container = listEl.value?.closest(".el-scrollbar__wrap")
  if (!active || !container) return
  const containerRect = container.getBoundingClientRect()
  const activeRect = active.getBoundingClientRect()
  const offset = activeRect.top + activeRect.height / 2 -
    (containerRect.top + containerRect.height / 2)
  scrollbar.value?.setScrollTop(container.scrollTop + offset)
})
</script>

<style scoped>
.search {
  padding: 0 1.5rem;
}

.command-scrollbar {
  flex: 1;
  min-height: 0;
  margin-top: 0.5rem;
  user-select: none;
}

.command-list {
  margin: 0.5rem 0;
}

.command-item {
  display: block;
  width: 100%;
  height: 2rem;
  line-height: 2rem;
  padding: 0 0 0 1rem;
  overflow: hidden;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: var(--color-transition);
}

.command-item:hover,
.command-item.active {
  background: var(--k-color-hover, var(--el-fill-color-light));
}

.command-item.active {
  color: var(--active);
}

.editor-pane {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.source-editor {
  flex: 1;
  min-height: 0;
}

.editor-toolbar {
  overflow-x: auto;
  scrollbar-width: none;
  border-top: 1px solid var(--el-border-color-lighter);
}

.editor-toolbar > :deep(.el-button-group) {
  width: max-content;
}

.editor-toolbar :deep(.el-button) {
  width: 2.75rem;
}

.editor-pane :deep(.codemirror-editor) {
  height: 100%;
}

.error-message {
  padding: 0.5rem 0.75rem;
  color: var(--el-color-danger);
}
</style>
