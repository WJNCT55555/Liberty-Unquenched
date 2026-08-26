/**
 * sim.mjs — 无 AI 的纯逻辑推演器（构建 + 运行一体）
 *
 * 原理：
 *  1. 用 esbuild（node_modules 自带）打包 tools/driver.ts；
 *  2. 打包时通过 onLoad 插件在【内存中】给 src/game/GameContext.tsx 追加
 *     `export const gameReducer`（磁盘源码零改动）；
 *  3. 运行产物（node 进程内），driver 用真实 reducer 逐回合结算。
 *
 * 用法：
 *  node tools/sim.mjs [peace|asturias|civilwar|all] [easy|normal|hard]
 *
 * 不依赖任何 AI / LLM / 浏览器视觉，也不修改任何现有源码。
 */
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const OUT = path.join(root, '.sim-bundle.mjs');

const injectExportPlugin = {
  name: 'inject-reducer-export',
  setup(build) {
    build.onLoad({ filter: /[\\/]GameContext\.tsx$/ }, async (args) => {
      let src = fs.readFileSync(args.path, 'utf8');
      const needle = 'const gameReducer = ';
      if (!src.includes(needle)) {
        throw new Error(`[sim] 未能在 ${args.path} 中找到 "${needle}"，插件注入失败（源码可能已变化）`);
      }
      src = src.replace(needle, 'export const gameReducer = ');
      return { contents: src, loader: 'tsx' };
    });
  },
};

const route = process.argv[2] ?? 'all';
const difficulty = process.argv[3] ?? 'normal';

try {
  await build({
    entryPoints: [path.join(root, 'driver.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    outfile: OUT,
    plugins: [injectExportPlugin],
    logLevel: 'warning',
  });
} catch (e) {
  console.error('[sim] 构建失败:', e.message ?? e);
  process.exit(1);
}

try {
  // 传入同一进程的 argv，driver 直接读取 process.argv
  process.argv = [process.argv[0], OUT, route, difficulty];
  await import(pathToFileURL(OUT).href + `?t=${Date.now()}`);
} finally {
  try { fs.unlinkSync(OUT); } catch { /* ignore */ }
}
