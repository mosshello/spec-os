# SpecOS

SpecOS 是一套轻量的 Skill 工作流，用来把通用 AI 编码助手收敛成一个更可控的交付闭环。

当前推荐的结构是“三个执行技能 + 一个统一入口”：

- `Selene`：统一入口、调度、运行账本
- `project-context`：项目长期上下文与状态门禁
- `system-architect`：生成机器可执行 Spec
- `task-coder`：实现、验证、自修复、自审

## 这套东西解决什么问题

大多数 AI 编码流程会失控，通常是因为：

- 项目上下文不稳定
- 修改边界不清晰
- 验证是可选的
- 聊天结束后没有结构化沉淀

SpecOS 的目标是把设计和实现拆开，并且要求每个任务都经过 Spec。

## 推荐流程

1. `Selene` 接收用户需求。
2. `project-context` 读取或初始化 `.ai/project.md`。
3. `system-architect` 在 `.ai/specs/` 中生成机器可执行 Spec。
4. `task-coder` 只在 `target_files` 内实现。
5. `task-coder` 执行验证、自修复、自审。
6. `project-context` 更新项目记录。
7. `Selene` 写入运行记录，供分析和后续训练使用。

## 当前技能说明

### `project-context`

维护 `.ai/project.md`，作为长期项目记忆。

### `system-architect`

生成机器可读的 Spec，至少包含：

- `spec_id`
- `target_files`
- `verification_plan`
- `exit_criteria`
- 多人/多 AI 协作时的任务拆分建议

### `task-coder`

按 Spec 执行实现，并吸收原先拆出去的职责：

- 测试执行
- 自修复
- 轻量安全审计
- 边界审计

### `repo-map-generator`

只作为局部深挖工具使用，不再作为项目启动的默认第一步。

### `Selene`

统一入口，负责：

- 规范化用户请求
- 分配 `run_id` 和 `task_id`
- 路由技能链
- 记录结构化执行历史
- 为后续分析与训练提供数据

## 设计原则

### 1. Spec 必须可执行

Spec 不是模糊的设计说明，而是下游技能可强制执行的任务契约。

### 2. 验证必须是必选项

没有验证和自审，就不算完成。

### 3. 修改边界必须明确

所有实现只能在 `target_files` 内进行；如果必须越界，任务必须中止并回到重新出 Spec。

### 4. 每次运行都要留痕

每次任务都应该留下结构化运行记录，用于：

- 分析失败原因
- 对比不同编辑器和不同 AI 的表现
- 构建评测和训练数据
- 优化提示词和路由策略

## 建议的运行账本结构

```text
.ai/
  project.md
  specs/
  selene/
    templates/
    runs/
      index.jsonl
      run-YYYYMMDD-001/
        request.json
        routing.json
        spec.md
        tasks.json
        events.jsonl
        verification.json
        result.json
```

## 当前阶段

这个仓库目前处于工作流定义阶段。

当前的核心方向是：

- 减少 Skill 数量
- 强化边界
- 使用机器可读 Spec
- 把验证内嵌到执行器
- 沉淀结构化运行数据
