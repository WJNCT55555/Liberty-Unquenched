import assert from 'node:assert/strict';
import { MISSIONS } from './missions';
import { runMission } from './mission/engine';
import { formatMissionReport } from './mission/report';
import { goalSatisfied } from './mission/goals';

/**
 * Mission Runner 的 CI 入口（`npm run test:missions`）。
 *
 * 这里不断言"某条路线一定在 N 月内完成"这种脆弱的数字，只断言每一条任务
 * **符合它自己声明的 expect**：
 *  - `pass`：目标真的达成了（成就/日志/结局的判定直接复用游戏里的那份）；
 *  - `unreachable`：拿到了**结构性**证据（日志 checkStatus 互相判死），而不是"没搜到"；
 *  - `any`：跑完不报错，并且至少推进过一个月。
 *
 * 除此之外还做两件"元测试"：
 *  1. 同一 seed 跑两次结果必须完全一致（随机源收口的价值就在这里）；
 *  2. 每条任务都必须有 expect 与可读的说明，避免有人加一条永远不检查的任务。
 */

let checks = 0;
const test = (name: string, fn: () => void) => {
  fn();
  checks++;
  console.log(`PASS ${name}`);
};

test('任务清单本身是自洽的', () => {
  assert(MISSIONS.length >= 5, `expected at least 5 missions, got ${MISSIONS.length}`);
  MISSIONS.forEach((mission) => {
    assert(mission.id && mission.titleZh, `${mission.id} must have an id and a Chinese title`);
    assert(mission.months > 0, `${mission.id} must declare a month budget`);
    assert(mission.goals.length > 0, `${mission.id} must declare at least one goal`);
    assert(mission.expect, `${mission.id} must declare its expectation for CI`);
    assert(mission.notesZh, `${mission.id} must explain itself in Chinese`);
  });
  assert.equal(new Set(MISSIONS.map(mission => mission.id)).size, MISSIONS.length, 'mission ids must be unique');
});

MISSIONS.forEach((mission) => {
  test(`任务 ${mission.id} 符合 expect=${mission.expect}`, () => {
    const result = runMission(mission);
    if (mission.expect === 'unreachable') {
      assert.equal(result.verdict, 'unreachable', `${mission.id} must prove structural unreachability`);
      assert(result.proof && result.proof.length > 0, `${mission.id} must carry the proof text`);
      return;
    }
    if (mission.expect === 'any') {
      assert(
        result.verdict === 'passed' || result.verdict === 'timeout',
        `${mission.id} must at least run without error (got ${result.verdict}${result.error ? `: ${result.error.split('\n')[0]}` : ''})`,
      );
      assert(result.monthsUsed >= 1, `${mission.id} must have advanced at least one month`);
      return;
    }
    if (result.verdict !== 'passed') {
      // 失败时把缺口报告打出来，CI 日志里能直接看到差在哪。
      console.log(formatMissionReport(result, { traceTail: 6 }));
    }
    assert.equal(result.verdict, 'passed', `${mission.id} must reach its goals`);
    mission.goals.forEach((goal) => {
      assert(goalSatisfied(goal, result.finalState!), `${mission.id}: goal ${goal.kind}:${goal.id} must be satisfied`);
    });
  });
});

test('同一 seed 两次运行完全一致（随机源可注入）', () => {
  const mission = MISSIONS.find(candidate => candidate.id === 'collectivize-1936');
  assert(mission, 'the collectivization mission must exist');
  const first = runMission(mission!);
  const second = runMission(mission!);
  assert.equal(first.verdict, second.verdict, 'verdict must be reproducible');
  assert.equal(first.monthsUsed, second.monthsUsed, 'month count must be reproducible');
  assert.equal(first.actionsUsed, second.actionsUsed, 'action count must be reproducible');
  assert.deepEqual(
    first.trace.map(entry => `${entry.month}|${entry.action}|${entry.detail}`),
    second.trace.map(entry => `${entry.month}|${entry.action}|${entry.detail}`),
    'the action trace must be reproducible',
  );
});

console.log(`\nMission Runner: ${checks} checks passed (${MISSIONS.length} missions).`);
