---
name: task-coder
description: 按 Spec 白名单实现代码，并执行验证、自修复、自审和结果输出。
---

# Task Coder

## Responsibilities

- 读取 Spec
- 只在 `target_files` 内修改
- 实现代码
- 执行 `verification_plan`
- 失败后自修复
- 通过后自审
- 输出结构化结果
- 触发或提示 `project-context` UPDATE

## Inputs

- `.ai/project.md`
- 有效 Spec

有效 Spec 至少包含：

- `spec_id`
- `target_files`
- `verification_plan`
- `exit_criteria`

缺少任一字段，返回 `[BLOCKED:INVALID_SPEC]`。

## Scope Rules

- 只允许修改 `target_files`
- 禁止扩大任务范围
- 禁止顺手重构无关代码
- 必须越界修改时，返回 `[BLOCKED:OUT_OF_SCOPE]`

## Execution

顺序：

1. 解析 Spec
2. 实现代码
3. 执行验证
4. 自修复
5. 自审
6. 更新项目上下文
7. 输出结果

## Verification

按 `verification_plan` 执行，不得跳过。

建议顺序：

1. `lint`
2. `typecheck`
3. unit tests
4. integration tests
5. UI / E2E tests
6. MCP / tooling smoke tests

失败时：

- 收集错误
- 在原边界内修复
- 最多重试 3 次

超过 3 次，返回 `[BLOCKED:VERIFICATION_FAILED]`。

缺少工具或命令时：

- 标记为 `not_available`
- 写入结果

## Self Review

至少检查：

- 是否越界修改
- 是否引入硬编码 URL、IP、密钥
- 是否引入未声明依赖
- 是否偏离 Spec
- 是否遗漏必要测试
- 是否违背 `.ai/project.md`

## Result

至少输出：

- `spec_id`
- `status`
- `changed_files`
- `verification_summary`
- `retry_count`
- `human_handoff`

## Blocked

以下情况直接阻塞：

- Spec 无效
- 边界不清
- 任务要求与 `.ai/project.md` 冲突
- 验证计划缺失
- 需要人工决策
