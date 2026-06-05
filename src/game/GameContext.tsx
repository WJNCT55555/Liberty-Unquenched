import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { GameState, Card, Advisor, GameEvent } from './types';
import { INITIAL_CARDS, INITIAL_EVENTS } from './data';
import { INITIAL_ADVISORS } from './advisors';
import { MILITARY_AFFAIRS } from './military_affairs';
import { INITIAL_REGIONS } from '../components/map/regions';
import { JOURNAL_ENTRIES, getJournalEntryDef } from './journal';

const initialJournalState = JOURNAL_ENTRIES.reduce((acc, entry) => {
  acc[entry.id] = { 
    id: entry.id, 
    status: 'inactive', 
    progress: 0,
    ...(entry.id === 'journal_land_reform' ? { failureProgress: 0 } : {})
  };
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
  agricultural_policy_timer: 0,
  labor_rights_timer: 0,
  labor_affairs_timer: 0,
  fiscal_policy_timer: 0,
  finance_minister_party: 'Right',
  coupProgress: 0,
  economy_growth: 2.5,
  inflation_rate: 3.5,
  unemployment_rate: 11.2,
  economyHistory: [
    { year: 1930, month: 10, growth: 2.1, inflation: 3.1, unemployment: 10.5 },
    { year: 1930, month: 11, growth: 2.3, inflation: 3.2, unemployment: 10.7 },
    { year: 1930, month: 12, growth: 2.2, inflation: 3.4, unemployment: 10.9 },
    { year: 1931, month: 1, growth: 2.4, inflation: 3.3, unemployment: 11.0 },
    { year: 1931, month: 2, growth: 2.5, inflation: 3.6, unemployment: 11.1 },
    { year: 1931, month: 3, growth: 2.5, inflation: 3.5, unemployment: 11.2 }
  ],
  budget: 12.0,
  tax_lower_class: 5,
  tax_middle_class: 15,
  tax_upper_class: 25,
  tax_tariff: 10,
  tax_consumption: 8,
  gold_reserves: 2200,
  foreign_exchange: 180,
  public_debt: 500,
  war_bonds: 0,
  military_spending: 15,
  land_reform_compensation: 100,
  workersAllianceProgress: 0,
  cntVotingRate: 15,
  isPRRevSFormed: false,
  prrevs_formed_months: 0,
  prrevsConstructionLevel: 0,
  isCNTInGovernment: false,
  sandboxCardChoiceEnabled: false,
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
    Jabalistas: { influence: 0, dissent: 0 },
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
    land_reform_law_enabled: false,
    mixed_jury_law_enabled: false,
    mixed_jury_cnt_opposed: false,
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
  agriculture_minister_party: 'Right',
  labor_minister_party: 'Right',
  ministers: {
    labor: 'Right',
    health: 'Right',
    justice: 'Right',
    industry: 'Right',
    interior: 'Right',
    war: 'Right',
    agriculture: 'Right',
    finance: 'Right',
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
  advisorPool: INITIAL_ADVISORS.filter(a => a.id !== 'Ramón Franco'),
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
  | { type: 'DRAW_SPECIFIC_CARD'; payload: { cardId: string; deckType: 'Action' | 'Governmental' | 'Military' } }
  | { type: 'CHECK_EVENT' }
  | { type: 'SET_LANGUAGE'; payload: 'en' | 'zh' }
  | { type: 'LOAD_STATE'; payload: GameState }
  | { type: 'UPDATE_TAXES'; payload: { tax_lower_class?: number; tax_middle_class?: number; tax_upper_class?: number; tax_tariff?: number; tax_consumption?: number; military_spending?: number; land_reform_compensation?: number } }
  | { type: 'SELL_GOLD_FOR_FX' }
  | { type: 'ISSUE_WAR_BONDS' }
  | { type: 'BUY_RESOURCES_URGENT' }
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
      
      let start_growth = 2.5;
      let start_inflation = 3.5;
      let start_unemployment = 11.2;
      let start_budget = 12.0;
      let start_gold = 2200;
      let start_fx = 180;
      let start_debt = 500;
      let start_bonds = 0;
      let start_mil_spend = 15;
      let start_land_comp = 100;

      if (action.payload.scenario === '1931') {
        startYear = 1931;
        startMonth = 4;
        start_growth = 1.2;
        start_inflation = 1.4;
        start_unemployment = 14.5;
        start_budget = 10.0;
        start_gold = 2200;
        start_fx = 180;
        start_debt = 500;
        start_bonds = 0;
        start_mil_spend = 15;
        start_land_comp = 100;
      } else if (action.payload.scenario === '1933') {
        startYear = 1933;
        startMonth = 11;
        feFounded = true;
        start_growth = 2.1;
        start_inflation = 2.5;
        start_unemployment = 18.2;
        start_budget = 8.0;
        start_gold = 2100;
        start_fx = 140;
        start_debt = 750;
        start_bonds = 0;
        start_mil_spend = 12;
        start_land_comp = 50;
      } else if (action.payload.scenario === '1936') {
        startYear = 1936;
        startMonth = 7;
        startCivilWarStatus = 'ongoing';
        psFounded = true;
        feFounded = true;
        start_growth = 3.5;
        start_inflation = 5.8;
        start_unemployment = 12.0;
        start_budget = 15.0;
        start_gold = 1800;
        start_fx = 90;
        start_debt = 1100;
        start_bonds = 150;
        start_mil_spend = 40;
        start_land_comp = 10;
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

      const initialHistory = [];
      let tempY = startYear;
      let tempM = startMonth;
      for (let i = 0; i < 6; i++) {
        tempM--;
        if (tempM <= 0) {
          tempM = 12;
          tempY--;
        }
        initialHistory.unshift({
          year: tempY,
          month: tempM,
          growth: parseFloat((start_growth * (0.9 + Math.random() * 0.2)).toFixed(2)),
          inflation: parseFloat((start_inflation * (0.9 + Math.random() * 0.2)).toFixed(2)),
          unemployment: parseFloat((start_unemployment * (0.95 + Math.random() * 0.1)).toFixed(2)),
        });
      }

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
        economy_growth: start_growth,
        inflation_rate: start_inflation,
        unemployment_rate: start_unemployment,
        economyHistory: initialHistory,
        budget: start_budget,
        gold_reserves: start_gold,
        foreign_exchange: start_fx,
        public_debt: start_debt,
        war_bonds: start_bonds,
        military_spending: start_mil_spend,
        land_reform_compensation: start_land_comp,
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
    case 'UPDATE_TAXES':
      newState = {
        ...state,
        tax_lower_class: action.payload.tax_lower_class !== undefined ? Math.max(1, Math.min(100, action.payload.tax_lower_class)) : state.tax_lower_class,
        tax_middle_class: action.payload.tax_middle_class !== undefined ? Math.max(1, Math.min(100, action.payload.tax_middle_class)) : state.tax_middle_class,
        tax_upper_class: action.payload.tax_upper_class !== undefined ? Math.max(1, Math.min(100, action.payload.tax_upper_class)) : state.tax_upper_class,
        tax_tariff: action.payload.tax_tariff !== undefined ? Math.max(1, Math.min(100, action.payload.tax_tariff)) : state.tax_tariff,
        tax_consumption: action.payload.tax_consumption !== undefined ? Math.max(1, Math.min(100, action.payload.tax_consumption)) : state.tax_consumption,
        military_spending: action.payload.military_spending !== undefined ? Math.max(5, Math.min(100, action.payload.military_spending)) : (state.military_spending !== undefined ? state.military_spending : 15),
        land_reform_compensation: action.payload.land_reform_compensation !== undefined ? Math.max(0, Math.min(100, action.payload.land_reform_compensation)) : (state.land_reform_compensation !== undefined ? state.land_reform_compensation : 100),
      };
      break;
    case 'SELL_GOLD_FOR_FX':
      if ((state.gold_reserves ?? 2200) >= 100) {
        newState = {
          ...state,
          gold_reserves: (state.gold_reserves ?? 2200) - 100,
          foreign_exchange: (state.foreign_exchange ?? 180) + 100,
          inflation_rate: state.inflation_rate + 1.5,
        };
      }
      break;
    case 'ISSUE_WAR_BONDS':
      newState = {
        ...state,
        budget: state.budget + 50.0,
        foreign_exchange: (state.foreign_exchange ?? 180) + 10.0,
        public_debt: (state.public_debt ?? 500) + 60.0,
        war_bonds: (state.war_bonds ?? 0) + 50.0,
        inflation_rate: state.inflation_rate + 1.2,
      };
      break;
    case 'BUY_RESOURCES_URGENT':
      if ((state.foreign_exchange ?? 180) >= 25.0) {
        newState = {
          ...state,
          foreign_exchange: (state.foreign_exchange ?? 180) - 25.0,
          resources: state.resources + 2,
          armaments: state.armaments + 1,
        };
      }
      break;
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
          
          let tensionThreshold = 80; // Default for normal / historical
          if (state.difficulty === 'easy' || state.difficulty === 'sandbox') {
            tensionThreshold = 95;
          } else if (state.difficulty === 'hard') {
            tensionThreshold = 70;
          }
          
          const isTensionTrigger = state.stats.tension >= tensionThreshold;
          
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
            regions: updatedRegions,
            prrevs_formed_months: state.isPRRevSFormed ? state.prrevs_formed_months + 1 : 0
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
          prrevs_formed_months: state.isPRRevSFormed ? state.prrevs_formed_months + 1 : 0,
        };

        // --- Core Economic Monthly Simulation ---
        const taxLowerRate = (tempState.tax_lower_class !== undefined ? tempState.tax_lower_class : 5) / 100;
        const taxMiddleRate = (tempState.tax_middle_class !== undefined ? tempState.tax_middle_class : 15) / 100;
        const taxUpperRate = (tempState.tax_upper_class !== undefined ? tempState.tax_upper_class : 25) / 100;
        const taxTarRate = (tempState.tax_tariff !== undefined ? tempState.tax_tariff : 10) / 100;
        const taxConsRate = (tempState.tax_consumption !== undefined ? tempState.tax_consumption : 8) / 100;

        const isCivilWar = tempState.civilWarStatus === 'ongoing';
        const compRateVal = (tempState.land_reform_compensation !== undefined ? tempState.land_reform_compensation : 100) / 100;
        const milSpendVal = tempState.military_spending !== undefined ? tempState.military_spending : 15;

        // 1. Budget Balance (Revenue - Expenditures)
        // Weighted contributions by class to total income tax revenue
        const incomeTaxRev = (taxLowerRate * 4.0) + (taxMiddleRate * 3.5) + (taxUpperRate * 4.5);
        const tariffRev = taxTarRate * (isCivilWar ? 2.0 : 5.0);
        const consumptionTaxRev = taxConsRate * 8.0;
        const totalTaxRev = incomeTaxRev + tariffRev + consumptionTaxRev;

        // Monthly Expenditures: Basic administration, plus social and military parameters
        let monthlyExpenditures = 1.0; // Basic civil administration
        if (tempState.domesticPolicy.max_hours_law > 0) {
          monthlyExpenditures += 0.3;
        }
        if (tempState.domesticPolicy.min_wage > 0) {
          monthlyExpenditures += 0.2;
        }
        if (isCivilWar) {
          monthlyExpenditures += 3.5; // War efforts drain
        }

        // Active military expenditures (ranges from 0.15 to 3.0 during peacetime, up to 8.0 wartime)
        const milExpenditures = (milSpendVal / 100) * (isCivilWar ? 8.0 : 3.0);
        monthlyExpenditures += milExpenditures;

        // Public Debt sovereign interest (2% peacetime, 5% wartime annually)
        const currentDebt = tempState.public_debt !== undefined ? tempState.public_debt : 500.0;
        const interestRate = (isCivilWar ? 0.05 : 0.02) / 12;
        const debtInterestCost = currentDebt * interestRate;
        monthlyExpenditures += debtInterestCost;

        // Legislative expenditures for Land Reform Compensation
        const landCompCost = tempState.domesticPolicy.land_reform_law_enabled ? (compRateVal * 0.4) : 0.0;
        monthlyExpenditures += landCompCost;

        const budgetDelta = totalTaxRev - monthlyExpenditures;
        const newBudgetVal = parseFloat(((tempState.budget !== undefined ? tempState.budget : 12.0) + budgetDelta).toFixed(2));
        tempState.budget = Math.max(-100, Math.min(100, newBudgetVal));

        // 2. Sovereign Public Debt Accrual & Paydown
        let nextDebt = currentDebt;
        if (budgetDelta < 0) {
          nextDebt += Math.abs(budgetDelta);
        } else {
          const autoPay = Math.min(budgetDelta * 0.4, currentDebt);
          nextDebt -= autoPay;
        }
        tempState.public_debt = parseFloat(Math.max(0, Math.min(5000, nextDebt)).toFixed(2));

        // 3. Trade FX generation (export income minus imports and inflation impacts)
        const tradeFxYield = (tempState.economy_growth - 2.5) * 1.5 - (tempState.inflation_rate - 3.5) * 0.5 + (taxTarRate * 4.0) - (isCivilWar ? 2.5 : 0.0);
        const nextFx = (tempState.foreign_exchange !== undefined ? tempState.foreign_exchange : 180.0) + tradeFxYield;
        tempState.foreign_exchange = parseFloat(Math.max(0, Math.min(2500, nextFx)).toFixed(2));

        // 4. Arms Generation & Army Loyalty based on Military Spending
        const monthlyArmamentsYield = (milSpendVal / 15) * 0.15 * (isCivilWar ? 2.5 : 1.0);
        tempState.armaments = parseFloat((tempState.armaments + monthlyArmamentsYield).toFixed(2));

        const milLoyaltyFactor = (milSpendVal - 15) * 0.12;
        const newArmyLoyalty = Math.max(0, Math.min(100, (tempState.stats.armyLoyalty !== undefined ? tempState.stats.armyLoyalty : 50) + milLoyaltyFactor));

        let extraCoupRise = 0;
        if (newArmyLoyalty < 40) {
          extraCoupRise += (40 - newArmyLoyalty) * 0.08;
        }

        // Adjust landowner class tension / reaction from expropriation (low compensation)
        if (tempState.domesticPolicy.land_reform_law_enabled) {
          if (compRateVal < 0.35) {
            extraCoupRise += 0.4;
            tempState.stats.tension = Math.max(0, Math.min(100, tempState.stats.tension + 0.3));
          } else if (compRateVal > 0.85) {
            extraCoupRise -= 0.2;
          }
        }

        if (extraCoupRise !== 0) {
          tempState.coupProgress = parseFloat(Math.max(0, Math.min(100, tempState.coupProgress + extraCoupRise)).toFixed(2));
        }

        // 5. Economic Growth Rate (clamped to 1% to 100%)
        const econFactor = ((tempState.stats.economy !== undefined ? tempState.stats.economy : 50) - 50) / 15;
        const debtGrowthDrag = Math.max(0, (nextDebt - 1200) * 0.001); // high public debt curbs growth
        let nextGrowth = 3.5 - (taxLowerRate * 1.5) - (taxMiddleRate * 2.0) - (taxUpperRate * 2.5) - (taxTarRate * 3.0) - (taxConsRate * 3.5) + econFactor - debtGrowthDrag;
        if (isCivilWar) {
          nextGrowth -= 6.0;
        }
        tempState.economy_growth = parseFloat(Math.max(1, Math.min(100, nextGrowth)).toFixed(2));

        // 6. Inflation Rate with Gold reserves backing impact (if gold is low, currency loses backing)
        const goldLossConfidence = Math.max(0, (700 - (tempState.gold_reserves !== undefined ? tempState.gold_reserves : 2200)) * 0.006);
        let deficitInflation = 0;
        if (budgetDelta < 0) {
          deficitInflation = Math.abs(budgetDelta) * 0.5;
        }
        let nextInflation = 2.5 - (taxLowerRate * 1.0) - (taxMiddleRate * 1.5) - (taxUpperRate * 2.0) + (taxTarRate * 8.0) + (taxConsRate * 6.0) + deficitInflation + goldLossConfidence;
        if (isCivilWar) {
          nextInflation += 8.0;
        }
        tempState.inflation_rate = parseFloat(Math.max(1, Math.min(100, nextInflation)).toFixed(2));

        // 7. Unemployment Rate (clamped to 1% to 100%)
        let laborReformReduction = 0;
        if (tempState.domesticPolicy.max_hours_law > 0) {
          laborReformReduction += 1.5;
        }
        const highDebtUnemploymentFactor = nextDebt > 1500 ? 1.0 : 0.0;
        let nextUnemployment = 12.0 - ((tempState.economy_growth - 2.5) * 0.4) + (taxLowerRate * 1.0) + (taxMiddleRate * 1.5) + (taxUpperRate * 3.0) - (taxTarRate * 1.5) - laborReformReduction + highDebtUnemploymentFactor;
        if (isCivilWar) {
          nextUnemployment += 4.0;
        }
        tempState.unemployment_rate = parseFloat(Math.max(1, Math.min(100, nextUnemployment)).toFixed(2));

        // Gently steer stats.economy (represents general economic health/stability index, 0-100)
        let econHealthDelta = (tempState.economy_growth - 2.5) * 1.5;
        if (tempState.budget < -8) econHealthDelta -= 1.5;
        if (tempState.inflation_rate > 15) econHealthDelta -= 2.0;
        const newEconHealth = Math.max(0, Math.min(100, (tempState.stats.economy || 50) + econHealthDelta));
        tempState.stats = {
          ...tempState.stats,
          economy: parseFloat(newEconHealth.toFixed(1)),
          armyLoyalty: parseFloat(newArmyLoyalty.toFixed(1)),
        };

        const updatedHistory = [
          ...(state.economyHistory || []),
          {
            year: tempState.year,
            month: tempState.month,
            growth: tempState.economy_growth,
            inflation: tempState.inflation_rate,
            unemployment: tempState.unemployment_rate
          }
        ].slice(-24);
        tempState = {
          ...tempState,
          economyHistory: updatedHistory
        };

        // Monthly action of Land Reform Act
        if (tempState.domesticPolicy.land_reform_law_enabled) {
          const landProgressStep = 1.0 + (1.0 - compRateVal) * 1.5; // faster expropriation
          tempState.domesticPolicy = {
            ...tempState.domesticPolicy,
            land_reform_progress: parseFloat(Math.min(100, tempState.domesticPolicy.land_reform_progress + landProgressStep).toFixed(2))
          };
        }

        // Monthly action of Mixed Jury Law
        if (tempState.domesticPolicy.mixed_jury_law_enabled) {
          tempState.stats = {
            ...tempState.stats,
            revolutionaryFervor: Math.max(0, tempState.stats.revolutionaryFervor - 1)
          };

          if (tempState.domesticPolicy.mixed_jury_cnt_opposed) {
            const newClasses = JSON.parse(JSON.stringify(tempState.classes));
            if (newClasses.Obreros && newClasses.Obreros.support) {
              const val = 5 / 12;
              newClasses.Obreros.support.PSOE = Math.min(100, (newClasses.Obreros.support.PSOE || 0) + val);
              newClasses.Obreros.support.CNT_FAI = Math.max(0, (newClasses.Obreros.support.CNT_FAI || 0) - val);
            }
            tempState.classes = newClasses;
          }
        }

        let newJournal = JSON.parse(JSON.stringify(state.journal || {}));

        Object.keys(newJournal).forEach(journalId => {
          const entryState = newJournal[journalId];
          const def = getJournalEntryDef(journalId);
          if (def && entryState.status === 'active' && def.activeEffect?.apply) {
             const effectResult = def.activeEffect.apply(tempState);
             tempState = { ...tempState, ...effectResult };
          }
        });

        // Check failure progress for land reform: if no progress is made from previous month, increase failureProgress by 1% (1)
        const landReformEntry = newJournal['journal_land_reform'];
        if (landReformEntry && state.journal['journal_land_reform']?.status === 'active') {
          const prevProgress = state.domesticPolicy.land_reform_progress;
          const nextProgress = tempState.domesticPolicy.land_reform_progress;
          if (nextProgress <= prevProgress) {
            landReformEntry.failureProgress = Math.min(100, (landReformEntry.failureProgress || 0) + 1);
          }
        }

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
          agricultural_policy_timer: Math.max(0, (state.agricultural_policy_timer || 0) - 1),
          labor_rights_timer: Math.max(0, (state.labor_rights_timer || 0) - 1),
          labor_affairs_timer: Math.max(0, (state.labor_affairs_timer || 0) - 1),
          fiscal_policy_timer: Math.max(0, (state.fiscal_policy_timer || 0) - 1),
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
    case 'DRAW_SPECIFIC_CARD': {
      const handLimit = state.difficulty === 'hard' ? 3 : 4;
      if (state.hand.length >= handLimit) return state;
      const { cardId, deckType } = action.payload;
      
      let card: Card | undefined;
      let newActionDeck = [...state.actionDeck];
      let newGovDeck = [...state.governmentDeck];
      let newMilDeck = [...state.militaryDeck];
      
      if (deckType === 'Action') {
        card = state.actionDeck.find(c => c.id === cardId);
        if (card) newActionDeck = newActionDeck.filter(c => c.id !== cardId);
      } else if (deckType === 'Governmental') {
        card = state.governmentDeck.find(c => c.id === cardId);
        if (card) newGovDeck = newGovDeck.filter(c => c.id !== cardId);
      } else if (deckType === 'Military') {
        card = state.militaryDeck.find(c => c.id === cardId);
        if (card) newMilDeck = newMilDeck.filter(c => c.id !== cardId);
      }
      
      if (!card) return state;
      
      newState = {
        ...state,
        hand: [...state.hand, card],
        actionDeck: newActionDeck,
        governmentDeck: newGovDeck,
        militaryDeck: newMilDeck
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
