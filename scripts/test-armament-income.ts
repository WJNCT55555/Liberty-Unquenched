import { equal } from 'node:assert/strict';
import { getMonthlyArmamentIncome } from '../src/game/GameContext';

for (let month = 1; month <= 12; month += 1) {
  equal(
    getMonthlyArmamentIncome(false, month),
    month % 2 === 0 ? 1 : 0,
    `peace-time armament income for month ${month}`
  );
  equal(
    getMonthlyArmamentIncome(true, month),
    1,
    `war-time armament income for month ${month}`
  );
}

console.log('Armament income tests passed.');
