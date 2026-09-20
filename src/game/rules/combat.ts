import { PROVINCE_ADJACENCY, getCombatWidth } from '../../map/map_constants';
import { getEffectiveFortressLevel, MapFaction, type Army } from '../../map/types_map';
import { canEnterMapProvince, getMapFactionName } from '../../map/rules/factions';

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

export function resolveBattle(
  armies: Army[],
  provinces: Record<string, any>,
  movedArmy: Army,
  targetProvinceId: string,
  isZh: boolean,
  random: () => number = Math.random,
): { updatedArmies: Army[]; updatedProvinces: Record<string, any>; messages: string[] } {
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

  const attackerRoll = Math.floor(random() * 9) + 1;
  const defenderRoll = Math.floor(random() * 9) + 1;

  // Every defending unit in the province fights as one line: composition is summed
  // and morale/training are manpower-weighted, then the whole line is filled to the
  // terrain's combat width below.
  const defComp = defenders.reduce(
    (total, army) => ({
      infantry: total.infantry + army.composition.infantry,
      artillery: total.artillery + army.composition.artillery,
      tanks: total.tanks + army.composition.tanks,
    }),
    { infantry: 0, artillery: 0, tanks: 0 },
  );
  const defenderManpower = defenders.reduce((total, army) => total + army.manpower, 0);
  const weightedDefenderStat = (pick: (army: Army) => number) => (
    defenderManpower > 0
      ? defenders.reduce((total, army) => total + pick(army) * army.manpower, 0) / defenderManpower
      : 0
  );
  const defenderMorale = Math.round(weightedDefenderStat((army) => army.morale));
  const defenderMilitarization = Math.round(weightedDefenderStat((army) => army.militarization));

  const terrain = targetProvince.terrain || 'plains';
  // The fortress level is inherent defence plus everything built on top of it, and
  // it is applied exactly once, as its own multiplier below.
  const effectiveFortress = getEffectiveFortressLevel(targetProvince);

  let attackerTerrainMult = 1.0;
  let defenderTerrainMult = 1.0;
  let attackerTankMult = 1.0;

  if (terrain === 'mountains') {
    attackerTerrainMult -= 0.30;
    attackerTankMult = 0.4;
    defenderTerrainMult += 0.20;
  } else if (terrain === 'urban') {
    attackerTerrainMult -= 0.20;
    attackerTankMult = 0.6;
    defenderTerrainMult += 0.15;
  } else if (terrain === 'forest') {
    attackerTerrainMult -= 0.10;
    attackerTankMult = 0.8;
    defenderTerrainMult += 0.10;
  } else if (terrain === 'plains') {
    attackerTankMult = 1.35;
  }

  const attComp = movedArmy.composition;

  const widthLimit = getCombatWidth(terrain as any || 'plains');

  const attackerFrontline = attComp.infantry + attComp.tanks;
  const attackerScale = attackerFrontline > widthLimit ? (widthLimit / attackerFrontline) : 1.0;
  const effectiveAttInf = attComp.infantry * attackerScale;
  const effectiveAttTank = attComp.tanks * attackerScale;

  const defenderFrontline = defComp.infantry + defComp.tanks;
  const defenderScale = defenderFrontline > widthLimit ? (widthLimit / defenderFrontline) : 1.0;
  const effectiveDefInf = defComp.infantry * defenderScale;
  const effectiveDefTank = defComp.tanks * defenderScale;

  const attInfPower = effectiveAttInf * 1.0 * (terrain === 'urban' ? 1.25 : 1.0);
  const attArtPower = attComp.artillery * 1.5;
  const attTankPower = effectiveAttTank * 2.0 * attackerTankMult;

  const defInfPower = effectiveDefInf * 1.0 * (terrain === 'urban' ? 1.3 : 1.15);
  const defArtPower = defComp.artillery * 1.5;
  const defTankPower = effectiveDefTank * 2.0 * (terrain === 'plains' ? 1.35 : terrain === 'mountains' ? 0.4 : 1.0);

  const attTotalBaseSupport = attInfPower + attArtPower + attTankPower;
  const defTotalBaseSupport = defInfPower + defArtPower + defTankPower;

  const attackerPower = attTotalBaseSupport * (1 + movedArmy.morale / 100) * (1 + movedArmy.militarization / 100) * (attackerRoll + 3) * attackerTerrainMult;
  const defenderPowerBase = defTotalBaseSupport * (1 + defenderMorale / 100) * (1 + defenderMilitarization / 100) * (defenderRoll + 3) * defenderTerrainMult;
  const fortressCombatMult = 1.0 + (effectiveFortress * 0.10);
  const defenderPower = defenderPowerBase * fortressCombatMult;

  const totalBaseLossAttacker = Math.floor(defenderPower * 0.08);
  const totalBaseLossDefender = Math.floor(attackerPower * 0.11);

  const attArtRatio = attComp.artillery / Math.max(1, movedArmy.manpower);
  const defArtRatio = defComp.artillery / Math.max(1, defenderManpower);

  const attackerLossReduction = Math.min(0.25, attArtRatio * 0.8);
  const defenderLossReduction = Math.min(0.25, defArtRatio * 0.8);

  let finalAttackerLosses = Math.max(100, Math.floor(totalBaseLossAttacker * (1 - attackerLossReduction)));
  let finalDefenderLosses = Math.max(100, Math.floor(totalBaseLossDefender * (1 - defenderLossReduction)));

  finalAttackerLosses = Math.min(movedArmy.manpower, finalAttackerLosses);
  finalDefenderLosses = Math.min(defenderManpower, finalDefenderLosses);

  const distributeLosses = (comp: { infantry: number; artillery: number; tanks: number }, totalLosses: number) => {
    const totalUnits = comp.infantry + comp.artillery + comp.tanks;
    if (totalUnits <= 0) return { infantry: 0, artillery: 0, tanks: 0 };

    let infLoss = 0;
    let artLoss = 0;
    let tankLoss = 0;

    const frontUnits = comp.infantry + comp.tanks;
    if (frontUnits > 0) {
      const infShare = comp.infantry / frontUnits;
      const tankShare = comp.tanks / frontUnits;

      const frontLosses = totalLosses * 0.85;
      const backLosses = totalLosses * 0.15;

      infLoss = Math.min(comp.infantry, Math.floor(frontLosses * infShare));
      tankLoss = Math.min(comp.tanks, Math.floor(frontLosses * tankShare));
      artLoss = Math.min(comp.artillery, Math.floor(backLosses));

      let leftover = totalLosses - (infLoss + artLoss + tankLoss);
      if (leftover > 0) {
        const remInf = comp.infantry - infLoss;
        const remArt = comp.artillery - artLoss;
        const remTank = comp.tanks - tankLoss;
        const remTotal = remInf + remArt + remTank;

        if (remTotal > 0) {
          infLoss += Math.min(remInf, Math.floor(leftover * (remInf / remTotal)));
          artLoss += Math.min(remArt, Math.floor(leftover * (remArt / remTotal)));
          tankLoss += Math.min(remTank, Math.floor(leftover * (remTank / remTotal)));
        }
      }
    } else {
      artLoss = Math.min(comp.artillery, totalLosses);
    }

    return {
      infantry: Math.max(0, comp.infantry - infLoss),
      artillery: Math.max(0, comp.artillery - artLoss),
      tanks: Math.max(0, comp.tanks - tankLoss),
    };
  };

  const nextAttComp = distributeLosses(attComp, finalAttackerLosses);
  const nextAttManpower = nextAttComp.infantry + nextAttComp.artillery + nextAttComp.tanks;

  const attackerLostRatio = finalAttackerLosses / Math.max(1, movedArmy.manpower);
  const defenderLostRatio = finalDefenderLosses / Math.max(1, defenderManpower);

  const attMoraleLoss = Math.floor(10 + attackerLostRatio * 100 + Math.max(0, defenderRoll - attackerRoll) * 3);

  let finalAttackerArmy: Army | null = {
    ...movedArmy,
    composition: nextAttComp,
    manpower: nextAttManpower,
    morale: Math.max(10, movedArmy.morale - attMoraleLoss),
    movesLeft: 0,
  };
  if (finalAttackerArmy.manpower <= 150) {
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
      if (manpower <= 150) return null;
      const lostRatio = defenderLossShares[index] / Math.max(1, army.manpower);
      return {
        ...army,
        composition: nextDefComp,
        manpower,
        morale: Math.max(10, army.morale - Math.floor(15 + lostRatio * 100 + Math.max(0, attackerRoll - defenderRoll) * 4)),
      } as Army;
    })
    .filter((army): army is Army => army !== null);

  const isVictory = defenderLostRatio >= attackerLostRatio;
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
        `攻击方伤亡 ${finalAttackerLosses}人。` +
        `防守方伤亡 ${finalDefenderLosses}人。`
      : `BATTLE OF ${targetProvince.name.toUpperCase()} (${terrainLabel}): ${resultText}! ` +
        `Attacker (rolled ${attackerRoll}) lost ${finalAttackerLosses}. ` +
        `Defender (rolled ${defenderRoll}) lost ${finalDefenderLosses}.`
  );

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
  if (!defenderStillInProvince && finalAttackerArmy) {
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
