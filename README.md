# Liberty Unquenched

**自由未烬**是一款以第二西班牙共和国为背景的政治与战争模拟游戏。玩家以 CNT-FAI 为主要视角，在 1931 年共和国建立后介入党派政治、工人运动、政府决策、军事动员和内战进程。

> This is an actively developed historical political simulation. The game is inspired by the Spanish Second Republic and the Spanish Civil War, but it is not intended to be a complete historical reconstruction or an academic source.

## 项目状态

项目目前处于持续开发阶段。当前版本已经包含政治模拟、事件与决策、顾问、议会席位图、经济与国内政策、行省地图、军队管理、战争总结、成就和结局等系统；部分历史内容、平衡性和系统之间的联动仍在完善。

项目不需要 Gemini API、后端服务或其他运行时密钥。游戏逻辑在浏览器中执行，当前版本也不依赖外部 API。

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

- 不需要 `GEMINI_API_KEY`。
- 不需要 `APP_URL`。
- 不需要数据库、服务器或 OAuth 配置。
- `.env.example` 仅用于说明当前不需要额外配置。

如果将来增加新的环境变量，应只提交变量名和说明，不要把真实密钥写入 `.env`、源码、构建产物或 Git 历史。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm ci` | 按锁文件安装依赖 |
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run lint` | 执行 TypeScript 类型检查；当前脚本名称虽为 lint，实际执行 `tsc --noEmit` |
| `npm run build` | 生成生产构建到 `dist/` |
| `npm run preview` | 预览已经生成的生产构建 |
| `npm run clean` | 跨平台删除 `dist/` |

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

## 目录结构

```text
.
├─ .github/
│  └─ workflows/
│     └─ deploy.yml          # GitHub Pages 自动部署
├─ public/
│  ├─ date/                  # 地图及地理数据
│  ├─ img/                   # 图片、肖像、图标和超级事件素材
│  └─ music/                 # 音乐素材
├─ src/
│  ├─ components/            # React 界面组件
│  ├─ game/                  # 游戏状态、党派、事件、行动和规则
│  │  ├─ action_affairs/     # 行动事务
│  │  ├─ advisors/           # 顾问
│  │  ├─ events/              # 历史事件和内战事件
│  │  ├─ government_affairs/ # 政府事务
│  │  ├─ journal/            # 长期日志
│  │  └─ military_affairs/   # 军事事务
│  ├─ lib/                   # D3 等底层可视化和通用工具
│  └─ map/                   # 行省地图、军队和战争系统
├─ index.html                # Vite HTML 入口
├─ package.json              # npm 脚本和依赖
├─ package-lock.json         # 锁定的依赖版本
├─ tsconfig.json             # TypeScript 配置
├─ vite.config.ts            # Vite 配置和 GitHub Pages 基础路径
└─ metadata.json             # 项目元数据
```

## 开发约定

### 新增事件、行动或政策

1. 将代码放入对应的 `src/game/` 子目录。
2. 在相应的 `index.ts` 或注册表中导出/注册。
3. 明确写出触发条件、消耗、冷却时间和效果。
4. 同时提供中文和英文文本（如果界面需要显示该内容）。
5. 检查对党派、派系、阶级、政府和地图状态的影响是否符合类型定义。
6. 运行 `npm run lint` 和 `npm run build`。

### 修改党派、选举或联盟

政治系统涉及多个相互关联的模块，修改时应同时检查：

- `src/game/types.ts`：类型和状态字段。
- `src/game/parties.ts`：党派支持和党派数据。
- `src/game/partyNames.ts`：党派显示名称。
- `src/game/coalitions.ts`：联盟定义。
- `src/game/utils/election.ts`：选举计算。
- `src/components/DomesticPoliticsModal.tsx`：政治界面。
- `src/components/ParliamentChart.tsx`：议会席位图。

### 修改地图或军事系统

地图状态和普通政治状态由不同的类型、组件和 reducer 逻辑管理。修改行省、部队或资源时，应检查：

- `src/map/types_map.ts`：地图状态类型。
- `src/map/map_constants.ts`：行省、邻接关系、阵营和初始军队。
- `src/map/ProvinceMap.tsx`：地图渲染。
- `src/map/MapView.tsx`：地图状态和操作分发。
- `src/map/Sidebar.tsx`：行省、部队和建筑控制面板。
- `src/map/WarSummary.tsx`：战争统计和总结。
- `src/map/lib/gameAi.ts`：地图 AI 行动。

## 已知限制与后续方向

当前版本仍有以下工程和内容层面的限制：

- 游戏数据和规则主要以 TypeScript 源码形式维护，尚未完全由独立数据文件或编辑器驱动。
- `editor/` 是独立的本地编辑器项目，目前不会随主游戏源码发布，也没有纳入主项目的构建流程。
- 当前没有发现基于 `localStorage` 或服务器的持久化存档系统；刷新页面不应被视为自动保存。
- 部分政治、选举、联盟、政府和内阁规则仍需继续统一数据模型和历史设定。
- 部分中文和英文文本仍需要持续校对，尤其是历史组织名称、职务名称和事件描述。
- 生产构建的主 JavaScript bundle 较大，后续可以通过代码分割和按需加载优化初始加载速度。
- 历史模拟包含必要的抽象、简化和游戏化设计；内容应继续通过可靠史料进行校对。

适合的后续工作包括：

- 让编辑器能够稳定输出主项目可直接导入的 TypeScript 或数据文件。
- 建立事件、行动、党派、联盟、政府和顾问的统一 schema。
- 增加自动化规则测试和历史日期/触发条件测试。
- 完善存档、回放和调试工具。
- 拆分大体积前端 bundle，并优化地图数据的加载。
- 为历史来源、图片、音乐和第三方素材建立清晰的归属与许可记录。

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

## 许可证与素材归属

本项目根目录的 [`LICENSE`](LICENSE) 使用 MIT License 作为项目代码的默认许可证。

但是，仓库中的图片、音乐、地图数据、历史资料和其他第三方素材不一定全部由项目作者拥有，也不一定自动继承 MIT License。重新分发或制作衍生作品前，应逐项确认素材来源、作者和许可证，并在需要时补充归属说明。

## 致谢

本项目使用 React、Vite、TypeScript、Tailwind CSS、D3、Recharts、Motion、Lucide React 和 Sonner 等开源工具构建。感谢这些项目及其贡献者提供的基础设施。
