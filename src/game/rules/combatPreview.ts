import { getCombatWidth } from '../../map/map_constants';
import {
  getEffectiveFortressLevel,
  type Army,
  type MapRuntimeState,
  type Province,
} from '../../map/types_map';
import {
  DEFENSE_BASE,
  TERRAIN_DEFENSE_COEFFICIENT,
  deployToWidth,
  getCasualtyFactor,
  getCombatPower,
  getDefenseCoefficient,
  getDeployedManpower,
} from './combat';
import { getUnitMilitarizationMultiplier } from './militarization';

/**
 * Deterministic combat readout for the UI.
 *
 * This intentionally mirrors `resolveBattle` (same deployment, same defence
 * coefficient, same casualty factors) but omits its two random rolls, so the
 * player sees the expected value before committing. Any change to the battle
 * formula must be mirrored here; the preview is a read model, not a second
 * rules engine.
 */

export type CombatPreviewVerdict = 'undefended' | 'favourable' | 'unfavourable' | 'hopeless';

export interface CombatPreviewSide {
  power: number;
  committed: number;
  reserve: number;
  manpower: number;
  morale: number;
  /** Militarization multiplier (0.10–1.00), not the raw 0–100 rate. */
  militarization: number;
  units: number;
}

export interface CombatPreviewDefense {
  base: number;
  terrainBonus: number;
  fortress: number;
  total: number;
  terrain: Province['terrain'];
}

export interface CombatPreview {
  width: number;
  attacker: CombatPreviewSide;
  defender: CombatPreviewSide;
  defense: CombatPreviewDefense;
  attackerLossRate: number;
  defenderLossRate: number;
  attackerExpectedLosses: number;
  defenderExpectedLosses: number;
  attackerLossRatio: number;
  defenderLossRatio: number;
  /** Attacker power needed to make the loss-ratio check a coin flip. */
  requiredPower: number;
  verdict: CombatPreviewVerdict;
}

const clampLossRate = (value: number): number => Math.max(0.02, Math.min(0.18, value));

const emptySide = (): CombatPreviewSide => ({
  power: 0,
  committed: 0,
  reserve: 0,
  manpower: 0,
  morale: 0,
  militarization: 0,
  units: 0,
});

export const buildCombatPreview = (
  state: Pick<MapRuntimeState, 'provinces' | 'armies' | 'militarization'>,
  attacker: Army,
  targetProvinceId: string,
): CombatPreview | null => {
  const provinces = state.provinces;
  const province = provinces?.[targetProvinceId];
  if (!province) return null;

  const width = getCombatWidth(province.terrain);
  const fortress = getEffectiveFortressLevel(province);
  const terrainCoefficient = TERRAIN_DEFENSE_COEFFICIENT[province.terrain] ?? 1;
  const defense: CombatPreviewDefense = {
    base: DEFENSE_BASE,
    terrainBonus: terrainCoefficient - 1,
    fortress,
    total: getDefenseCoefficient(province.terrain, fortress),
    terrain: province.terrain,
  };

  const attackerDeployment = deployToWidth(attacker.composition, width);
  const attackerCommitted = getDeployedManpower(attackerDeployment);
  const attackerMilitarization = getUnitMilitarizationMultiplier(state, attacker);
  const attackerPower = getCombatPower({
    deployment: attackerDeployment,
    militarizationMultiplier: attackerMilitarization,
    morale: attacker.morale,
  });
  const attackerSide: CombatPreviewSide = {
    power: attackerPower,
    committed: attackerCommitted,
    reserve: attackerDeployment.reserveInfantry + attackerDeployment.reserveTanks,
    manpower: Math.max(0, attacker.manpower),
    morale: attacker.morale,
    militarization: attackerMilitarization,
    units: 1,
  };

  const defenders = (state.armies || []).filter(
    (army) => army.provinceId === targetProvinceId && army.faction !== attacker.faction && army.manpower > 0,
  );

  if (defenders.length === 0) {
    return {
      width,
      attacker: attackerSide,
      defender: emptySide(),
      defense,
      attackerLossRate: 0,
      defenderLossRate: 0,
      attackerExpectedLosses: 0,
      defenderExpectedLosses: 0,
      attackerLossRatio: 0,
      defenderLossRatio: 0,
      requiredPower: 0,
      verdict: 'undefended',
    };
  }

  const defenderManpower = defenders.reduce((total, army) => total + Math.max(0, army.manpower), 0);
  const mergedComposition = defenders.reduce(
    (total, army) => ({
      infantry: total.infantry + army.composition.infantry,
      artillery: total.artillery + army.composition.artillery,
      tanks: total.tanks + army.composition.tanks,
    }),
    { infantry: 0, artillery: 0, tanks: 0 },
  );
  const defenderDeployment = deployToWidth(mergedComposition, width);
  const defenderCommitted = getDeployedManpower(defenderDeployment);
  const defenderMorale = defenderManpower > 0
    ? Math.round(defenders.reduce((total, army) => total + army.morale * army.manpower, 0) / defenderManpower)
    : 0;
  const defenderMilitarization = defenderManpower > 0
    ? defenders.reduce(
      (total, army) => total + getUnitMilitarizationMultiplier(state, army) * army.manpower,
      0,
    ) / defenderManpower
    : 0;
  const defenderPower = getCombatPower({
    deployment: defenderDeployment,
    militarizationMultiplier: defenderMilitarization,
    morale: defenderMorale,
    defenseCoefficient: defense.total,
  });
  const defenderSide: CombatPreviewSide = {
    power: defenderPower,
    committed: defenderCommitted,
    reserve: defenderDeployment.reserveInfantry + defenderDeployment.reserveTanks,
    manpower: defenderManpower,
    morale: defenderMorale,
    militarization: defenderMilitarization,
    units: defenders.length,
  };

  const attackerCasualtyFactor = getCasualtyFactor(attackerMilitarization);
  const defenderCasualtyFactor = getCasualtyFactor(defenderMilitarization);
  const attackerLossRate = clampLossRate(0.06 * defenderPower / Math.max(0.0001, attackerPower));
  const defenderLossRate = clampLossRate(0.06 * attackerPower / Math.max(0.0001, defenderPower));

  const attackerExpectedLosses = Math.min(
    attackerCommitted,
    Math.floor(attackerCommitted * attackerLossRate * attackerCasualtyFactor),
  );
  const defenderExpectedLosses = Math.min(
    defenderManpower,
    Math.floor(defenderManpower * defenderLossRate * defenderCasualtyFactor),
  );

  const attackerLossRatio = attackerExpectedLosses / Math.max(1, attackerCommitted);
  const defenderLossRatio = defenderExpectedLosses / Math.max(1, defenderManpower);

  // The battle check is `defenderLossRatio >= attackerLossRatio`; solving the
  // two loss-rate formulas for that threshold gives this required power.
  const requiredPower = defenderPower * Math.sqrt(
    attackerCasualtyFactor / Math.max(0.0001, defenderCasualtyFactor),
  );
  const ratio = requiredPower > 0 ? attackerPower / requiredPower : 1;
  const verdict: CombatPreviewVerdict = ratio >= 1
    ? 'favourable'
    : ratio >= 0.75 ? 'unfavourable' : 'hopeless';

  return {
    width,
    attacker: attackerSide,
    defender: defenderSide,
    defense,
    attackerLossRate,
    defenderLossRate,
    attackerExpectedLosses,
    defenderExpectedLosses,
    attackerLossRatio,
    defenderLossRatio,
    requiredPower,
    verdict,
  };
};
