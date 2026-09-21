import type { GameState } from '../types';
import { checkAchievements } from '../achievements';
import { checkEndings } from '../endings';
import { normalizeDomesticPolicyLawLevels } from '../lawStances';
import { normalizeUnionShare } from '../unions';
import { updateCoalitions, updatePartySupport } from '../utils';
import { isRepublicCrisisSuspended } from '../rules/republicCrisis';
import { applySecurityForcesDerivedState } from '../rules/securityForces';
import {
  isSpanishCivilWarOngoing,
  WARTIME_CRISIS_ID,
  WARTIME_EVENT_ID,
} from '../rules/wartimeCoalition';
import { MAY_DAYS_EVENT_IDS } from '../rules/mayDays';
import { isCoalitionDissolutionEventId } from '../events/coalition_dissolution';

/**
 * Applies invariant repair, derived state, terminal-state detection, and
 * monotonic achievement tracking after every root-reducer action.
 */
export const applyPostReducerPipeline = (
  previousState: GameState,
  newState: GameState,
): GameState => {
  // Normalize values to prevent overflow/underflow (0-100)
  if (newState !== previousState) {
    if (newState.domesticPolicy) {
      // Law levels use their own L0-L3/L4 scales. Journal progress fields,
      // including land_reform_progress, remain independent 0-100 values.
      newState.domesticPolicy = normalizeDomesticPolicyLawLevels(newState.domesticPolicy);
    }
    // The Security Corps Law owns the Assault Guard establishment, so derived
    // security-force state is recomputed after law levels are normalized.
    newState = applySecurityForcesDerivedState(newState);
    if (!newState.wars) {
      newState.wars = {
        spanish_civil_war: 'not_started',
        asturias_war: 'not_started'
      };
    }
    if (newState.civilWarStatus === 'ongoing') {
      if (newState.wars.spanish_civil_war !== 'ongoing') {
        newState.wars.spanish_civil_war = 'ongoing';
      }
      if (!newState.activeWar) {
        newState.activeWar = 'spanish_civil_war';
      }
    } else if (newState.civilWarStatus === 'won' || newState.civilWarStatus === 'lost') {
      newState.wars.spanish_civil_war = newState.civilWarStatus;
      if (newState.activeWar === 'spanish_civil_war') {
        newState.activeWar = null;
      }
    }
    if (!isSpanishCivilWarOngoing(newState)) {
      const wartimeOnlyIds = [WARTIME_EVENT_ID, WARTIME_CRISIS_ID, ...MAY_DAYS_EVENT_IDS];
      newState.pendingEvents = newState.pendingEvents.filter(event => !wartimeOnlyIds.includes(event.id));
      if (newState.currentEvent && wartimeOnlyIds.includes(newState.currentEvent.id)) newState.currentEvent = null;
    }

    if (newState.classes) {
      Object.keys(newState.classes).forEach(c => {
        const cls = c as keyof typeof newState.classes;
        if (newState.classes[cls] && newState.classes[cls].support) {
          Object.keys(newState.classes[cls].support).forEach(p => {
            const party = p as keyof typeof newState.classes[typeof cls]['support'];
            newState.classes[cls].support[party] = Math.max(0, Math.min(100, newState.classes[cls].support[party]));
          });
        }
      });
      newState.partySupport = updatePartySupport(newState);
    }
    if (newState.stats) {
      Object.keys(newState.stats).forEach(s => {
        const stat = s as keyof typeof newState.stats;
        newState.stats[stat] = Math.max(0, Math.min(100, newState.stats[stat]));
      });
    }
    // 工会占比：未成立组织置零、未组织者钳制下限、八项和恒为 100
    newState = normalizeUnionShare(newState);
    if (newState.wartimePowerArrangement) {
      newState.activeCoalitions = updateCoalitions(newState);
      const coalition = newState.activeCoalitions.find(item => item.activeId === 'popular_front_wartime');
      if (coalition && coalition.cohesion >= 25 && newState.wartimePowerArrangement.lowCohesionMonths > 0) {
        newState.wartimePowerArrangement = { ...newState.wartimePowerArrangement, lowCohesionMonths: 0 };
        newState.pendingEvents = newState.pendingEvents.filter(event => event.id !== WARTIME_CRISIS_ID);
      }
    }
    if (newState.factions) {
      Object.keys(newState.factions).forEach(f => {
        const faction = f as keyof typeof newState.factions;
        newState.factions[faction].influence = Math.max(0, Math.min(100, newState.factions[faction].influence));
        newState.factions[faction].dissent = Math.max(0, Math.min(100, newState.factions[faction].dissent));
      });
    }
    if (newState.relations) {
      Object.keys(newState.relations).forEach(r => {
        const rel = r as keyof typeof newState.relations;
        if (typeof newState.relations[rel] === 'number') {
          newState.relations[rel] = Math.max(0, Math.min(100, newState.relations[rel] as number));
        }
      });
    }
    // The police corps are owned by `applySecurityForcesDerivedState`, which runs
    // just above and recreates any field an older save is missing.

    // Dynamically calculate tension —— 只服务和平阶段。战争爆发（阿斯图里亚斯战争／内战）后
    // 共和国危机机制停摆：紧张度不再重算，保留最后一次数值。
    if (newState.stats && !isRepublicCrisisSuspended(newState)) {
      const { republicanAuthority, armyLoyalty, revolutionaryFervor } = newState.stats;
      newState.stats.tension = Math.max(0, Math.min(100, 
        (100 - republicanAuthority) * 0.3 + 
        (100 - armyLoyalty) * 0.4 + 
        revolutionaryFervor * 0.3
      ));
    }

    // Force coupProgress to 0 if the system is inactive.
    // 战争期间（危机已引爆）政变机制同样停摆：不再蓄积，也不再结算里程碑。
    if (!newState.coupSystemActive) {
      newState.coupProgress = 0;
    } else if (!isRepublicCrisisSuspended(newState)) {
      // The conspiracy's milestones feed the single officer-loyalty field. That is
      // the only loyalty the Republic crisis panel shows and the only one that
      // drives tension, so each milestone now advances the coup's own timetable.
      const lowerArmyLoyalty = (delta: number) => {
        newState.stats = {
          ...newState.stats,
          armyLoyalty: Math.max(0, newState.stats.armyLoyalty - delta),
        };
      };
      // Level 10: 暗流未息
      if (newState.coupProgress >= 10 && !newState.coupTriggered10) {
        newState.coupTriggered10 = true;
      }
      // Level 20: 阴谋之网
      if (newState.coupProgress >= 20 && !newState.coupTriggered20) {
        newState.coupTriggered20 = true;
      }
      // Level 30: 莫拉登场
      if (newState.coupProgress >= 30 && !newState.coupTriggered30) {
        newState.coupTriggered30 = true;
        lowerArmyLoyalty(3);
        newState.molaStatus = 'nationalist';
      }
      // Level 40: 密令扩散
      if (newState.coupProgress >= 40 && !newState.coupTriggered40) {
        newState.coupTriggered40 = true;
        lowerArmyLoyalty(10);
      }
      // Level 50: 非洲军团
      if (newState.coupProgress >= 50 && !newState.coupTriggered50) {
        newState.coupTriggered50 = true;
        newState.africaArmyStatus = 'nationalist';
      }
      // Level 60: 凯波入局
      if (newState.coupProgress >= 60 && !newState.coupTriggered60) {
        newState.coupTriggered60 = true;
        // A dead Queipo de Llano cannot join the conspiracy; the level's effect is skipped.
        if (newState.queipoStatus !== 'dead') {
          newState.queipoStatus = 'nationalist';
        }
      }
      // Level 70: 外援暗流
      if (newState.coupProgress >= 70 && !newState.coupTriggered70) {
        newState.coupTriggered70 = true;
        if (newState.relations) {
          newState.relations.germany = Math.max(0, newState.relations.germany - 5);
          newState.relations.italy = Math.max(0, newState.relations.italy - 5);
        }
      }
      // Level 80: 佛朗哥倒戈
      if (newState.coupProgress >= 80 && !newState.coupTriggered80) {
        newState.coupTriggered80 = true;
        // A dead Franco cannot defect; the whole level effect is skipped.
        if (newState.francoStatus !== 'dead') {
          lowerArmyLoyalty(5);
          newState.francoStatus = 'nationalist';
        }
      }
      // Level 90: 箭在弦上
      if (newState.coupProgress >= 90 && !newState.coupTriggered90) {
        newState.coupTriggered90 = true;
        lowerArmyLoyalty(3);
      }
      // Level 100: 国民军叛乱爆发
      if (newState.coupProgress >= 100 && !newState.coupTriggered100) {
        newState.coupTriggered100 = true;
        newState.superEvent = 'spanish_civil_war';
      }
    }
  }

  // Monotonic achievement tracking: once the CNT abandons abstention it can never
  // earn it back, even if a later event returns `cntStance` to 'oppose'.
  if (newState.cntStance !== 'oppose') {
    newState.cntStanceAlwaysOpposed = false;
  }

  // Coalition endings are player-facing political transitions, not silent
  // maintenance details. Promote the first queued notice to the active event;
  // resolving it lets this same pipeline promote the next notice, if any.
  if (!newState.currentEvent) {
    const noticeIndex = newState.pendingEvents.findIndex(event => isCoalitionDissolutionEventId(event.id));
    if (noticeIndex >= 0) {
      const notice = newState.pendingEvents[noticeIndex];
      newState = {
        ...newState,
        phase: 'event',
        actionsLeft: 0,
        currentEvent: notice,
        pendingEvents: newState.pendingEvents.filter((_event, index) => index !== noticeIndex),
        eventHistory: {
          ...newState.eventHistory,
          triggered: [...new Set([...newState.eventHistory.triggered, notice.id])],
        },
      };
    }
  }

  const stateWithEndings = checkEndings(newState);
  return checkAchievements(stateWithEndings);
};
