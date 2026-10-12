import type { MissionResult } from './types';

/**
 * 任务报告：文本（人读）与 JSON（CI/工具读）两种。
 *
 * 报告的重点不是"通过/失败"，而是**差在哪**：超时的时候打印每一项的缺口读数，
 * 结构性不可达的时候打印证据（哪一条规则让两个目标互斥）。
 */

const VERDICT_LABEL: Record<MissionResult['verdict'], [string, string]> = {
  passed: ['PASSED', '达成'],
  timeout: ['TIMEOUT', '超时（未达成）'],
  unreachable: ['UNREACHABLE', '结构性不可达'],
  error: ['ERROR', '脚本出错'],
};

export const formatMissionReport = (result: MissionResult, options: { traceTail?: number } = {}): string => {
  const { spec } = result;
  const [en, zh] = VERDICT_LABEL[result.verdict];
  const lines: string[] = [];
  lines.push('='.repeat(92));
  lines.push(`任务 ${spec.id} — ${spec.titleZh} / ${spec.title}`);
  lines.push(`  开局 ${spec.scenario}·${spec.difficulty} seed=${spec.seed} 预算=${spec.months} 月 策略=${describePolicy(spec.policy)}`);
  lines.push(`  结果 ${zh} (${en})  用时 ${result.monthsUsed} 月 / ${result.actionsUsed} 次行动`);

  lines.push('  目标：');
  result.goals.forEach((gap) => {
    lines.push(`    ${gap.satisfied ? '[x]' : '[ ]'} ${gap.goal.kind}:${gap.goal.id}`);
    gap.lines.forEach((line) => lines.push(`         ${line.labelZh}: ${line.value}`));
  });

  if (result.milestones?.length) {
    const done = result.milestones.filter(gap => gap.satisfied).length;
    lines.push(`  里程碑（只引导搜索，${done}/${result.milestones.length}）：`);
    result.milestones.forEach((gap) => {
      lines.push(`    ${gap.satisfied ? '[x]' : '[ ]'} ${gap.goal.labelZh ?? gap.goal.id}${gap.goal.kind === 'counter' ? ` >= ${gap.goal.atLeast}` : ''}`);
    });
  }

  if (result.proof) {
    lines.push('  不可达证据：');
    lines.push(`    ${result.proof}`);
  }
  if (result.error) {
    lines.push('  错误：');
    result.error.split('\n').forEach(line => lines.push(`    ${line}`));
  }

  const tail = options.traceTail ?? 12;
  if (result.trace.length) {
    lines.push(`  行动轨迹（最近 ${Math.min(tail, result.trace.length)} / 共 ${result.trace.length} 步）：`);
    result.trace.slice(-tail).forEach((entry) => {
      lines.push(`    ${entry.month}  ${entry.action}${entry.detail ? `  ${entry.detail}` : ''}  score=${entry.score}`);
    });
  }
  return lines.join('\n');
};

export const describePolicy = (policy: MissionResult['spec']['policy']): string => {
  switch (policy.kind) {
    case 'script': return `script(${policy.steps.length} 步)`;
    case 'greedy': return 'greedy(一步前瞻)';
    case 'beam': return `beam(width=${policy.width})`;
    default: return 'unknown';
  }
};

export const toMissionJson = (result: MissionResult) => ({
  id: result.spec.id,
  verdict: result.verdict,
  scenario: result.spec.scenario,
  difficulty: result.spec.difficulty,
  seed: result.spec.seed,
  monthsUsed: result.monthsUsed,
  actionsUsed: result.actionsUsed,
  proof: result.proof,
  error: result.error,
  goals: result.goals.map(gap => ({
    goal: `${gap.goal.kind}:${gap.goal.id}`,
    satisfied: gap.satisfied,
    gaps: gap.lines.map(line => ({ label: line.label, value: line.value })),
  })),
  trace: result.trace,
});
