import { PROVINCE_ADJACENCY, getCombatWidth } from '../../map/map_constants';
import { getEffectiveFortressLevel, MapFaction, type Army, type ArmyComposition, type ArmyIdentity, type Province } from '../../map/types_map';
import { canEnterMapProvince, getMapFactionName } from '../../map/rules/factions';
import { getMilitarization, getMilitarizationMultiplier } from './militarization';

/**
 * One battle is one resolution: a single line fights, casualties are taken, and
 * the province either changes hands or it does not. The formula is
 *
 *   最终战力 = 基础战力
 *            × 军事化系数   (该单位所属派系的 militarization，查表得到，不存单位)
 *            × (1 + 士气/100)
 *            × 防守系数     (仅防守方)
 *            × 随机系数     ∈ [0.90, 1.10]
 *
 * and the terms that feed 基础战力 are covered by `deployToWidth` below.
 */

/** Per-man weight of artillery crews, on top of their own headcount. */
export const ARTILLERY_WEIGHT = 0.35;
/** Per-man weight of armour crews, on top of their own headcount. */
export const ARMOUR_WEIGHT = 0.60;

/**
 * Inherited terrain defence coefficients. In the current defence formula only
 * their **excess over 1.0** is used, so the plain is the neutral case.
 */
export const TERRAIN_DEFENSE_COEFFICIENT: Record<Province['terrain'], number> = {
  plains: 1.00,
  forest: 1.15,
  urban: 1.20,
  mountains: 1.30,
};

/**
 * The constant term of the defence formula. At 1.2 an even fight still favours
 * the defender (roughly 1.44 : 1 casualties, so about 1.4 : 1 odds to profit),
 * without making attacks impossible.
 */
export const DEFENSE_BASE = 1.2;

/**
 * 防守系数 = 1.2 + (地形防御系数 − 1) + 工事等级.
 *
 * Additive, not multiplicative: fortification level is added directly, so a
 * mountain fortress (1.2 + 0.30 + 2 = 3.50) is genuinely punishing while open
 * plains (1.20) stays attackable.
 */
export const getDefenseCoefficient = (
  terrain: Province['terrain'],
  fortressLevel: number,
): number => (
  DEFENSE_BASE
  + ((TERRAIN_DEFENSE_COEFFICIENT[terrain] ?? TERRAIN_DEFENSE_COEFFICIENT.plains) - 1)
  + Math.max(0, Number.isFinite(fortressLevel) ? fortressLevel : 0)
);

/** Units at or below this many men are destroyed rather than left on the map. */
export const UNIT_DESTRUCTION_THRESHOLD = 150;

/**
 * Split one total loss across several units in proportion to the men each brought.
 * Floor first, then hand the rounding remainder to the units with the most men left
 * to lose, so the summed shares never exceed the requested total.
 */
export function splitLossAcrossUnits(units: Army[], totalLosses: number): number[] {
  const totalManpower = units.reduce((sum, army) => sum + army.manpower, 0);
  if (totalManpower <= 0 || totalLosses <= 0) return units.map(() => 0);

  const shares = units.map(army => Math.min(army.manpower, Math.floor((totalLosses * army.manpower) / totalManpower)));
  let leftover = totalLosses - shares.reduce((sum, value) => sum + value, 0);

  const byRoom = units
    .map((army, index) => ({ index, room: army.manpower - shares[index] }))
    .sort((left, right) => right.room - left.room);
  for (const { index, room } of byRoom) {
    if (leftover <= 0) break;
    const extra = Math.min(room, leftover);
    shares[index] += extra;
    leftover -= extra;
  }
  return shares;
}

/**
 * How much of a composition actually stands in the line.
 *
 * Deployment order is fixed: **tanks first, then infantry, then artillery** —
 * which is also the order of per-man value (1.60 / 1.00 / 1.35), so the best
 * troops claim the frontage. Artillery ignores combat width entirely.
 */
export interface Deployment {
  infantry: number;
  tanks: number;
  /** Artillery is never withheld: it fires over the heads of the line. */
  artillery: number;
  reserveInfantry: number;
  reserveTanks: number;
}

export const deployToWidth = (composition: ArmyComposition, width: number): Deployment => {
  const tanks = Math.min(Math.max(0, composition.tanks), width);
  const infantry = Math.min(Math.max(0, composition.infantry), Math.max(0, width - tanks));
  return {
    infantry,
    tanks,
    artillery: Math.max(0, composition.artillery),
    reserveInfantry: Math.max(0, composition.infantry - infantry),
    reserveTanks: Math.max(0, composition.tanks - tanks),
  };
};

/** Men that actually stand in the line for this battle. */
export const getDeployedManpower = (deployment: Deployment): number =>
  deployment.infantry + deployment.tanks + deployment.artillery;

/**
 * 基础战力 on the thousand-man scale: each man counts for himself, and artillery
 * and armour crews additionally carry their arm's weight.
 */
export const getBasePower = (deployment: Deployment): number => (
  (
    deployment.infantry
    + deployment.tanks
    + deployment.artillery
    + deployment.artillery * ARTILLERY_WEIGHT
    + deployment.tanks * ARMOUR_WEIGHT
  ) / 1000
);

/** 军事化伤亡系数 = 1.10 − 0.20 × 军事化率 / 100. */
export const getCasualtyFactor = (militarizationMultiplier: number): number =>
  1.10 - 0.20 * militarizationMultiplier;

export interface CombatPowerInputs {
  deployment: Deployment;
  militarizationMultiplier: number;
  morale: number;
  /** 1 for the attacker; the defender's terrain+fortress coefficient otherwise. */
  defenseCoefficient?: number;
  /**
   * Omit to get the deterministic value the UI shows. Battles pass a roll in
   * [0.90, 1.10] so that randomness can swing a close fight without overturning
   * a decisive one.
   */
  randomMultiplier?: number;
}

/**
 * 最终战力 = 基础战力 × 军事化系数 × (1 + 士气/100) × 防守系数 × 随机系数.
 *
 * The single definition of the formula: `resolveBattle` and every UI readout go
 * through here, so a displayed strength can never drift from a resolved one.
 */
export const getCombatPower = (inputs: CombatPowerInputs): number => (
  getBasePower(inputs.deployment)
  * inputs.militarizationMultiplier
  * (1 + inputs.morale / 100)
  * (inputs.defenseCoefficient ?? 1)
  * (inputs.randomMultiplier ?? 1)
);

const clampLossRate = (value: number): number => Math.max(0.02, Math.min(0.18, value));

/**
 * Applies a loss total to the part of a composition that was exposed, leaving
 * reserves untouched, and returns the unit's full post-battle composition.
 *
 * 85% of the loss falls on the line (infantry and armour in proportion to their
 * share), 15% on the guns behind it; any rounding remainder is spread over
 * whoever is left.
 */
const distributeLosses = (composition: ArmyComposition, totalLosses: number): ArmyComposition => {
  const totalUnits = composition.infantry + composition.artillery + composition.tanks;
  if (totalUnits <= 0 || totalLosses <= 0) {
    return { infantry: composition.infantry, artillery: composition.artillery, tanks: composition.tanks };
  }

  let infLoss = 0;
  let artLoss = 0;
  let tankLoss = 0;

  const frontUnits = composition.infantry + composition.tanks;
  if (frontUnits > 0) {
    const infShare = composition.infantry / frontUnits;
    const tankShare = composition.tanks / frontUnits;

    const frontLosses = totalLosses * 0.85;
    const backLosses = totalLosses * 0.15;

    infLoss = Math.min(composition.infantry, Math.floor(frontLosses * infShare));
    tankLoss = Math.min(composition.tanks, Math.floor(frontLosses * tankShare));
    artLoss = Math.min(composition.artillery, Math.floor(backLosses));

    const leftover = totalLosses - (infLoss + artLoss + tankLoss);
    if (leftover > 0) {
      const remInf = composition.infantry - infLoss;
      const remArt = composition.artillery - artLoss;
      const remTank = composition.tanks - tankLoss;
      const remTotal = remInf + remArt + remTank;

      if (remTotal > 0) {
        infLoss += Math.min(remInf, Math.floor(leftover * (remInf / remTotal)));
        artLoss += Math.min(remArt, Math.floor(leftover * (remArt / remTotal)));
        tankLoss += Math.min(remTank, Math.floor(leftover * (remTank / remTotal)));
      }
    }
  } else {
    artLoss = Math.min(composition.artillery, totalLosses);
  }

  return {
    infantry: Math.max(0, composition.infantry - infLoss),
    artillery: Math.max(0, composition.artillery - artLoss),
    tanks: Math.max(0, composition.tanks - tankLoss),
  };
};

export type MilitarizationLookup = Record<ArmyIdentity, number> | undefined;

const lookupMultiplier = (militarization: MilitarizationLookup, identity: ArmyIdentity | undefined): number =>
  getMilitarizationMultiplier(getMilitarization({ militarization }, identity ?? 'gov'));

export function resolveBattle(
  armies: Army[],
  provinces: Record<string, Province>,
  movedArmy: Army,
  targetProvinceId: string,
  isZh: boolean,
  militarization?: MilitarizationLookup,
  random: () => number = Math.random,
): { updatedArmies: Army[]; updatedProvinces: Record<string, Province>; messages: string[] } {
  const targetProvince = provinces[targetProvinceId];
  if (!targetProvince || !canEnterMapProvince(movedArmy.faction, targetProvince.owner)) {
    return { updatedArmies: armies, updatedProvinces: provinces, messages: [] };
  }
  const defenders = armies.filter(a => a.provinceId === targetProvinceId && a.faction !== movedArmy.faction);

  if (defenders.length === 0) {
    const updatedProvinces = {
      ...provinces,
      [targetProvinceId]: {
        ...targetProvince,
        owner: movedArmy.faction,
      }
    };
    const updatedArmies = armies.map(a => a.id === movedArmy.id ? { ...a, provinceId: targetProvinceId, movesLeft: Math.max(0, a.movesLeft - 1) } : a);
    const msg = isZh
      ? `【移驻】${getMapFactionName(movedArmy.faction, true)}占领了未设防的省份 ${targetProvince.name}。`
      : `${movedArmy.faction} army captured undefended province ${targetProvince.name}.`;
    return { updatedArmies, updatedProvinces, messages: [msg] };
  }

  const hasPortugalOrNeutral = movedArmy.faction === MapFaction.PORTUGAL || movedArmy.faction === MapFaction.NEUTRAL ||
                               defenders.some(d => d.faction === MapFaction.PORTUGAL || d.faction === MapFaction.NEUTRAL);
  if (hasPortugalOrNeutral) {
    return { updatedArmies: armies, updatedProvinces: provinces, messages: [] };
  }

  const terrain = (targetProvince.terrain || 'plains') as Province['terrain'];
  const width = getCombatWidth(terrain);
  // The fortress level is inherent defence plus everything built on top of it, and
  // it enters the defence coefficient exactly once, as its own additive term.
  const defenseCoefficient = getDefenseCoefficient(terrain, getEffectiveFortressLevel(targetProvince));

  // Every defending unit in the province fights as one line: composition is summed
  // and deployed to the terrain's combat width as a whole.
  const defenderManpower = defenders.reduce((total, army) => total + army.manpower, 0);
  const mergedDefenderComposition = defenders.reduce<ArmyComposition>(
    (total, army) => ({
      infantry: total.infantry + army.composition.infantry,
      artillery: total.artillery + army.composition.artillery,
      tanks: total.tanks + army.composition.tanks,
    }),
    { infantry: 0, artillery: 0, tanks: 0 },
  );
  const weightedDefenderStat = (pick: (army: Army) => number) => (
    defenderManpower > 0
      ? defenders.reduce((total, army) => total + pick(army) * army.manpower, 0) / defenderManpower
      : 0
  );
  const defenderMorale = Math.round(weightedDefenderStat((army) => army.morale));
  const defenderMilitarization = weightedDefenderStat((army) => lookupMultiplier(militarization, army.identity));

  // The attacker commits once: only what fits in the line fights, and its
  // reserves are never exposed. The defender, by contrast, rotates reserves into
  // the line for as long as it has men, so its casualties come out of the whole pool.
  const attackerDeployment = deployToWidth(movedArmy.composition, width);
  const attackerMilitarization = lookupMultiplier(militarization, movedArmy.identity);
  const attackerExposed = getDeployedManpower(attackerDeployment);

  const attackerRoll = 0.90 + random() * 0.20;
  const defenderRoll = 0.90 + random() * 0.20;

  const attackerPower = getCombatPower({
    deployment: attackerDeployment,
    militarizationMultiplier: attackerMilitarization,
    morale: movedArmy.morale,
    randomMultiplier: attackerRoll,
  });

  const defenderPower = getCombatPower({
    deployment: deployToWidth(mergedDefenderComposition, width),
    militarizationMultiplier: defenderMilitarization,
    morale: defenderMorale,
    defenseCoefficient,
    randomMultiplier: defenderRoll,
  });

  const attackerLossRate = clampLossRate(0.06 * defenderPower / Math.max(0.0001, attackerPower));
  const defenderLossRate = clampLossRate(0.06 * attackerPower / Math.max(0.0001, defenderPower));

  const finalAttackerLosses = Math.min(
    attackerExposed,
    Math.floor(attackerExposed * attackerLossRate * getCasualtyFactor(attackerMilitarization)),
  );
  const finalDefenderLosses = Math.min(
    defenderManpower,
    Math.floor(defenderManpower * defenderLossRate * getCasualtyFactor(defenderMilitarization)),
  );

  // Casually applied to the deployed slice only; the reserves are added back intact.
  const attackerDeployedComposition: ArmyComposition = {
    infantry: attackerDeployment.infantry,
    artillery: attackerDeployment.artillery,
    tanks: attackerDeployment.tanks,
  };
  const attackerLineSurvivors = distributeLosses(attackerDeployedComposition, finalAttackerLosses);
  const attackerLineRemaining = attackerLineSurvivors.infantry + attackerLineSurvivors.artillery + attackerLineSurvivors.tanks;
  const attackerLineBroken = attackerLineRemaining <= UNIT_DESTRUCTION_THRESHOLD;

  const nextAttComp: ArmyComposition = attackerLineBroken
    ? { infantry: attackerDeployment.reserveInfantry, artillery: 0, tanks: attackerDeployment.reserveTanks }
    : {
        infantry: attackerLineSurvivors.infantry + attackerDeployment.reserveInfantry,
        artillery: attackerLineSurvivors.artillery,
        tanks: attackerLineSurvivors.tanks + attackerDeployment.reserveTanks,
      };
  const nextAttManpower = nextAttComp.infantry + nextAttComp.artillery + nextAttComp.tanks;

  const attackerLostRatio = finalAttackerLosses / Math.max(1, attackerExposed);
  const defenderLostRatio = finalDefenderLosses / Math.max(1, defenderManpower);

  const attMoraleLoss = Math.floor(10 + attackerLostRatio * 100 + Math.max(0, (defenderRoll - attackerRoll) * 20));

  let finalAttackerArmy: Army | null = {
    ...movedArmy,
    composition: nextAttComp,
    manpower: nextAttManpower,
    morale: Math.max(10, movedArmy.morale - attMoraleLoss),
    movesLeft: 0,
  };
  if (finalAttackerArmy.manpower <= UNIT_DESTRUCTION_THRESHOLD) {
    finalAttackerArmy = null;
  }

  // Each defending unit absorbs its share of the total loss in proportion to the
  // men it contributed, so per-entity casualty records stay accurate. Units are
  // never merged into one object.
  const defenderLossShares = splitLossAcrossUnits(defenders, finalDefenderLosses);
  const survivingDefenders: Army[] = defenders
    .map((army, index) => {
      const nextDefComp = distributeLosses(army.composition, defenderLossShares[index]);
      const manpower = nextDefComp.infantry + nextDefComp.artillery + nextDefComp.tanks;
      if (manpower <= UNIT_DESTRUCTION_THRESHOLD) return null;
      const lostRatio = defenderLossShares[index] / Math.max(1, army.manpower);
      return {
        ...army,
        composition: nextDefComp,
        manpower,
        morale: Math.max(10, army.morale - Math.floor(15 + lostRatio * 100 + Math.max(0, (attackerRoll - defenderRoll) * 20))),
      } as Army;
    })
    .filter((army): army is Army => army !== null);

  // A broken attacker line forfeits the attack however the odds looked: the
  // reserves disengage instead of feeding themselves into the same fight.
  const isVictory = !attackerLineBroken && defenderLostRatio >= attackerLostRatio;
  const resultText = isVictory
    ? (isZh ? '进攻方胜利' : 'Attacker Victory')
    : (isZh ? '守军平局/获胜' : 'Defender Stalemate/Victory');

  const survivorsManpower = survivingDefenders.reduce((total, army) => total + army.manpower, 0);
  const survivorsMorale = survivorsManpower > 0
    ? Math.round(survivingDefenders.reduce((total, army) => total + army.morale * army.manpower, 0) / survivorsManpower)
    : 0;

  let defenderRetreated = false;
  let defenderAnnihilated = false;
  let retreatDestId = '';
  let retreatedDefenders: Army[] = survivingDefenders;

  if (survivingDefenders.length > 0 && (isVictory || survivorsMorale < 35)) {
    const defenderFaction = defenders[0].faction;
    const defenderNeighbors = PROVINCE_ADJACENCY[targetProvinceId] || [];
    const friendlyDestinations = defenderNeighbors.filter(pId => provinces[pId] && provinces[pId].owner === defenderFaction);

    if (friendlyDestinations.length > 0) {
      retreatDestId = friendlyDestinations[0];
      retreatedDefenders = survivingDefenders.map((army) => ({
        ...army,
        provinceId: retreatDestId,
        morale: Math.max(10, army.morale - 10),
        movesLeft: 0,
      }));
      defenderRetreated = true;
    } else {
      retreatedDefenders = [];
      defenderAnnihilated = true;
    }
  }

  const messages: string[] = [];
  const terrainLabel = isZh
    ? (terrain === 'mountains' ? '山地' : terrain === 'urban' ? '城市' : terrain === 'forest' ? '森林' : '平原')
    : terrain;

  messages.push(
    isZh
      ? `【交战：${targetProvince.name}（${terrainLabel}）】 ${resultText}！` +
        `攻击方伤亡 ${finalAttackerLosses}人（展开 ${attackerExposed}人）。` +
        `防守方伤亡 ${finalDefenderLosses}人。`
      : `BATTLE OF ${targetProvince.name.toUpperCase()} (${terrainLabel}): ${resultText}! ` +
        `Attacker lost ${finalAttackerLosses} of ${attackerExposed} committed. ` +
        `Defender lost ${finalDefenderLosses}.`
  );

  if (attackerLineBroken) {
    messages.push(
      isZh
        ? `【前线崩溃】进攻方展开部队被击溃，预备队脱离接触，攻势失败。`
        : `[Line Broken] The attacking line was destroyed; the reserves disengaged and the assault failed.`
    );
  }

  if (defenderRetreated) {
    const destName = provinces[retreatDestId]?.name || retreatDestId;
    messages.push(
      isZh
        ? `【退却】${survivingDefenders.length} 支防守部队撤退至 ${destName}。`
        : `[🛡️ Organized Retreat] ${survivingDefenders.length} defending formation(s) retreated to ${destName}.`
    );
  } else if (defenderAnnihilated) {
    messages.push(
      isZh
        ? `【歼灭】防守方 ${defenders.length} 支部队全军覆没！`
        : `[💥 Annihilation] All ${defenders.length} defending formation(s) were annihilated!`
    );
  }

  let updatedProvinces = { ...provinces };
  const defenderIds = new Set(defenders.map(army => army.id));
  const retreatById = new Map(retreatedDefenders.map(army => [army.id, army] as const));
  let finalArmies = armies
    .map(army => {
      if (army.id === movedArmy.id) return finalAttackerArmy;
      if (!defenderIds.has(army.id)) return army;
      return retreatById.get(army.id) ?? null;
    })
    .filter((army): army is Army => army !== null);

  const defenderStillInProvince = finalArmies.some(army => defenderIds.has(army.id) && army.provinceId === targetProvinceId);
  if (isVictory && defenderStillInProvince === false && finalAttackerArmy) {
    finalArmies = finalArmies.map(a => a.id === movedArmy.id ? { ...a, provinceId: targetProvinceId } : a);
    updatedProvinces[targetProvinceId] = { ...targetProvince, owner: movedArmy.faction };
    messages.push(
      isZh
        ? `【占领】突破成功，占领 ${targetProvince.name}！`
        : `${movedArmy.faction} forces achieved a decisive breakthrough and won ${targetProvince.name}.`
    );
  }

  return { updatedArmies: finalArmies, updatedProvinces, messages };
}
