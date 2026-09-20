# Liberty Unquenched

**自由未烬**是一款以第二西班牙共和国为背景的政治与战争模拟游戏。玩家以 CNT-FAI 为主要视角，在 1931 年共和国建立后介入党派政治、工人运动、政府决策、军事动员和内战进程。目前游戏包含25张卡牌、19位可选择的顾问、105个事件、19个成就、14类法律、6个任务日志、9个结局。

> This is an actively developed historical political simulation. The game is inspired by the Spanish Second Republic and the Spanish Civil War, but it is not intended to be a complete historical reconstruction or an academic source.

项目目前处于持续开发阶段。当前版本已经包含政治模拟、事件与决策、顾问、议会席位图、经济与国内政策、行省地图、军队管理、战争总结、成就和结局等系统；部分历史内容、平衡性和系统之间的联动仍在完善。

## 项目文档

- [游戏设计文档](docs/游戏设计文档.md)：游戏目标、核心机制、系统规则与后续可玩党派扩展。
- [当前架构说明](docs/ARCHITECTURE.md)：开发者和 AI 修改代码时的事实来源、模块导航、依赖边界与验证标准。
- [架构迁移计划](docs/ARCHITECTURE_MIGRATION_PLAN.md)：历史迁移方案、阶段状态与验收记录。

## 在线版本与分支关系

| 分支 | 用途 | 维护方式 |
| --- | --- | --- |
| `main` | 当前本地开发源码 | 本地编辑、检查后推送 |
| `aistudio-archive` | 从 Google AI Studio 迁移前的原始版本 | 归档，只用于对照和恢复 |
| `gh-pages` | Vite 生成的静态构建产物 | 由 GitHub Actions 自动更新，不应手工编辑 |

- GitHub 仓库：[WJNCT55555/Liberty-Unquenched](https://github.com/WJNCT55555/Liberty-Unquenched)
- 在线页面：[GitHub Pages](https://wjnct55555.github.io/Liberty-Unquenched/)
- 自动部署记录：[GitHub Actions](https://github.com/WJNCT55555/Liberty-Unquenched/actions)

向 `main` 推送后，`.github/workflows/deploy.yml` 会自动完成以下工作：安装 Node.js 依赖、运行 TypeScript 类型检查、生成生产构建，并将 `dist/` 发布到 `gh-pages`。

## 主要功能

### 政治与党派系统

- 第二共和国时期的党派、党派立场、支持度和议会席位模拟。
- 1931、1933 和 1936 年选举事件及选举结果计算。
- 共和国政治中的党派联盟、执政联盟和政府组成机制。
- 议会席位图，用于展示不同党派或联盟的席位分布。
- CNT-FAI 相关的政治行动、党内路线和组织关系。
- CNT-FAI 内部派系影响力与异议度，包括 Faistas、Treintistas、Cenetistas 和 Puristas 等路线。
- 阶级支持度系统，用于连接工人、农民、中产阶级、资产阶级、军队、教会等社会力量与政治行动。

### 行动、政府与政策

游戏中的行动按不同政治领域组织：

- **行动事务**：筹款、媒体宣传、组织建设、扩大工会、罢工、群众集会、国际联系、土地与自由、党派关系等。
- **政府事务**：农业政策、财政政策、外交政策、劳动事务、劳动权利、军事政策和总统弹劾等。
- **军事事务**：民兵组织、军事化、阿拉贡前线和军队建设等。
- **顾问系统**：从 CNT-FAI 相关人物中选择顾问，并使用顾问提供的行动和政治效果。
- **国内政治界面**：查看党派、联盟、议会、支持度、政府职位与政治条件。

大多数行动都有前置条件、行动点消耗、冷却时间、政治效果、派系影响和社会支持效果。修改行动时，需要同时检查条件、效果预览、双语文本和状态类型。

### 事件、日志与历史进程

事件系统覆盖共和国建立、宪法、教会冲突、土地问题、劳资关系、党派形成、选举、革命、政府危机以及内战等内容。

当前源码中已经包含以下类型的事件和日志：

- 第二共和国成立与 1931 年政治重组。
- 1931 年宪法、教会问题、电话工人罢工和地方冲突。
- CEDA、Falange、POUM、工人联盟等政治组织的形成。
- 1933 年和 1936 年选举。
- 阿斯图里亚斯革命及相关工人联盟事件。
- 内战爆发、加泰罗尼亚防御、阿拉贡委员会以及战争结局。
- 土地改革、地区问题、伊比利亚梦想、工人联盟和 UHP 等长期日志。

### 地图与战争系统

地图系统以行省和军队为核心，提供：

- 行省控制权、地区、文化、战略价值、工业权重和人力。
- 共和军、国民军、工人联盟以及其他地图阵营。
- 军队选择、移动、合并、拆分和解散。
- 步兵、炮兵和坦克编制。
- 人力、补给、工业产能、坦克储备、士气和军事化度。
- 行省建筑，包括兵营、要塞、防御工事、征兵办公室和军火工厂。
- 补给上限、战斗宽度、驻军、增援和动员。
- 战争总结面板，用于比较双方的战略、工业和军事能力。
- 针对阿斯图里亚斯战争和西班牙内战的不同地图状态。

### 用户界面与辅助功能

- 中文和英文双语界面。
- 事件板、超级事件、日志、结局画面和成就系统。
- 存档管理界面，支持手动存档、读档，以及进入游戏后的自动存档。
- 议会席位可视化。
- 音乐播放器。
- 沙盒菜单，用于开发和测试部分游戏状态。
- 响应式界面与动画效果。

## 技术栈

- React 19
- TypeScript 5.8
- Vite 6
- Tailwind CSS 4
- D3 7：议会席位图和地图相关可视化
- Recharts：数据图表
- Motion：界面动画
- Lucide React：图标
- Sonner：提示信息
- GitHub Actions + GitHub Pages：持续构建和静态部署

项目是客户端应用。虽然依赖中保留了一些通用工具包，但当前游戏不调用 Gemini、外部 AI 服务或项目专用后端。

## 本地开发

### 环境要求

- Node.js 20 或更高版本。GitHub Actions 当前使用 Node.js 20。
- npm，随 Node.js 一起安装。
- Git（如果需要从 GitHub 克隆或推送代码）。

### 安装

```bash
git clone https://github.com/WJNCT55555/Liberty-Unquenched.git
cd Liberty-Unquenched
npm ci
```

`npm ci` 会严格按照 `package-lock.json` 安装依赖。首次安装或依赖版本发生变化时，优先使用 `npm ci`，不要直接修改锁文件。

### 启动开发服务器

```bash
npm run dev
```

默认地址为：

```text
http://localhost:3000
```

开发服务器监听 `0.0.0.0`，因此也可以从同一局域网的其他设备访问本机开发服务。停止服务器可以在终端按 `Ctrl+C`。

### 环境变量

当前版本不需要任何环境变量或 API Key：
如果将来增加新的环境变量，应只提交变量名和说明，不要把真实密钥写入 `.env`、源码、构建产物或 Git 历史。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm ci` | 按锁文件安装依赖 |
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run lint` | 执行 `tsc --noEmit`，随后运行 `scripts/audit-coalition-authority.mjs` 联盟权限审计 |
| `npm run build` | 生成生产构建到 `dist/` |
| `npm run preview` | 预览已经生成的生产构建 |
| `npm run clean` | 跨平台删除 `dist/` |
| `npm run test:rules` | 规则层测试 |
| `npm run test:save-system` | 存档系统的写入、读取与恢复测试 |
| `npm run test:armament-income` | 军备月度收入测试 |
| `npm run test:union-share` | 工会占比计算测试 |
| `npm run test:effect-previews` | 行动事务效果预览文本测试 |

`test:*` 系列脚本通过 `tsx` 直接运行 `scripts/` 下的 TypeScript 测试文件，不需要额外构建步骤。

建议在提交前至少运行：

```bash
npm run lint
npm run build
```

## 生产构建与 GitHub Pages

本地手动构建：

```bash
npm run clean
npm run lint
npm run build
npm run preview
```

Vite 默认使用 `/Liberty-Unquenched/` 作为页面基础路径。部署工作流会通过 `VITE_BASE_PATH` 根据仓库名称动态设置基础路径，从而保证 GitHub Pages 下的脚本、样式和图片能够正确加载。

自动部署流程位于 [`/.github/workflows/deploy.yml`](.github/workflows/deploy.yml)，触发条件是向 `main` 推送。流程包括：

1. 检出 `main`。
2. 使用 Node.js 20。
3. 执行 `npm ci`。
4. 执行 `npm run lint`。
5. 设置 `VITE_BASE_PATH` 并执行 `npm run build`。
6. 将 `dist/` 发布到 `gh-pages`。

不要直接编辑 `gh-pages` 中的构建文件。需要修复线上页面时，应修改 `main` 中的源码并重新推送。

## 产品与内容限制

- 存档保存在浏览器 `localStorage`（键名 `cnt_fai_saves_v2`），只对当前浏览器与访问地址有效：无法跨设备同步，清除站点数据会一并删除存档。
- 部分中文和英文文本仍需要持续校对，尤其是历史组织名称、职务名称和事件描述。
- 历史模拟包含必要的抽象、简化和游戏化设计；内容应继续通过可靠史料进行校对。

工程架构限制、下一阶段工作和各类开发操作手册统一维护在[当前架构说明](docs/ARCHITECTURE.md)中，不在 README 重复维护。

## 安全与隐私

- 不要提交任何 API Key、密码、访问令牌、私钥或个人数据。
- 不要把真实环境变量写入 `.env.example`；示例文件只能包含占位符或说明。
- 提交前可以使用以下命令检查常见敏感信息：

```bash
rg -n -S "AIza|sk-|AKIA|BEGIN .*PRIVATE KEY|GEMINI_API_KEY" . \
  -g '!node_modules/**' \
  -g '!dist/**' \
  -g '!editor/**' \
  -g '!.agents/**'
```

如果密钥曾经被提交，即使后来删除，也应立即在对应服务商处撤销并重新生成，不能只依赖删除文件。

## 贡献流程

1. 从最新的 `main` 创建功能分支。
2. 只修改与任务相关的源码和资源。
3. 不提交 `editor/`、`.agents/`、`node_modules/`、`dist/` 或本地启动脚本。
4. 不提交任何真实密钥或本地配置。
5. 运行：

   ```bash
   npm run lint
   npm run build
   ```

6. 检查 `git status` 和 `git diff --check`。
7. 提交并通过审查后合并到 `main`，由 GitHub Actions 自动发布。

涉及状态、规则、事件、注册表、地图或存档的变更，还应按[架构验证矩阵](docs/ARCHITECTURE.md#verification)运行对应领域测试。

## 许可证与素材归属

本项目根目录的 [`LICENSE`](LICENSE) 使用 MIT License 作为项目代码的默认许可证。

但是，仓库中的图片、音乐、地图数据、历史资料和其他第三方素材不一定全部由项目作者拥有，也不一定自动继承 MIT License。重新分发或制作衍生作品前，应逐项确认素材来源、作者和许可证，并在需要时补充归属说明。

## 致谢

本项目使用 React、Vite、TypeScript、Tailwind CSS、D3、Recharts、Motion、Lucide React 和 Sonner 等开源工具构建。感谢这些项目及其贡献者提供的基础设施。
