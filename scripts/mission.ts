import { MISSIONS, findMission } from './missions';
import { runMission } from './mission/engine';
import { formatMissionReport, toMissionJson } from './mission/report';
import type { MissionSpec } from './mission/types';

/**
 * Mission Runner 的命令行入口。
 *
 *   npm run mission -- --list
 *   npm run mission -- --id collectivize-1936
 *   npm run mission -- --all
 *   npm run mission -- --id collectivize-1936 --json
 *   npm run mission -- --id collectivize-1936 --months 60 --policy beam --width 3
 *
 * 退出码：全部符合 `expect` 为 0，否则 1 —— 因此它可以直接接进 CI。
 */

interface CliOptions {
  ids: string[];
  all: boolean;
  list: boolean;
  json: boolean;
  months?: number;
  policy?: 'script' | 'greedy' | 'beam';
  width?: number;
  traceTail?: number;
  quiet: boolean;
}

const parseArgs = (argv: string[]): CliOptions => {
  const options: CliOptions = { ids: [], all: false, list: false, json: false, quiet: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--all': options.all = true; break;
      case '--list': options.list = true; break;
      case '--json': options.json = true; break;
      case '--quiet': options.quiet = true; break;
      case '--id': options.ids.push(argv[++i]); break;
      case '--months': options.months = Number(argv[++i]); break;
      case '--policy': options.policy = argv[++i] as CliOptions['policy']; break;
      case '--width': options.width = Number(argv[++i]); break;
      case '--trace': options.traceTail = Number(argv[++i]); break;
      default:
        if (arg.startsWith('--id=')) options.ids.push(arg.slice(5));
        break;
    }
  }
  return options;
};

/** 命令行覆盖（改预算/策略时不必改任务文件）。 */
const withOverrides = (spec: MissionSpec, options: CliOptions): MissionSpec => {
  const next: MissionSpec = { ...spec };
  if (options.months !== undefined && Number.isFinite(options.months)) next.months = options.months;
  if (options.policy === 'greedy') next.policy = { kind: 'greedy' };
  if (options.policy === 'beam') next.policy = { kind: 'beam', width: options.width ?? 3 };
  if (options.policy === 'script' && spec.policy.kind !== 'script') {
    // 没有固定路线时把 greedy 的结果当路线是做不到的；保留原策略并提示。
    console.warn(`[mission] ${spec.id}: --policy script 需要任务自带 steps，已忽略该覆盖`);
  }
  return next;
};

const matchesExpectation = (verdict: string, expect: MissionSpec['expect']): boolean => {
  const target = expect ?? 'pass';
  if (target === 'any') return verdict === 'passed' || verdict === 'timeout';
  if (target === 'pass') return verdict === 'passed';
  return verdict === 'unreachable';
};

export const main = (argv = process.argv.slice(2)): number => {
  const options = parseArgs(argv);

  if (options.list || (!options.all && options.ids.length === 0)) {
    console.log('可用任务：');
    MISSIONS.forEach((mission) => {
      console.log(`  ${mission.id.padEnd(28)} ${mission.titleZh}  [expect=${mission.expect ?? 'pass'}, ${mission.scenario}·${mission.difficulty}, ${mission.months} 月]`);
    });
    console.log('\n用法：npm run mission -- --id <任务id> [--months N] [--policy greedy|beam] [--width N] [--json]');
    return 0;
  }

  const specs = options.all
    ? MISSIONS
    : options.ids.map((id) => {
      const found = findMission(id);
      if (!found) throw new Error(`未知任务：${id}（用 --list 看全部）`);
      return found;
    });

  let failures = 0;
  const jsonResults: unknown[] = [];
  specs.forEach((spec) => {
    const mission = withOverrides(spec, options);
    const result = runMission(mission);
    const ok = matchesExpectation(result.verdict, mission.expect);
    if (!ok) failures++;
    if (options.json) {
      jsonResults.push(toMissionJson(result));
    } else if (!options.quiet || !ok) {
      console.log(formatMissionReport(result, { traceTail: options.traceTail }));
      console.log(`  → CI 期望 ${mission.expect ?? 'pass'}：${ok ? '符合' : '不符合'}`);
    } else {
      console.log(`${result.verdict === 'passed' ? 'PASS' : result.verdict.toUpperCase()}  ${mission.id}  ${result.monthsUsed} 月 / ${result.actionsUsed} 行动`);
    }
  });

  if (options.json) console.log(JSON.stringify(jsonResults, null, 2));
  if (specs.length > 1) {
    console.log(`\n任务总计 ${specs.length} 条，不符合期望 ${failures} 条。`);
  }
  return failures === 0 ? 0 : 1;
};

const isDirectRun = process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/mission.ts');
if (isDirectRun) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
