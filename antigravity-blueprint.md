# AntiGravity — AI 自动化开发引擎完整方案

> 从 Skills 插件进化为独立的、语言无关的、闭环自治的 AI 开发系统

---

## 一、产品定位与竞品对标

```
┌─────────────────────────────────────────────────────────────────┐
│                        竞品光谱                                  │
│                                                                  │
│  补全级          编排级            自治级           全自主级       │
│  ─────          ─────            ─────           ────────       │
│  Copilot        Aider            Devin            ?             │
│  Codeium        Cursor Agent     OpenHands                      │
│  TabNine        Continue         SWE-Agent                      │
│                 Cline            Factory                        │
│                                                                  │
│            ▲ 当前在这里      ▲ 要去这里                          │
│            (Skills编排)      (闭环自治引擎)                       │
└─────────────────────────────────────────────────────────────────┘
```

**差异化定位：**

现有开源方案（Aider、SWE-Agent、OpenHands）都是"单 Agent + 工具调用"模式，AntiGravity 的体系天然是**多 Agent 流水线**（MetaGPT 路线），这是核心优势。做成一个**可插拔的多 Agent Pipeline CLI**，用户可以自定义 Agent 角色、编排顺序、检查规则。

**一句话定义：** *A multi-agent pipeline engine that turns natural language requirements into tested, reviewed, production-ready code — for any language, any project.*

---

## 二、六大痛点 vs 现有技能覆盖分析

| 痛点 | repo-map-generator | system-architect | task-coder | code-reviewer | 覆盖度 |
|------|:--:|:--:|:--:|:--:|:--:|
| 1. 上下文碎片化/幻觉 | **强** — AST 骨架替代全文读取 | 中 — 依赖地图做设计 | 弱 | 弱 | **40%** |
| 2. 雪崩式技术债 | — | 中 — 锁定修改边界 | 中 — 零魔法值/纯英文注释 | **强** — diff_linter 拦截 | **50%** |
| 3. 架构把控力为零 | 中 — 提供拓扑感知 | **强** — 强制先设计后编码 | 中 — 禁止改清单外文件 | 弱 | **55%** |
| 4. 工具链笨拙 | 弱 | — | — | — | **5%** |
| 5. 盲目自信/调试深渊 | — | — | 弱 — 无测试强制 | 中 — 只做静态检查 | **15%** |
| 6. 开发者技能退化 | — | — | — | — | **0%** |

**关键缺口：**
- 没有测试环节 = 流水线是"开环"的
- ast_extractor.js 只覆盖 TS/JS，不支持多语言
- diff_linter.js 只有 3 条规则，属于玩具级
- 没有"项目探测/自适应"环节
- 编码技能只有魔法值和英文注释，没有接入项目级 lint 工具

---

## 三、编码规范问题解决方案

### A. 静态规范层（机器可执行的）— 交给 code-reviewer

不重新发明轮子，让 `code-reviewer` 自动调用项目已有的 lint 工具：

| 语言 | 规范工具 | 说明 |
|---|---|---|
| Java | Alibaba P3C (PMD ruleset) / Checkstyle / SpotBugs | 阿里巴巴规范有现成的 PMD 规则集，直接 `mvn pmd:check` |
| Go | golangci-lint (含 golint/govet/staticcheck) | `golangci-lint run --new-from-rev HEAD~1` 只检查改动 |
| TS/JS | ESLint + Prettier | 项目级 `.eslintrc` 已经定义了规范 |
| Python | Ruff / Pylint + Black | Ruff 速度极快，覆盖 PEP8 + 常见反模式 |
| Rust | clippy | `cargo clippy -- -D warnings` |
| C# | dotnet format + Roslyn analyzers | `dotnet format --verify-no-changes` |

**核心思路：不在 Skill prompt 里写规范条文，而是让 AI 读项目的 lint 配置并执行 lint 命令，用工具输出当判官。**

### B. 架构/风格规范层（机器难以穷举的）— 交给 system-architect

提取成 `coding-conventions.md` 放在项目根目录：
- `system-architect` 在设计阶段**强制读取**
- `task-coder` 执行时对照契约
- `code-reviewer` 验收时也对照

---

## 四、顶层架构

```
                         ┌──────────────────┐
                         │   CLI / TUI      │  ← 用户入口（终端交互）
                         │   Web Dashboard  │  ← 可选的 Web UI
                         └────────┬─────────┘
                                  │
                         ┌────────▼─────────┐
                         │   Orchestrator   │  ← 总指挥：状态机 + 流水线调度
                         │   (Pipeline      │
                         │    Engine)        │
                         └────────┬─────────┘
                                  │
          ┌───────────┬───────────┼───────────┬───────────┬──────────┐
          ▼           ▼           ▼           ▼           ▼          ▼
    ┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌────────┐
    │ Project  ││ Repo Map ││ Architect││  Coder   ││  Test    ││Reviewer│
    │ Detector ││Generator ││          ││          ││ Runner   ││        │
    └──────────┘└──────────┘└──────────┘└──────────┘└──────────┘└────────┘
       Agent 0     Agent 1    Agent 2     Agent 3     Agent 4    Agent 5
          │           │           │           │           │          │
          └───────────┴───────────┴─────┬─────┴───────────┴──────────┘
                                        │
                              ┌─────────▼──────────┐
                              │   Shared Context    │  ← 持久化的项目记忆
                              │   (Memory Layer)    │
                              └─────────┬──────────┘
                                        │
                    ┌───────────────┬────┴────┬──────────────┐
                    ▼               ▼         ▼              ▼
              ┌──────────┐  ┌──────────┐ ┌────────┐  ┌───────────┐
              │ Vector   │  │ Project  │ │ Git    │  │ Tool      │
              │ Store    │  │ Config   │ │History │  │ Registry  │
              │(Chroma/  │  │(.ai/)    │ │        │  │(linters/  │
              │ Qdrant)  │  │          │ │        │  │ testers)  │
              └──────────┘  └──────────┘ └────────┘  └───────────┘
```

---

## 五、核心模块详细设计

### 模块 0：Project Detector（项目探测器）

```
职责：自动识别项目的语言、框架、工具链，输出标准化的项目元数据
触发：流水线启动时的第一个 Agent，或项目首次接入时执行一次并缓存

输入：项目根目录路径
输出：ProjectMeta JSON
```

**探测策略（按标志文件）：**

| 标志文件 | 语言 | 包管理器 | Lint 工具 |
|---|---|---|---|
| package.json | Node.js/TS | npm/yarn/pnpm | eslint/prettier |
| go.mod | Go | go mod | golangci-lint |
| pom.xml | Java/Maven | mvn | PMD/Checkstyle/SpotBugs |
| build.gradle(.kts) | Java/Gradle | gradle | 同上 |
| Cargo.toml | Rust | cargo | clippy |
| pyproject.toml | Python | pip/poetry/uv | ruff/pytest |
| requirements.txt | Python | pip | ruff/pytest |
| *.csproj / *.sln | C#/.NET | dotnet | dotnet test |
| CMakeLists.txt | C/C++ | cmake | clang-tidy/ctest |
| Gemfile | Ruby | bundler | rubocop/rspec |
| pubspec.yaml | Dart/Flutter | pub | dart analyze |

**额外探测：**
- `.eslintrc*` / `.prettierrc` → 已有 lint/format 配置
- `.github/workflows/` → 已有 CI，可提取测试命令
- `Dockerfile` / `docker-compose` → 容器化部署
- `.env` / `.env.example` → 环境变量清单
- `coding-conventions.md` / `.ai/conventions.md` → 项目级编码规范

**输出 Schema：**

```json
{
  "project_name": "license-manager",
  "languages": [
    { "name": "go", "version": "1.21", "source_dirs": ["backend/"] },
    { "name": "typescript", "version": "5.x", "source_dirs": ["frontend/src/"] }
  ],
  "frameworks": ["gin", "vue3", "element-plus"],
  "package_managers": ["go mod", "pnpm"],
  "lint_commands": {
    "go": "cd backend && golangci-lint run --new-from-rev HEAD~1",
    "typescript": "cd frontend && npx eslint {files} --format json"
  },
  "test_commands": {
    "go": "cd backend && go test ./... -v -json",
    "typescript": "cd frontend && npx vitest run --reporter=json"
  },
  "format_commands": {
    "go": "gofmt -w {files}",
    "typescript": "cd frontend && npx prettier --write {files}"
  },
  "conventions_file": ".ai/conventions.md",
  "docker": { "has_compose": true, "services": ["backend", "frontend", "db"] },
  "ci": { "platform": "github-actions", "test_job": ".github/workflows/test.yml" }
}
```

### 模块 1：Repo Map Generator（仓库地图生成器）

```
职责：提取代码骨架（签名、类型、依赖关系），不读完整实现，省 Token 防幻觉
依赖：Project Detector 的输出（知道扫描什么语言）
```

**核心升级点（相比现有 ast_extractor.js）：**

1. **多语言签名提取**
   - 推荐方案：tree-sitter bindings（node-tree-sitter / py-tree-sitter）
   - 支持：tree-sitter-javascript / typescript / go / java / python / rust
   - 回退方案：正则（按语言分 regex 集合）

2. **提取内容**
   - 文件级：exports、imports、顶层声明
   - 类级：类名、继承关系、公开方法签名
   - 函数级：函数名、参数类型、返回类型
   - 接口/类型级：interface、type、struct 定义
   - 路由级：HTTP 路由定义（gin.GET/router.get 等）
   - Schema级：数据库 model/migration 定义

3. **依赖图**
   - 输出模块间的 import 关系（有向图）
   - 标记循环依赖
   - 标记跨层调用（如 handler 直接 import repository）

4. **输出格式**
   - Markdown（人类可读）
   - JSON（结构化，供其他 Agent 消费）
   - Mermaid 图（可选，可视化架构）

5. **增量模式**
   - 首次全量扫描，生成 `.ai/repo-map.json` 缓存
   - 后续只扫描 git diff 涉及的文件，增量更新

### 模块 2：System Architect（系统架构师）

```
职责：分析需求 + 地图 + 规范 → 输出技术设计契约和文件修改清单
性质：纯 LLM 推理，不执行代码
```

**输入：**
- 用户需求（自然语言）
- Repo Map（来自 Agent 1）
- Project Meta（来自 Agent 0）
- coding-conventions.md（如果存在）
- 历史设计文档（来自 Memory Layer）

**强制行为：**
1. 读取 conventions 文件，提取硬约束
2. 分析需求涉及的模块边界（基于 Repo Map 的依赖图）
3. 评估变更的波及面（哪些文件会受影响）
4. 输出标准化的设计契约文档

**输出 Schema（design-contract.json）：**

```json
{
  "requirement_summary": "...",
  "affected_modules": ["backend/internal/service/", "frontend/src/views/"],
  "change_plan": [
    {
      "file": "backend/internal/service/invoice.go",
      "action": "modify",
      "description": "Add batch export method",
      "interface_contract": "func (s *InvoiceService) BatchExport(ids []int64) ([]byte, error)"
    },
    {
      "file": "backend/internal/api/invoice_handler.go",
      "action": "modify",
      "description": "Add POST /api/invoices/batch-export endpoint"
    }
  ],
  "constraints": [
    "All errors must be wrapped with AppError",
    "New API endpoints must have swagger annotations",
    "Frontend API calls must use the unified request() wrapper"
  ],
  "risks": [
    "Batch export with >1000 records may cause OOM, need pagination"
  ],
  "test_requirements": [
    "Unit test for BatchExport with empty/normal/large inputs",
    "API integration test for the new endpoint"
  ]
}
```

**关键防护：**
- 如果变更文件 > 8 个，强制要求拆分为多个子任务
- 如果涉及数据库 schema 变更，必须标记为高风险
- 如果检测到跨层依赖违规，拒绝该方案并给出替代方案

### 模块 3：Task Coder（任务编码器）

```
职责：严格按照设计契约执行代码编写
性质：LLM 推理 + 文件修改工具
```

**硬约束（写入 System Prompt）：**
1. 只能修改 change_plan 中列出的文件
2. 必须遵守 constraints 中的所有约束
3. 必须遵守 conventions 文件中的规范
4. 禁止引入设计契约未提及的第三方依赖
5. 新增代码必须有英文注释（函数级 doc + 关键逻辑行内注释）
6. 不得使用魔法值（数字/字符串字面量用常量替代）
7. 不得留下 TODO/FIXME（除非设计契约中明确标注为后续任务）

**编码完成后的自检清单（Self-Check）：**
- □ 所有 constraints 是否满足
- □ 新增函数是否有签名注释
- □ 是否存在硬编码的 URL/IP/端口/密钥
- □ 是否有未处理的错误（Go: 忽略 err, JS: 空 catch）
- □ import 是否有未使用的包
- □ 是否修改了计划外的文件

### 模块 4：Test Runner（测试执行者）— 新增

```
职责：自动发现并运行测试，解析结果，失败时驱动修复循环
性质：工具执行 + LLM 分析
```

**工作流：**
1. 从 ProjectMeta 获取 test_commands
2. 识别本次变更涉及的测试文件：
   - 同名测试文件（invoice.go → invoice_test.go）
   - import 了被修改包的测试文件
   - 设计契约中指定的测试
3. 执行测试命令（优先只跑涉及的测试，加速反馈）
4. 解析测试输出（支持多种格式）：
   - Go: `go test -json` 输出
   - JS/TS: `vitest/jest --reporter=json`
   - Java: surefire-reports XML
   - Python: `pytest --tb=short --json-report`
5. 结果处理：
   - 全通过 → 输出 PASS，流转到 Agent 5
   - 有失败 → 提取失败信息，构造修复指令，回传给 Coder（最多 3 轮）
6. 熔断：同一测试失败 3 轮 → BLOCKED，输出诊断报告，请求人类介入

**测试覆盖率追踪（可选增强）：**
- 记录变更前后的覆盖率差值
- 新增代码的覆盖率低于 60% 时告警

### 模块 5：Code Reviewer（代码审查员）— 增强

```
职责：流水线最后一道门，综合静态分析 + AI 审查
性质：工具执行 + LLM 审查
```

**三层审查：**

**Layer 1 — 工具审查（确定性的，零幻觉）：**
- 根据 ProjectMeta.lint_commands 执行项目 linter（只检查 diff 文件）
- 自有通用规则（语言无关）：
  - 魔法值检测（数字字面量 > 1 出现在非 const 定义中）
  - 硬编码敏感信息（密码、API Key 正则匹配）
  - debug 语句残留（console.log/fmt.Println/print()/System.out）
  - 函数体过长（> 80 行告警, > 150 行拒绝）
  - 文件过长（> 500 行告警）
  - 新增第三方 import 告警

**Layer 2 — 契约合规审查（LLM）：**
- 将 diff + design-contract.json 交给 LLM 检验：
  - 实现是否完整覆盖了 change_plan 的每一项
  - constraints 是否全部满足
  - 是否存在"偷偷"修改了计划外文件

**Layer 3 — 架构守卫（可选，高级功能）：**
- 基于 Repo Map 的依赖图，检查新代码是否引入了：
  - 循环依赖
  - 跨层调用违规
  - 新的 god class/god function

**输出：**
- APPROVED → 自动生成 Conventional Commit message，等待人类确认
- REJECTED → 输出 violations 列表 + 修复建议，回传 Coder

---

## 六、Orchestrator（总指挥）设计

### 状态转移图

```
  INIT ──→ DETECTING ──→ MAPPING ──→ DESIGNING ──→ CODING
                                                      │
  DONE ←── APPROVED ←── REVIEWING ←── TESTING ←──────┘
    │                       │            │              │
    │                    REJECTED     FAILED          BLOCKED
    │                       │            │              │
    │                       └──→ CODING ←┘        HUMAN_NEEDED
    │
    └──→ COMMIT (等待人类确认) ──→ COMMITTED
```

### 重试策略
- CODING → TESTING → FAILED → CODING：最多 3 轮
- CODING → REVIEWING → REJECTED → CODING：最多 2 轮
- 超过重试上限 → BLOCKED → 通知人类

### 人类干预点（Human-in-the-Loop）

**🔴 强制干预（必须等人类确认）：**
- 设计方案确认（DESIGNING → CODING 之前）
- 最终提交确认（APPROVED → COMMITTED 之前）
- 熔断恢复（BLOCKED → 任何状态）

**🟡 可选干预（默认自动，可配置为需确认）：**
- 修复循环中的策略变更
- 新增第三方依赖
- 数据库 schema 变更

### 配置文件（.ai/pipeline.yaml）

```yaml
pipeline:
  agents:
    - name: project-detector
      enabled: true
      cache: true           # 探测结果缓存，不每次都跑
      cache_ttl: 24h
    - name: repo-map
      enabled: true
      scope: "changed"      # 只扫描变更相关的模块
    - name: architect
      enabled: true
      require_approval: true # 设计方案需人类确认
    - name: coder
      max_files_per_run: 8
    - name: test-runner
      enabled: true
      max_retries: 3
      timeout: 300s
    - name: reviewer
      enabled: true
      max_retries: 2

  llm:
    provider: "openai"        # openai / anthropic / local
    model: "gpt-4o"
    architect_model: "claude-sonnet"  # 不同角色可用不同模型
    coder_model: "claude-sonnet"
    reviewer_model: "gpt-4o"
    temperature: 0.1

  memory:
    backend: "file"           # file / chroma / qdrant
    iteration_log: ".ai/iteration-log.md"
    project_context: ".ai/project-context.md"
```

---

## 七、Memory Layer（记忆层）设计

### 三级记忆架构

**L1 — 工作记忆 (Working Memory)：** 当前任务的上下文
- design-contract.json（当前设计契约）
- change-diff（当前已做的修改）
- test-results（当前测试结果）
- review-feedback（当前审查反馈）
- 生命周期：单次 Pipeline 运行, 任务完成后归档

**L2 — 项目记忆 (Project Memory)：** 持久化的项目知识
- project-context.md（架构概览、技术决策、当前状态）
- iteration-log.md（历史子任务记录，含失败经验）
- conventions.md（编码规范）
- repo-map.json（缓存的代码骨架）
- 生命周期：跨任务持久, 每次任务后更新
- 存储：项目目录 .ai/ 下的文件（纳入 git）

**L3 — 全局记忆 (Global Memory)：** 跨项目的通用知识
- 失败模式库（什么类型的需求 + 什么错误 → 应该怎么避免）
- 风格样本库（各语言/框架的惯用写法模板）
- 工具知识库（各 linter/test 框架的配置技巧）
- 生命周期：永久, 越用越智能
- 存储：向量数据库（ChromaDB 本地 / Qdrant 远程）

### 记忆读取协议（防遗忘机制）

每个 Agent 启动时必须执行：
1. 读取 L1 获取当前任务上下文
2. 读取 L2 的 project-context.md 恢复项目感知
3. 对于 Coder/Reviewer，额外读取 iteration-log.md 中最近 3 条记录
4. 如果当前需求与历史失败模式匹配，从 L3 检索负样本注入 prompt

---

## 八、技术选型建议

### 路线 A：Node.js/TypeScript（推荐）

| 组件 | 选型 | 说明 |
|---|---|---|
| Runtime | Node.js 20+ | |
| CLI Framework | Commander.js + Inquirer.js | 交互式终端 |
| LLM SDK | Vercel AI SDK | 统一封装 OpenAI/Anthropic/Ollama |
| AST | tree-sitter (node-tree-sitter) | 多语言精确提取 |
| Git | simple-git | |
| Vector DB | ChromaDB (chroma-js) | 或本地 JSON 文件起步 |
| TUI | Ink (React for CLI) | 漂亮的终端 UI（可选） |
| Config | cosmiconfig | 自动发现 .ai/ 配置 |
| Test | Vitest | |
| Build | tsup | 打包成单 binary 可用 pkg |

### 路线 B：Python（备选）

| 组件 | 选型 | 说明 |
|---|---|---|
| Runtime | Python 3.11+ | |
| CLI | Typer + Rich | 漂亮的终端输出 |
| LLM | LiteLLM | 统一封装 100+ 模型 |
| AST | tree-sitter (py-tree-sitter) | |
| Git | GitPython | |
| Vector DB | ChromaDB | 原生 Python |
| Config | Pydantic Settings | |
| Test | Pytest | |
| Build | PyInstaller / shiv | |

**建议选路线 A：**
1. 现有 ast_extractor 和 diff_linter 已经是 JS
2. TS 类型系统对多 Agent 消息传递的类型安全性更好
3. node-tree-sitter 很成熟
4. 发布为 npx 命令，用户零安装成本（`npx antigravity init`）

---

## 九、项目结构

```
antigravity/
├── package.json
├── tsconfig.json
├── README.md
├── LICENSE                        (MIT)
│
├── bin/
│   └── antigravity.ts             CLI 入口
│
├── src/
│   ├── index.ts                   主导出
│   │
│   ├── orchestrator/              总指挥
│   │   ├── pipeline.ts            流水线引擎（状态机）
│   │   ├── state-machine.ts       状态定义与转移
│   │   ├── retry-policy.ts        重试 + 熔断逻辑
│   │   └── human-gate.ts          人类干预点管理
│   │
│   ├── agents/                    各 Agent 实现
│   │   ├── base-agent.ts          Agent 基类（统一接口）
│   │   ├── project-detector/
│   │   │   ├── index.ts
│   │   │   └── detectors/         各语言探测器
│   │   │       ├── node.ts
│   │   │       ├── go.ts
│   │   │       ├── java.ts
│   │   │       ├── python.ts
│   │   │       └── rust.ts
│   │   ├── repo-mapper/
│   │   │   ├── index.ts
│   │   │   ├── extractors/        各语言 AST 提取
│   │   │   │   ├── tree-sitter-extractor.ts
│   │   │   │   └── regex-fallback.ts
│   │   │   └── dependency-graph.ts
│   │   ├── architect/
│   │   │   ├── index.ts
│   │   │   ├── prompts/           System Prompt 模板
│   │   │   └── contract-schema.ts 设计契约 Zod Schema
│   │   ├── coder/
│   │   │   ├── index.ts
│   │   │   ├── prompts/
│   │   │   ├── self-check.ts      编码后自检
│   │   │   └── file-editor.ts     文件修改工具
│   │   ├── test-runner/
│   │   │   ├── index.ts
│   │   │   ├── parsers/           测试输出解析器
│   │   │   │   ├── go-test.ts
│   │   │   │   ├── vitest.ts
│   │   │   │   ├── jest.ts
│   │   │   │   ├── pytest.ts
│   │   │   │   └── junit.ts
│   │   │   └── failure-analyzer.ts
│   │   └── reviewer/
│   │       ├── index.ts
│   │       ├── linters/           各语言 lint 调用器
│   │       ├── rules/             自有通用规则
│   │       │   ├── magic-numbers.ts
│   │       │   ├── debug-statements.ts
│   │       │   ├── hardcoded-secrets.ts
│   │       │   └── function-length.ts
│   │       └── contract-checker.ts 契约合规检查
│   │
│   ├── memory/                    记忆层
│   │   ├── memory-manager.ts      统一记忆读写接口
│   │   ├── working-memory.ts      L1 工作记忆
│   │   ├── project-memory.ts      L2 项目记忆
│   │   ├── global-memory.ts       L3 全局记忆
│   │   └── backends/
│   │       ├── file-backend.ts    文件存储（默认）
│   │       └── vector-backend.ts  向量数据库存储
│   │
│   ├── llm/                       LLM 抽象层
│   │   ├── provider.ts            统一接口
│   │   ├── openai.ts
│   │   ├── anthropic.ts
│   │   ├── ollama.ts              本地模型支持
│   │   └── cost-tracker.ts        Token 用量 + 费用追踪
│   │
│   ├── tools/                     工具集
│   │   ├── git.ts                 Git 操作封装
│   │   ├── file-system.ts         文件读写
│   │   ├── shell.ts               命令执行（带超时+沙盒）
│   │   └── diff.ts                Diff 解析
│   │
│   ├── config/                    配置管理
│   │   ├── schema.ts              配置 Schema（Zod）
│   │   ├── loader.ts              加载 .ai/pipeline.yaml
│   │   └── defaults.ts            默认配置
│   │
│   └── types/                     全局类型定义
│       ├── project-meta.ts
│       ├── repo-map.ts
│       ├── design-contract.ts
│       ├── test-result.ts
│       └── review-result.ts
│
├── templates/                     项目模板
│   ├── conventions/               各语言的 conventions 模板
│   │   ├── go.md
│   │   ├── typescript.md
│   │   ├── java.md
│   │   └── python.md
│   └── pipeline.yaml              默认 pipeline 配置模板
│
├── grammars/                      tree-sitter 语法文件
│   └── (vendored .wasm files)
│
└── tests/
    ├── unit/
    ├── integration/
    └── fixtures/                  测试用的模拟项目
        ├── go-project/
        ├── ts-project/
        └── java-project/
```

---

## 十、CLI 交互设计

```bash
# 初始化项目（生成 .ai/ 目录 + 配置）
$ npx antigravity init
  → 探测项目语言/框架
  → 生成 .ai/pipeline.yaml
  → 生成 .ai/conventions.md（可编辑）
  → 将 .ai/ 加入 .gitignore 建议

# 执行一个开发任务
$ npx antigravity run "实现发票批量导出功能，支持 PDF 和 Excel 格式"
  → [Agent 0] Detecting project... Go + TypeScript + Vue3
  → [Agent 1] Mapping repository... 142 signatures extracted
  → [Agent 2] Designing solution...

  ┌─────────────────────────────────────────────┐
  │ 📐 Design Contract                          │
  │                                              │
  │ Files to modify: 4                           │
  │  • backend/internal/service/invoice.go       │
  │  • backend/internal/api/invoice_handler.go   │
  │  • frontend/src/api/invoice.ts               │
  │  • frontend/src/views/Invoices/index.vue     │
  │                                              │
  │ Risks: Large batch may cause OOM             │
  │                                              │
  │ [✓ Approve]  [✎ Edit]  [✗ Reject]           │
  └─────────────────────────────────────────────┘

  → [Agent 3] Coding... 4/4 files modified
  → [Agent 4] Running tests...
     ✓ TestBatchExport_Empty (0.02s)
     ✓ TestBatchExport_Normal (0.15s)
     ✗ TestBatchExport_Large (timeout)
  → [Agent 3] Fixing... added pagination for large batches
  → [Agent 4] Re-running tests... 3/3 passed ✓
  → [Agent 5] Reviewing...
     Layer 1 (Lint): ✓ 0 violations
     Layer 2 (Contract): ✓ all items covered
     Layer 3 (Architecture): ✓ no dependency violations

  ┌─────────────────────────────────────────────┐
  │ ✅ All checks passed                        │
  │                                              │
  │ Commit message:                              │
  │ feat(invoice): add batch export with         │
  │ PDF and Excel support                        │
  │                                              │
  │ [✓ Commit]  [✎ Edit message]  [👁 View diff] │
  └─────────────────────────────────────────────┘

# 交互式模式（更细粒度的控制）
$ npx antigravity interactive

# 只跑某个 Agent（调试用）
$ npx antigravity detect          # 只跑项目探测
$ npx antigravity map             # 只跑仓库地图
$ npx antigravity test            # 只跑测试
$ npx antigravity review          # 只跑审查

# 查看历史
$ npx antigravity log             # 查看迭代日志
$ npx antigravity status          # 查看项目上下文
```

---

## 十一、开发路线图

### Phase 0 — 脚手架搭建（1-2 周）
- 初始化 TS 项目 + CLI 框架
- 定义所有 Agent 的接口（base-agent.ts + types/）
- 实现 LLM 抽象层（先支持 OpenAI + Anthropic）
- 实现配置加载器
- **可交付：`npx antigravity --version` 能跑**

### Phase 1 — 最小闭环（3-4 周）
- Project Detector（支持 Node/Go/Python 三种语言起步）
- Repo Mapper（正则方案，支持 TS + Go）
- Architect（核心 prompt + 契约 schema）
- Coder（文件编辑 + 自检）
- Test Runner（支持 vitest + go test）
- Reviewer（lint 调用 + 基础自有规则）
- Orchestrator（线性流水线，无重试）
- 文件级记忆（.ai/ 目录）
- **可交付：能跑通一个简单需求的完整流水线**

### Phase 2 — 健壮性（3-4 周）
- 重试 + 熔断机制
- Coder ↔ TestRunner 修复循环
- Coder ↔ Reviewer 修复循环
- 人类干预节点（设计审批 + 提交确认）
- 增量 Repo Map（git diff 驱动）
- 更多语言的 Detector/Lint/Test 支持
- Token 用量追踪 + 费用报告
- **可交付：能可靠处理中等复杂度需求**

### Phase 3 — 智能化（4-6 周）
- tree-sitter 替换正则（精确 AST）
- 依赖图 + 循环依赖检测
- 架构守卫（跨层调用检测）
- 向量记忆（ChromaDB 集成）
- 失败模式学习（从 iteration-log 提取负样本）
- 多模型策略（不同 Agent 用不同模型）
- 并行 Agent（architect 设计下一个时，test 验证上一个）
- **可交付：处理复杂多文件需求，有自我纠错能力**

### Phase 4 — 产品化（4-6 周）
- Web Dashboard（可视化流水线状态、历史记录）
- VS Code 扩展（集成到编辑器）
- Docker 化（一键部署）
- 文档站（Docusaurus/VitePress）
- 示例项目 + 教程视频
- npm publish + GitHub Release
- **可交付：可供外部用户使用的开源产品**

---

## 十二、与现有 Skills 的迁移策略

不需要从零开始，现有资产可以直接复用：

| 现有资产 | 迁入 AntiGravity 的位置 |
|---|---|
| ast_extractor.js | agents/repo-mapper/extractors/regex-fallback.ts |
| diff_linter.js | agents/reviewer/rules/（拆分为多个规则文件） |
| system-architect/SKILL.md | agents/architect/prompts/system.md |
| task-coder/SKILL.md | agents/coder/prompts/system.md |
| code-reviewer/SKILL.md | agents/reviewer/prompts/system.md |
| taskloop/SKILL.md | orchestrator/ 的状态机 + 记忆机制 |
| architecture-diagnosis-design | 可作为 `antigravity diagnose` 子命令 |

**迁移顺序：先搭框架 → 迁移 prompt → 迁移脚本 → 补充新能力**

---

## 十三、总结

**当前位置：** L2 辅助编排（分角色 prompt + 脚本守卫）

**核心优势：** 多 Agent 流水线架构，强制先设计后编码

**最大缺口：** 无测试环节（开环）、单语言（JS only）、lint 规则过少

**第一步：** 搭建独立 CLI 项目 + 实现 Project Detector + Test Runner

**到可用原型（L3）：** ~4-5 个月

**到开源产品（L4）：** ~12-18 个月
