import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { GameState, Card, Advisor, GameEvent } from './types';
import { INITIAL_CARDS, INITIAL_EVENTS } from './data';
import { INITIAL_ADVISORS } from './advisors';
import { MILITARY_AFFAIRS } from './military_affairs';
import { INITIAL_REGIONS } from './regions';
import { JOURNAL_ENTRIES, getJournalEntryDef } from './journal';

const initialJournalState = JOURNAL_ENTRIES.reduce((acc, entry) => {
  acc[entry.id] = { id: entry.id, status: 'active', progress: 0 };
  return acc;
}, {} as Record<string, any>);

export const INITIAL_STATE: GameState = {
  screen: 'start',
  scenario: '1931',
  difficulty: 'normal',
  language: 'en',
  year: 1931,
  month: 4,
  phase: 'event',
  actionsLeft: 2,
  resources: 2,
  armaments: 1,
  dues: 2,
  fundraising_timer: 0,
  propaganda_timer: 0,
  organizations_timer: 0,
  international_relations_timer: 0,
  choose_enemies_timer: 0,
  inter_party_relationships_timer: 0,
  military_policy_timer: 0,
  coupProgress: 0,
  workersAllianceProgress: 0,
  cntVotingRate: 15,
  isPRRevSFormed: false,
  prrevsConstructionLevel: 0,
  isCNTInGovernment: false,
  ateneos_established: 0,
  fijl_established: false,
  mujeres_libres_established: false,
  advisorActionTimer: 0,
  stats: {
    economy: 50,
    armyLoyalty: 60,
    tension: 34,
    workerControl: 10,
    anarchistMilitia: 0,
    republicanAuthority: 50,
    popularFrontUnity: 50,
    pceSupport: 15,
    revolutionaryFervor: 10,
    republican_socialist_coalition_power: 50,
    bureaucratization: 0,
  },
  factions: {
    Treintistas: { influence: 10, dissent: 30 },
    Cenetistas: { influence: 35, dissent: 10 },
    Faistas: { influence: 45, dissent: 15 },
    Puristas: { influence: 10, dissent: 20 },
  },
  classes: {
    Obreros: { support: { CNT_FAI: 35, PSOE: 50, PCE: 5, IR: 5, UR: 0, PS: 0, FE: 0, POUM: 0, AP: 0, CT: 0, RE: 0, DLR: 0, Other: 5 } },
    Braceros: { support: { CNT_FAI: 25, PSOE: 50, PCE: 0, IR: 10, UR: 0, PS: 0, FE: 0, POUM: 0, AP: 0, CT: 0, RE: 0, DLR: 0, Other: 15 } },
    Labradores: { support: { CNT_FAI: 0, PSOE: 0, PCE: 0, IR: 10, UR: 30, PS: 0, FE: 0, POUM: 0, AP: 5, CT: 5, RE: 0, DLR: 0, Other: 50 } },
    Latifundistas: { support: { CNT_FAI: 0, PSOE: 0, PCE: 0, IR: 0, UR: 5, PS: 0, FE: 0, POUM: 0, AP: 35, CT: 35, RE: 25, DLR: 0, Other: 0 } },
    PequenaBurguesia: { support: { CNT_FAI: 0, PSOE: 5, PCE: 0, IR: 45, UR: 35, PS: 0, FE: 0, POUM: 0, AP: 10, CT: 0, RE: 0, DLR: 0, Other: 5 } },
    Intelectuales: { support: { CNT_FAI: 5, PSOE: 20, PCE: 0, IR: 30, UR: 15, PS: 0, FE: 0, POUM: 0, AP: 5, CT: 0, RE: 0, DLR: 20, Other: 5 } },
    Burguesia: { support: { CNT_FAI: 0, PSOE: 0, PCE: 0, IR: 25, UR: 25, PS: 0, FE: 0, POUM: 0, AP: 5, CT: 0, RE: 5, DLR: 25, Other: 15 } },
    Clero: { support: { CNT_FAI: 0, PSOE: 0, PCE: 0, IR: 0, UR: 5, PS: 0, FE: 0, POUM: 0, AP: 35, CT: 25, RE: 5, DLR: 0, Other: 30 } },
  },
  armedForces: {
    regularArmy: { manpower: 100000, loyalty: 50 },
    guardiaNacional: { manpower: 30000, loyalty: 40 },
    guardiaAsalto: { manpower: 30000, loyalty: 70 },
    militias: {
      cntFai: 50000,
      maoc: 10000,
      poum: 5000,
      ugt: 20000,
      requete: 30000,
      falange: 10000,
      africaArmy: 40000,
    },
  },
  government: {
    type: 'Provisional Government',
    typeZh: '临时政府',
    president: 'None',
    presidentZh: '无',
    primeMinister: 'Niceto Alcalá-Zamora',
    primeMinisterZh: '尼塞托·阿尔卡拉-萨莫拉',
  },
  partyRelations: {
    PSOE: 60,
    PCE: 50,
    IR: 50,
    UR: 40,
    PS: 50,
    FE: 30,
    POUM: 50,
    AP: 10,
    CT: 0,
    RE: 0,
    DLR: 30,
    Other: 50,
  },
  domesticPolicy: {
    nationalisation_progress: 0,
    land_reform_progress: 0,
    regional_autonomy_progress: 0,
    max_hours_law: 0,
    min_wage: 0,
    workplace_safety: 0,
    women_suffrage: 0,
    religion_policy: 0,
    abortion_rights: 0,
    education_institutions: 0,
  },
  relations: {
    uk: 50,
    usa: 50,
    france: 50,
    germany: 50,
    italy: 50,
    portugal: 50,
    ussr: 50,
    mexico: 50,
    internationalSocialists: 50,
    syndicalistParty: 0,
  },
  internationalBrigades: 0,
  internationalBrigadesFormed: false,
  militiaCombatPower: 100,
  tankResearchProgress: 0,
  tankResearchCompleted: false,
  aragonCouncilExists: false,
  aragonTimer: 0,
  militiaReorgTimer: 0,
  tankTimer: 0,
  civilWarStatus: 'not_started',
  warProgress: 50,
  leverage: 0,
  ministers: {
    labor: 'Right',
    health: 'Right',
    justice: 'Right',
    industry: 'Right',
    interior: 'Right',
    war: 'Right',
  },
  popularFrontUnity: 50,
  popularFrontFactions: {
    pce: 20,
    psoe: 40,
    ir: 30,
    ur: 10,
  },
  superEvent: null,
  pendingEvents: [],
  treintistasLeft: false,
  commercialized_propaganda: 0,
  campaign_propaganda: 0,
  ideological_propaganda: 0,
  radio: 0,
  cinema: 0,
  socialism: 0,
  nationalism: 0,
  pacifism: 0,
  democratization: 0,
  pro_republic: 0,
  francoStatus: 'alive',
  africaArmyStatus: 'neutral',
  cataloniaControl: 'republic',
  navyStatus: 'neutral',
  moscowGoldTransferred: false,
  cntFaiInGovernment: false,
  pceInPower: false,
  pceAcceptsComintern: false,
  cnt_boycott_election: false,
  cnt_participate_election: false,
  ps_founded: false,
  fe_founded: false,
  poum_founded: false,
  falange_jons: false,
  durrutiAlive: true,
  sanjurjoStatus: 'alive',
  francoAfricaControl: false,
  cataloniaIndependent: false,
  hasArmoredCars: false,
  regions: INITIAL_REGIONS,
  womensRightsReformed: false,
  internationalBrigadesArrived: false,
  educationSecularized: false,
  covert_ops_france: 0,
  covert_ops_portugal: 0,
  isGameOver: false,
  ending: null,
  unlockedAchievementsThisRun: [],
  journal: initialJournalState,
  activeAdvisors: [null, null, null],
  advisorPool: INITIAL_ADVISORS,
  currentEvent: null,
  hand: [],
  actionDeck: INITIAL_CARDS.filter(c => c.type === 'Action'),
  governmentDeck: INITIAL_CARDS.filter(c => c.type === 'Government'),
  militaryDeck: INITIAL_CARDS.filter(c => c.type === 'Military'),
  discard: [],
};

interface GameContextType {
  state: GameState;
  dispatch: (action: GameAction) => void;
}

type GameAction =
  | { type: 'START_GAME'; payload: { scenario: '1931' | '1933' | '1936'; difficulty: 'easy' | 'normal' | 'hard' | 'historical' | 'sandbox' } }
  | { type: 'RETURN_TO_START' }
  | { type: 'NEXT_PHASE' }
  | { type: 'PLAY_CARD'; payload: Card }
  | { type: 'RESOLVE_EVENT'; payload: (state: GameState) => Partial<GameState> }
  | { type: 'DISMISS_SUPER_EVENT' }
  | { type: 'SELECT_EVENT'; payload: { eventId: string } }
  | { type: 'ADD_ADVISOR'; payload: { advisor: Advisor; slotIndex: number } }
  | { type: 'REMOVE_ADVISOR'; payload: { slotIndex: number } }
  | { type: 'DRAW_CARD'; payload: 'Action' | 'Governmental' | 'Military' }
  | { type: 'CHECK_EVENT' }
  | { type: 'SET_LANGUAGE'; payload: 'en' | 'zh' }
  | { type: 'LOAD_STATE'; payload: GameState }
  | { type: 'DEBUG_TRIGGER_ENDING'; payload: string }
  | { type: 'SANDBOX_EDIT'; payload: Partial<GameState> };

const GameContext = createContext<GameContextType | undefined>(undefined);

import { checkEndings } from './endings';
import { checkAchievements } from './achievements';

const gameReducer = (state: GameState, action: GameAction): GameState => {
  let newState = state;
  switch (action.type) {
    case 'START_GAME': {
      let startYear = 1931;
      let startMonth = 4;
      let startCivilWarStatus: 'not_started' | 'ongoing' = 'not_started';
      let psFounded = false;
      let feFounded = false;

      if (action.payload.scenario === '1933') {
        startYear = 1933;
        startMonth = 11;
        feFounded = true;
      } else if (action.payload.scenario === '1936') {
        startYear = 1936;
        startMonth = 7;
        startCivilWarStatus = 'ongoing';
        psFounded = true;
        feFounded = true;
      }

      let initialResources = 2;
      let initialArmaments = 1;
      if (action.payload.difficulty === 'easy' || action.payload.difficulty === 'sandbox') {
        initialResources = 3;
        initialArmaments = 2;
      }

      const startingEvents = INITIAL_EVENTS.filter(e => {
        const dateMatch = e.date?.year === startYear && e.date?.month === startMonth;
        const conditionMatch = e.condition ? e.condition({ 
          ...INITIAL_STATE, 
          year: startYear, 
          month: startMonth, 
          civilWarStatus: startCivilWarStatus 
        }) : false;
        
        if (e.date) return dateMatch;
        return conditionMatch;
      });

      newState = { 
        ...INITIAL_STATE, 
        language: state.language, 
        screen: 'game',
        scenario: action.payload.scenario,
        difficulty: action.payload.difficulty,
        resources: initialResources,
        armaments: initialArmaments,
        year: startYear,
        month: startMonth,
        ps_founded: psFounded,
        fe_founded: feFounded,
        poum_founded: action.payload.scenario === '1936',
        civilWarStatus: startCivilWarStatus,
        pendingEvents: startingEvents,
        superEvent: action.payload.scenario === '1931' ? 'abdication_alfonso' : (action.payload.scenario === '1936' ? 'spanish_civil_war' : null),
      };
      break;
    }
    case 'RETURN_TO_START':
      newState = { ...state, screen: 'start' };
      break;
    case 'SET_LANGUAGE':
      newState = { ...state, language: action.payload };
      break;
    case 'LOAD_STATE': {
      const hydrateCards = (cards: Card[]) => {
        return cards.map(c => {
          const original = INITIAL_CARDS.find(ic => ic.id === c.id);
          return original ? { ...c, effect: original.effect, condition: original.condition } : c;
        });
      };

      const hydrateAdvisors = (advisors: (Advisor | null)[]) => {
        return advisors.map(a => {
          if (!a) return null;
          const original = INITIAL_ADVISORS.find(ia => ia.id === a.id);
          if (!original) return a;
          return {
            ...a,
            actions: a.actions.map(action => {
              const originalAction = original.actions.find(oa => oa.id === action.id);
              return originalAction ? { ...action, condition: originalAction.condition, effect: originalAction.effect } : action;
            })
          };
        });
      };

      const hydrateEvents = (events: GameEvent[]) => {
        return events.map(e => {
          const original = INITIAL_EVENTS.find(ie => ie.id === e.id);
          if (!original) return e;
          return {
            ...e,
            condition: original.condition,
            options: e.options.map((opt, idx) => {
              const originalOpt = original.options[idx];
              return originalOpt ? { ...opt, condition: originalOpt.condition, effect: originalOpt.effect } : opt;
            })
          };
        });
      };

      newState = { 
        ...action.payload, 
        screen: 'game',
        hand: hydrateCards(action.payload.hand || []),
        actionDeck: hydrateCards(action.payload.actionDeck || []),
        governmentDeck: hydrateCards(action.payload.governmentDeck || []),
        militaryDeck: hydrateCards(action.payload.militaryDeck || []),
        discard: hydrateCards(action.payload.discard || []),
        activeAdvisors: hydrateAdvisors(action.payload.activeAdvisors || [null, null, null]),
        advisorPool: hydrateAdvisors(action.payload.advisorPool || []) as Advisor[],
        pendingEvents: hydrateEvents(action.payload.pendingEvents || []),
        currentEvent: action.payload.currentEvent ? hydrateEvents([action.payload.currentEvent])[0] : null,
      };
      break;
    }
    case 'DEBUG_TRIGGER_ENDING':
      newState = { ...state, isGameOver: true, ending: action.payload };
      break;
    case 'SANDBOX_EDIT':
      if (state.difficulty === 'sandbox') {
        newState = { ...state, ...action.payload };
      }
      break;
    case 'NEXT_PHASE':
      if (state.phase === 'event') {
        newState = { ...state, phase: 'action', actionsLeft: 2 };
      } else {
        // Next month
        let nextMonth = state.month + 1;
        let nextYear = state.year;
        if (nextMonth > 12) {
          nextMonth = 1;
          nextYear++;
        }
        
        // Discard remaining hand at end of turn
        const newDiscard = [...state.discard, ...state.hand];
        
        // Calculate periodic income
        // Base income + bonus from worker control (collectivization)
        const resourceIncome = 1 + Math.floor(state.stats.workerControl / 20);
        // Base armament income
        const armamentIncome = 1;
        
        // International Brigades Logic
        let newIntBrigades = state.internationalBrigades;
        let newIntBrigadesFormed = state.internationalBrigadesFormed;

        if (state.civilWarStatus !== 'not_started' && state.relations.internationalSocialists > 60) {
          newIntBrigadesFormed = true;
        }

        if (newIntBrigadesFormed) {
          let baseIncrease = 1000;
          if (state.difficulty === 'easy' || state.difficulty === 'sandbox') baseIncrease = 2000;
          else if (state.difficulty === 'hard') baseIncrease = 500;

          let bonusIncrease = 0;
          if (state.relations.internationalSocialists > 80) bonusIncrease = 750;
          else if (state.relations.internationalSocialists > 60) bonusIncrease = 250;

          newIntBrigades += baseIncrease + bonusIncrease;
        }
        
        let newPendingEvents = [...state.pendingEvents];
        let newSuperEvent = state.superEvent;
        let newCivilWarStatus = state.civilWarStatus;

        // Check Civil War Trigger
        if (newCivilWarStatus === 'not_started') {
          const isHistoricalTrigger = nextYear === 1936 && nextMonth === 7;
          const isTensionTrigger = state.stats.tension >= 100;
          
          if (isHistoricalTrigger || isTensionTrigger) {
            newSuperEvent = 'spanish_civil_war';
            newCivilWarStatus = 'ongoing';
          }
        }

        // Region control decay before civil war
        let updatedRegions = { ...state.regions };
        if (newCivilWarStatus === 'not_started') {
          Object.keys(updatedRegions).forEach(id => {
            updatedRegions[id] = {
              ...updatedRegions[id],
              control: Math.max(0, updatedRegions[id].control - 1)
            };
          });
        }

        // Add other regular events based on date or condition
        let monthlyEvents = INITIAL_EVENTS.filter(e => {
          // Skip if already pending or current
          if (state.pendingEvents.some(pe => pe.id === e.id)) return false;
          if (state.currentEvent?.id === e.id) return false;

          const dateMatch = e.date ? (e.date.year === nextYear && e.date.month === nextMonth) : false;
          const conditionMatch = e.condition ? e.condition({ 
            ...state, 
            month: nextMonth, 
            year: nextYear, 
            civilWarStatus: newCivilWarStatus,
            regions: updatedRegions 
          }) : false;
          
          if (e.date) return dateMatch;
          return conditionMatch;
        });

        if (state.difficulty === 'historical') {
          const hasHistoricalEvent = monthlyEvents.some(e => e.date);
          if (hasHistoricalEvent) {
            monthlyEvents = monthlyEvents.filter(e => e.date);
          }
        }

        newPendingEvents = [...newPendingEvents, ...monthlyEvents];
        
        let tempState = {
          ...state,
          month: nextMonth,
          year: nextYear,
          civilWarStatus: newCivilWarStatus,
          regions: updatedRegions,
          resources: state.resources + resourceIncome,
          armaments: state.armaments + armamentIncome,
          internationalBrigades: newIntBrigades,
          internationalBrigadesFormed: newIntBrigadesFormed,
        };

        let newJournal = JSON.parse(JSON.stringify(state.journal || {}));

        Object.keys(newJournal).forEach(journalId => {
          const entryState = newJournal[journalId];
          const def = getJournalEntryDef(journalId);
          if (def && entryState.status === 'active' && def.activeEffect?.apply) {
             const effectResult = def.activeEffect.apply(tempState);
             tempState = { ...tempState, ...effectResult };
          }
        });

        Object.keys(newJournal).forEach(journalId => {
          const entryState = newJournal[journalId];
          const def = getJournalEntryDef(journalId);
          if (def && def.checkStatus) {
            const newStatus = def.checkStatus(tempState, entryState);
            if (newStatus && newStatus !== entryState.status) {
              entryState.status = newStatus;
              if (newStatus === 'completed' && def.onComplete) {
                const effectResult = def.onComplete(tempState);
                tempState = { ...tempState, ...effectResult };
              } else if (newStatus === 'failed' && def.onFail) {
                const effectResult = def.onFail(tempState);
                tempState = { ...tempState, ...effectResult };
              }
            }
          }
        });

        newState = {
          ...state,
          ...tempState,
          phase: 'event',
          actionsLeft: 0,
          journal: newJournal,
          fundraising_timer: Math.max(0, state.fundraising_timer - 1),
          organizations_timer: Math.max(0, state.organizations_timer - 1),
          international_relations_timer: Math.max(0, state.international_relations_timer - 1),
          choose_enemies_timer: Math.max(0, state.choose_enemies_timer - 1),
          inter_party_relationships_timer: Math.max(0, state.inter_party_relationships_timer - 1),
          military_policy_timer: Math.max(0, state.military_policy_timer - 1),
          advisorActionTimer: Math.max(0, state.advisorActionTimer - 1),
          aragonTimer: Math.max(0, state.aragonTimer - 1),
          militiaReorgTimer: Math.max(0, state.militiaReorgTimer - 1),
          tankTimer: Math.max(0, state.tankTimer - 1),
          propaganda_timer: Math.max(0, state.propaganda_timer - 1),
          internationalBrigades: newIntBrigades,
          internationalBrigadesFormed: newIntBrigadesFormed,
          superEvent: newSuperEvent,
          pendingEvents: newPendingEvents,
          civilWarStatus: newCivilWarStatus,
          hand: [],
          discard: newDiscard,
        };
      }
      break;
    case 'PLAY_CARD': {
      if (state.actionsLeft <= 0) return state;
      const cardPayload = action.payload;
      // Find the original card definition to ensure functions (effect, condition) exist
      const card = INITIAL_CARDS.find(c => c.id === cardPayload.id) || cardPayload;
      
      if (typeof card.effect !== 'function') {
        console.error(`Card ${card.id} has no effect function`, card);
        return state;
      }

      // Check resource costs
      if (card.resourceCost !== undefined && state.resources < card.resourceCost) return state;
      if (card.armamentCost !== undefined && state.armaments < card.armamentCost) return state;
      if (card.condition !== undefined && !card.condition(state)) return state;
      
      const stateBeforeCard = JSON.parse(JSON.stringify(state));
      let newStateAfterCard = card.effect(state);
      
      if (state.difficulty === 'easy') {
        if (!newStateAfterCard.currentEvent) {
          newStateAfterCard = {
            currentEvent: {
              id: `${card.id}_easy_event`,
              title: card.title,
              titleZh: card.titleZh,
              description: card.description,
              descriptionZh: card.descriptionZh,
              options: [
                {
                  text: 'Apply Effect',
                  textZh: '应用效果',
                  effect: () => {
                    const originalCard = INITIAL_CARDS.find(c => c.id === cardPayload.id) || cardPayload;
                    return originalCard.effect(state);
                  }
                }
              ]
            }
          };
        }
        
        // Deep copy the event to avoid mutating the original card definition
        newStateAfterCard.currentEvent = {
          ...newStateAfterCard.currentEvent,
          options: [
            ...newStateAfterCard.currentEvent.options,
            {
              text: 'Return card to hand (Refund costs)',
              textZh: '将卡牌放回手牌 (返还消耗)',
              effect: () => {
                return stateBeforeCard;
              }
            }
          ]
        };
      }
      
      newState = {
        ...state,
        ...newStateAfterCard,
        actionsLeft: state.actionsLeft - card.cost,
        resources: state.resources - (card.resourceCost || 0),
        armaments: state.armaments - (card.armamentCost || 0),
        hand: state.hand.filter((c) => c.id !== cardPayload.id),
        discard: [...state.discard, cardPayload],
      };
      break;
    }
    case 'DISMISS_SUPER_EVENT':
      newState = { ...state, superEvent: null };
      break;
    case 'SELECT_EVENT': {
      const selectedEvent = state.pendingEvents.find(e => e.id === action.payload.eventId);
      if (selectedEvent) {
        newState = {
          ...state,
          currentEvent: selectedEvent,
          pendingEvents: state.pendingEvents.filter(e => e.id !== action.payload.eventId)
        };
      }
      break;
    }
    case 'RESOLVE_EVENT':
      const newStateAfterEvent = action.payload(state);
      
      let nextCurrentEvent = null;
      if (newStateAfterEvent.currentEvent) {
        nextCurrentEvent = newStateAfterEvent.currentEvent;
      }
      
      newState = {
        ...state,
        ...newStateAfterEvent,
        currentEvent: nextCurrentEvent,
      };
      
      // If no current event and no pending events, move to action phase automatically if we were in event phase
      if (!newState.currentEvent && newState.pendingEvents.length === 0 && newState.phase === 'event') {
        newState.phase = 'action';
        newState.actionsLeft = 2;
      }
      break;
    case 'ADD_ADVISOR': {
      const { advisor, slotIndex } = action.payload;
      const newActive = [...state.activeAdvisors];
      const oldAdvisor = newActive[slotIndex];
      newActive[slotIndex] = advisor;
      
      let newPool = state.advisorPool.filter((a) => a.id !== advisor.id);
      if (oldAdvisor) {
        newPool.push(oldAdvisor);
      }
      newState = { ...state, activeAdvisors: newActive, advisorPool: newPool };
      break;
    }
    case 'REMOVE_ADVISOR': {
      const { slotIndex } = action.payload;
      const newActive = [...state.activeAdvisors];
      const oldAdvisor = newActive[slotIndex];
      if (!oldAdvisor) return state;
      
      newActive[slotIndex] = null;
      newState = {
        ...state,
        activeAdvisors: newActive,
        advisorPool: [...state.advisorPool, oldAdvisor],
      };
      break;
    }
    case 'DRAW_CARD': {
      const handLimit = state.difficulty === 'hard' ? 3 : 4;
      if (state.hand.length >= handLimit) return state;
      const cardType = action.payload;
      
      let sourceDeck: Card[] = [];
      if (cardType === 'Action') sourceDeck = state.actionDeck;
      else if (cardType === 'Governmental') sourceDeck = state.governmentDeck;
      else if (cardType === 'Military') sourceDeck = state.militaryDeck;

      let availableCards = sourceDeck.filter(c => c.condition ? c.condition(state) : true);
      
      let newActionDeck = [...state.actionDeck];
      let newGovDeck = [...state.governmentDeck];
      let newMilDeck = [...state.militaryDeck];
      let newDiscard = [...state.discard];
      
      if (availableCards.length === 0) {
        // Shuffle ALL discarded cards of this type back into the deck
        const allDiscardedOfType = state.discard.filter(c => {
          if (cardType === 'Governmental') return c.type === 'Government';
          return c.type === cardType;
        });
        if (allDiscardedOfType.length === 0) return state; 
        
        if (cardType === 'Action') {
          newActionDeck = [...newActionDeck, ...allDiscardedOfType];
          sourceDeck = newActionDeck;
        } else if (cardType === 'Governmental') {
          newGovDeck = [...newGovDeck, ...allDiscardedOfType];
          sourceDeck = newGovDeck;
        } else if (cardType === 'Military') {
          newMilDeck = [...newMilDeck, ...allDiscardedOfType];
          sourceDeck = newMilDeck;
        }
        newDiscard = newDiscard.filter(c => {
          if (cardType === 'Governmental') return c.type !== 'Government';
          return c.type !== cardType;
        });
        
        // Now check available cards again
        availableCards = sourceDeck.filter(c => c.condition ? c.condition(state) : true);
        if (availableCards.length === 0) return state; 
      }
      
      const randomIndex = Math.floor(Math.random() * availableCards.length);
      const drawnCard = availableCards[randomIndex];
      
      if (cardType === 'Action') newActionDeck = newActionDeck.filter(c => c.id !== drawnCard.id);
      else if (cardType === 'Governmental') newGovDeck = newGovDeck.filter(c => c.id !== drawnCard.id);
      else if (cardType === 'Military') newMilDeck = newMilDeck.filter(c => c.id !== drawnCard.id);
      
      newState = {
        ...state,
        hand: [...state.hand, drawnCard],
        actionDeck: newActionDeck,
        governmentDeck: newGovDeck,
        militaryDeck: newMilDeck,
        discard: newDiscard
      };
      break;
    }
    case 'CHECK_EVENT': {
      if (state.pendingEvents.length > 0) {
        // We have pending events, so we stay in event phase. The UI will show the Event Board.
        newState = { ...state };
      } else {
        // If no events, skip to action phase
        newState = { ...state, phase: 'action', actionsLeft: 2 };
      }
      break;
    }
    default:
      newState = state;
  }
  
  // Normalize values to prevent overflow/underflow (0-100)
  if (newState !== state) {
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
    }
    if (newState.stats) {
      Object.keys(newState.stats).forEach(s => {
        const stat = s as keyof typeof newState.stats;
        newState.stats[stat] = Math.max(0, Math.min(100, newState.stats[stat]));
      });
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
    if (newState.armedForces) {
      if (newState.armedForces.regularArmy) {
        newState.armedForces.regularArmy.loyalty = Math.max(0, Math.min(100, newState.armedForces.regularArmy.loyalty));
      }
      if (newState.armedForces.guardiaNacional) {
        newState.armedForces.guardiaNacional.loyalty = Math.max(0, Math.min(100, newState.armedForces.guardiaNacional.loyalty));
      }
      if (newState.armedForces.guardiaAsalto) {
        newState.armedForces.guardiaAsalto.loyalty = Math.max(0, Math.min(100, newState.armedForces.guardiaAsalto.loyalty));
      }
    }
    
    // Dynamically calculate tension
    if (newState.stats) {
      const { republicanAuthority, armyLoyalty, revolutionaryFervor } = newState.stats;
      newState.stats.tension = Math.max(0, Math.min(100, 
        (100 - republicanAuthority) * 0.3 + 
        (100 - armyLoyalty) * 0.4 + 
        revolutionaryFervor * 0.3
      ));
    }
  }

  const stateWithEndings = checkEndings(newState);
  return checkAchievements(stateWithEndings);
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<GameState>(INITIAL_STATE);

  const dispatch = (action: GameAction) => {
    setState((prevState) => gameReducer(prevState, action));
  };

  // Game loop effects
  useEffect(() => {
    if (state.phase === 'event' && !state.currentEvent) {
      dispatch({ type: 'CHECK_EVENT' });
    }
  }, [state.phase, state.month, state.year, state.currentEvent]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
