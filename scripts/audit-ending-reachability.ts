import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { gameReducer } from '../src/game/reducers/gameReducer';
import { createScenarioState } from '../src/game/scenarios';
import type { GameState, GameEvent } from '../src/game/types';
import type { GameAction } from '../src/game/reducers/types';
import { createSeededRng, getRng, setRng } from '../src/game/rules/rng';
import { ENDING_DETAILS } from '../src/game/endings';
import { getOverallFactionDissent } from '../src/game/utils/factionEffects';
import { MapFaction } from '../src/map/types_map';
import { PROVINCE_ADJACENCY } from '../src/map/map_constants';
import { getPlayerMapFaction, canEnterMapProvince } from '../src/map/rules/factions';
import { resolveBattle } from '../src/game/rules/combat';
import { armyRecruitCost } from '../src/map/rules/costs';
import { getArmyPoliticalMember } from '../src/game/rules/wartimeCoalition';
import { calculateMonthlyPolicyEffects } from '../src/game/rules/policy';
import { getUnionShare, getRightShare } from '../src/game/unions';
import { isMayDaysEvent } from '../src/game/rules/mayDays';

// Clone plain state data while retaining card/event functions. The current
// post-reducer mutates nested objects, so isolated runs must not share them.
function copy<T>(value: T): T {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(copy) as T;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, copy(item)])) as T;
}

type Difficulty = 'easy' | 'normal' | 'hard' | 'historical';
type Route = 'idle' | 'revolution' | 'government' | 'split' | 'split_defeat' | 'asturias' | 'peace' | 'generic' | 'defeat';
const templates = Object.fromEntries(['1931', '1933', '1936'].flatMap(scenario =>
  ['easy', 'normal', 'hard', 'historical'].map(difficulty => [
    `${scenario}:${difficulty}`, copy(createScenarioState(scenario as '1931', difficulty as Difficulty, 'zh')),
  ])));
const incoming=new Map<string,string[]>();
for(const [from,neighbors] of Object.entries(PROVINCE_ADJACENCY)) for(const to of neighbors) incoming.set(to,[...(incoming.get(to)??[]),from]);

function run(scenario: '1931' | '1933' | '1936', difficulty: Difficulty, route: Route, seed: number) {
  setRng(createSeededRng(seed));
  let state = copy(templates[`${scenario}:${difficulty}`]);
  const trace: any[] = [];
  const summary = () => ({ date: `${state.year}-${state.month}`, phase: state.phase,
    ap:state.actionsLeft,
    ending: state.ending, fervor: state.stats.revolutionaryFervor,
    dissent: getOverallFactionDissent(state.factions), stance: state.cntStance,
    war: state.civilWarStatus, asturias: state.wars?.asturias_war,
    split: state.iberianDefense, pce: state.partySupport.PCE,
  });
  const applyAction = (action: GameAction, detail?: any) => {
    if(state.isGameOver)throw new Error('Cannot act after the ending screen');
    if(action.type==='NEXT_PHASE'&&state.phase==='action'&&state.actionsLeft!==0)throw new Error('UI End Turn requires 0 AP');
    const before = summary();
    const input = copy(state);
    state = gameReducer(input, action);
    trace.push({ ...before, action: action.type, detail: detail ?? ('payload' in action && typeof action.payload !== 'function' ? action.payload : undefined) });
  };
  const dispatch = (action: GameAction, detail?: any) => {
    if(action.type!=='RECRUIT_MAP_ARMY'){applyAction(action,detail);return;}
    // Sidebar.MobilizeAdjuster has a 1000-person step and an 8000-person
    // maximum for both infantry and artillery. Larger garrisons require several
    // legal mobilizations; never feed arbitrary slider values to the reducer.
    let infantry=Math.floor(action.payload.composition.infantry/1000)*1000;
    let artillery=Math.floor(action.payload.composition.artillery/1000)*1000;
    let tanks=Math.min(500,Math.floor(action.payload.composition.tanks));
    while(infantry+artillery+tanks>0) {
      const composition={infantry:Math.min(8000,infantry),artillery:Math.min(8000,artillery),tanks};
      const cost=armyRecruitCost(composition),resources=state.mapResources[getPlayerMapFaction(state)];
      if(resources.manpower<cost.manpower||resources.supplies<cost.supplies||resources.industrialCapacity<cost.ic||resources.tankReserve<cost.tankReserve)break;
      applyAction({...action,payload:{...action.payload,composition}});
      infantry-=composition.infantry;artillery-=composition.artillery;tanks=0;
    }
  };
  let blocked: string | undefined;
  function objective(next: GameState) {
    const f=next.stats.revolutionaryFervor;
    if(!Number.isFinite(f))return -1e9;
    if(route==='peace') return -next.coupProgress*5+next.stats.armyLoyalty*2-next.stats.tension-next.stats.revolutionaryFervor*0.5;
    if(route==='asturias') {
      const share=getUnionShare(next);
      return Math.min(f,85)+Math.min(next.factions.Faistas.influence+next.factions.Puristas.influence,85)*3
        +Math.min(next.partyRelations.PSOE,80)*3+Math.min(next.partyRelations.PCE,60)*3
        +Math.min(share.CNT,18)*3+Math.min(share.CNT+share.UGT,35)*3-Math.max(getRightShare(share)-12,0)*3
        +(next.workersAllianceProgress??0)*40+(next.journal.journal_uhp?.status==='completed'?100:0)
        +(next.journal.journal_alianza_obrera?.status==='completed'?500:0)
        -(next.activeCoalitions.some(c=>['popular_front','republican_socialist'].includes(c.activeId))?500:0);
    }
    if(route==='government') {
      const monthly=calculateMonthlyPolicyEffects({...copy(next),stats:{...next.stats,revolutionaryFervor:50}});
      return -f-(monthly.stats.revolutionaryFervor-50)*10+(next.cntStance==='govern'?40:0);
    }
    if(route==='generic')return -Math.abs(f-60)*2+(next.cntStance==='govern'?10:0);
    if(route.startsWith('split'))return -Math.max(next.partyRelations.PCE-15,0)*5;
    return f-getOverallFactionDissent(next.factions)*0.4;
  }
  function select(event: GameEvent): number {
    const available = event.options.map((option, index) => ({ option, index }))
      .filter(({option,index}) => (!option.condition || option.condition(state))
        && !(!route.startsWith('split') && event.id === 'may_days_ceasefire' && index === 3));
    if (route.startsWith('split') && event.id === 'may_days_ceasefire') return 3;
    if (route.startsWith('split') && event.id === 'may_days') return 1;
    if (route !== 'idle' && event.id === 'catalonia_defense') return 1;
    if (['generic','government','revolution','split','split_defeat'].includes(route) && event.id === 'civil_war_setup') return 1;
    if (route==='government' && event.id==='wartime_power_arrangement' && available.some(o=>o.index===1))return 1;
    if (route === 'asturias' && event.id === 'asturias_revolution') return available.find(({index}) => index === 0)?.index ?? available[0]?.index ?? -1;
    if (['revolution','government','peace','asturias','generic','split','split_defeat'].includes(route) || event.id.startsWith('cw_step')) {
      const rng = getRng();
      setRng({next:()=>0.5});
      const scored = available.map(({option,index}) => {
        const input = copy(state);
        const next = {...input,...option.effect(input)};
        let score = objective(next);
        if (event.id.startsWith('cw_step')) score -= Object.values(next.provinces).filter(p=>p.owner===MapFaction.NATIONALIST).reduce((sum,p)=>sum+(p.strategicValue??0),0)*20;
        return {index,score};
      }).sort((a,b)=>b.score-a.score);
      setRng(rng);
      return scored[0]?.index ?? -1;
    }
    return available[0]?.index ?? -1;
  }
  const strategicValue = (s: GameState, faction: MapFaction) => Object.values(s.provinces).filter(p=>p.owner===faction).reduce((sum,p)=>sum+(p.strategicValue??0),0);
  function military() {
    const faction = getPlayerMapFaction(state);
    if (state.mapCurrentPlayer !== faction || state.iberianDefense?.playerDefeated) { dispatch({type:'END_MAP_PLAYER_TURN'}); return; }
    if (route === 'defeat' || (route==='asturias'&&state.activeWar==='asturias_war') || (route==='split_defeat'&&state.iberianDefense?.eliminated.includes(MapFaction.NATIONALIST))) {
      for (const [index,army] of state.armies.filter(a=>a.faction===faction).entries()) dispatch({type:'SELECT_MAP_ARMY',payload:{armyId:army.id,isShift:index>0}});
      if (state.mapSelectedArmyIds.length) dispatch({type:'DISBAND_MAP_ARMIES'});
      dispatch({type:'END_MAP_PLAYER_TURN'}); return;
    }
    // Repair losses once per month, preserving the designed composition.
    for (const army of state.armies.filter(a=>a.faction===faction && a.identity==='gov' && a.manpower<a.maxManpower)) dispatch({type:'REINFORCE_MAP_ARMY',payload:{armyId:army.id}});
    const owned = Object.values(state.provinces).filter(p=>p.owner===faction);
    // Offices are the ordinary renewable national manpower source.
    const offices=owned.filter(p=>p.buildings?.recruitingOffice).length;
    if(offices<5) for(const province of owned.filter(p=>!p.buildings?.recruitingOffice).slice(0,5-offices)) {
      if(state.mapResources[faction].industrialCapacity<60)break;
      dispatch({type:'BUILD_MAP_BUILDING',payload:{provinceId:province.id,buildingType:'recruitingOffice'}});
    }
    const frontline = owned.filter(p=>(PROVINCE_ADJACENCY[p.id]??[]).some(id=>canEnterMapProvince(faction,state.provinces[id]?.owner) && state.provinces[id]?.owner!==faction));
    for(const province of [...frontline].sort((a,b)=>b.strategicValue-a.strategicValue)) {
      const enemy=state.armies.filter(a=>a.faction!==faction&&(PROVINCE_ADJACENCY[province.id]??[]).includes(a.provinceId));
      const needed=Math.ceil(Math.max(0,...enemy.map(a=>a.manpower))*1.25);
      const current=state.armies.filter(a=>a.faction===faction&&a.provinceId===province.id).reduce((s,a)=>s+a.manpower,0);
      if(needed<=current||state.mapResources[faction].manpower<needed-current)continue;
      if(!state.provinces[province.id].buildings?.barracks && state.mapResources[faction].industrialCapacity>=80) dispatch({type:'BUILD_MAP_BUILDING',payload:{provinceId:province.id,buildingType:'barracks'}});
      if(state.provinces[province.id].buildings?.barracks) dispatch({type:'RECRUIT_MAP_ARMY',payload:{provinceId:province.id,composition:{infantry:needed-current,artillery:0,tanks:0}}});
    }
    const base = [...frontline,...owned].sort((a,b)=>{
      const strength = (id:string) => state.armies.filter(x=>x.faction===faction&&x.identity==='gov'&&x.provinceId===id).reduce((s,x)=>s+x.manpower,0);
      return strength(b.id)-strength(a.id);
    })[0];
    const baseArtillery=base?state.armies.filter(a=>a.faction===faction&&a.provinceId===base.id&&a.identity==='gov').reduce((s,a)=>s+a.composition.artillery,0):0;
    if (base && baseArtillery<12000 && state.mapResources[faction].manpower>=4500) {
      if (!base.buildings?.barracks) dispatch({type:'BUILD_MAP_BUILDING',payload:{provinceId:base.id,buildingType:'barracks'}});
      if (state.provinces[base.id].buildings?.barracks) {
        const artillery = Math.min(4000,Math.floor(state.mapResources[faction].industrialCapacity/0.04),state.mapResources[faction].manpower-1500);
        if (artillery>=1000) dispatch({type:'RECRUIT_MAP_ARMY',payload:{provinceId:base.id,composition:{infantry:1500,artillery,tanks:0}}});
      }
    }
    // Merge only colocated formations with the same political owner and identity.
    const groups = new Map<string,string[]>();
    for (const a of state.armies.filter(a=>a.faction===faction)) {
      const key=[a.provinceId,a.identity,getArmyPoliticalMember(a)].join(':');
      groups.set(key,[...(groups.get(key)??[]),a.id]);
    }
    for (const ids of groups.values()) if (ids.length>1) {
      ids.forEach((armyId,index)=>dispatch({type:'SELECT_MAP_ARMY',payload:{armyId,isShift:index>0}}));
      dispatch({type:'MERGE_MAP_ARMIES'});
    }
    for(let cp=0;cp<2 && !state.isGameOver && state.mapCurrentPlayer===faction && state.mapResources[faction].commandPoints>0;cp++) {
      const enemies=Object.values(state.provinces).filter(p=>p.owner!==faction && canEnterMapProvince(faction,p.owner) && !(route==='split_defeat'&&state.iberianDefense&&p.owner===MapFaction.REPUBLICAN));
      const distance = new Map<string,number>();
      const queue=enemies.map(p=>p.id);queue.forEach(id=>distance.set(id,0));
      for(let i=0;i<queue.length;i++) for(const id of incoming.get(queue[i])??[]) {
        if(!distance.has(id)&&state.provinces[id]?.owner===faction){distance.set(id,(distance.get(queue[i])??0)+1);queue.push(id);}
      }
      const candidates:any[]=[];
      const rng=getRng();setRng({next:()=>0.5});
      for(const army of state.armies.filter(a=>a.faction===faction&&a.movesLeft>0)) for(const target of PROVINCE_ADJACENCY[army.provinceId]??[]) {
        const province=state.provinces[target];if(!province||!canEnterMapProvince(faction,province.owner))continue;
        if(province.owner===faction) {
          const from=distance.get(army.provinceId)??99,to=distance.get(target)??99;
          if(to<from) candidates.push({armyId:army.id,target,score:3+(army.identity==='gov'?3:0)+Math.min(army.composition.artillery/2000,6)});
        } else {
          if(route==='split_defeat'&&state.iberianDefense&&province.owner===MapFaction.REPUBLICAN)continue;
          const defenders=state.armies.filter(a=>a.provinceId===target&&a.faction!==faction);
          const probe=resolveBattle(copy(state.armies),copy(state.provinces),copy(army),target,true,state.militarization);
          const captures=probe.updatedProvinces[target].owner===faction;
          const damage=defenders.reduce((s,a)=>s+a.manpower-(probe.updatedArmies.find(x=>x.id===a.id)?.manpower??0),0);
          const loss=army.manpower-(probe.updatedArmies.find(a=>a.id===army.id)?.manpower??0);
          const score=captures ? 20+(province.strategicValue??0)*2+(['burgos','madrid','barcelona'].includes(target)?12:0)
            : damage/1000-loss/1000-12;
          candidates.push({armyId:army.id,target,score});
        }
      }
      setRng(rng);candidates.sort((a,b)=>b.score-a.score);
      if(!candidates.length||candidates[0].score<0)break;
      const best=candidates[0];dispatch({type:'MOVE_MAP_ARMY',payload:{armyId:best.armyId,targetProvinceId:best.target}},{...best,sv:strategicValue(state,faction)});
      if(cp===0 && state.provinces[best.target].owner===faction && state.mapCurrentPlayer===faction && !state.isGameOver) {
        if(!state.provinces[best.target].buildings?.barracks && state.mapResources[faction].industrialCapacity>=80) dispatch({type:'BUILD_MAP_BUILDING',payload:{provinceId:best.target,buildingType:'barracks'}});
        if(state.provinces[best.target].buildings?.barracks && state.mapResources[faction].manpower>=10000) dispatch({type:'RECRUIT_MAP_ARMY',payload:{provinceId:best.target,composition:{infantry:10000,artillery:0,tanks:0}}});
      }
    }
    if(state.mapResources[faction].commandPoints>0 && !state.isGameOver) dispatch({type:'END_MAP_PLAYER_TURN'});
  }
  function resolve() {
    for (let guard = 0; guard < 180 && !state.isGameOver; guard++) {
      if (state.superEvent) { dispatch({type:'DISMISS_SUPER_EVENT'}, state.superEvent); continue; }
      if (state.currentEvent) {
        const event = state.currentEvent;
        const index = select(event);
        if (index < 0) {
          if (event.id === 'cnt_forced_unemployment_resolution') {
            const element: any = event.renderContent!(state, dispatch);
            dispatch({type:'RESOLVE_EVENT', payload:s => element.props.onConfirm(s, ['hours_1', 'unemployment_13'])}, {event:event.id, pledges:['hours_1','unemployment_13']});
            continue;
          }
          if(event.id==='minister_allocation') {
            // Mirrors MinisterSelectionComponent.handleFinalize, selecting only
            // ministries whose displayed leverage cost is affordable.
            const selected=route==='government'?(['labor','agriculture'] as const):([] as const);
            const totalCost=selected.length*5;
            if(state.leverage<totalCost){blocked='insufficient minister leverage';return;}
            dispatch({type:'RESOLVE_EVENT',payload:s=>({leverage:s.leverage-totalCost,ministers:{...s.ministers,...Object.fromEntries(selected.map(id=>[id,'CNT']))},currentEvent:null})},{event:event.id,selected,totalCost});continue;
          }
          blocked = `custom UI / no available options: ${event.id}`; return;
        }
        const option = event.options[index];
        if (option.condition && !option.condition(state)) { blocked = `unavailable option: ${event.id}:${index}`; return; }
        dispatch({type:'RESOLVE_EVENT',payload: option.effect}, {event:event.id,index,text:option.textZh}); continue;
      }
      if (state.pendingEvents.length) {
        const event=state.pendingEvents.find(e=>e.id==='wartime_power_arrangement') ?? state.pendingEvents.find(e=>isMayDaysEvent(e.id)) ?? state.pendingEvents[0];
        dispatch({type:'SELECT_EVENT',payload:{eventId:event.id}}); continue;
      }
      return;
    }
  }
  function politics() {
    const wanted=route==='government'||route==='generic'||route==='revolution'?['mariano_rodriguez']:route==='peace'?['Buenaventura Durruti','Ramón Franco','melchor_rodriguez']:route==='asturias'?['orobon_fernandez','jaime_balius','mariano_rodriguez']:[];
    for(const [slotIndex,id] of wanted.entries()) if(state.activeAdvisors[slotIndex]?.id!==id) {
      const advisor=state.advisorPool.find(a=>a.id===id);if(advisor) dispatch({type:'ADD_ADVISOR',payload:{advisor,slotIndex}}, {advisor:id,slotIndex});
    }
    for(let ap=0;ap<2&&state.actionsLeft>0&&!state.isGameOver;ap++) {
      const deck=(route==='government'||route==='generic')&&(state.ministers.labor==='CNT'||state.month%3===0)?'Government':'Action';
      for(let draw=0;draw<4&&state.hand.length<(difficulty==='hard'?3:4);draw++) {
        const before=state.hand.length;
        dispatch({type:'DRAW_CARD',payload:draw===0?deck:'Action'});
        if(state.hand.length===before && deck!=='Action') dispatch({type:'DRAW_CARD',payload:'Action'});
        if(state.hand.length===before)break;
      }
      const candidates:any[]=[];
      const rng=getRng();setRng({next:()=>0.5});
      const baseline=objective(state);
      for(const advisor of state.activeAdvisors.filter(Boolean)) for(const action of advisor!.actions) if(action.condition(state)) {
        if(route==='asturias' && !state.journal.journal_alianza_obrera?.status.match(/active|completed/) && state.year>=1933)continue;
        const input=copy(state),next={...input,...action.effect(input)};
        candidates.push({kind:'advisor',action,advisor:advisor!.id,score:objective(next)-baseline});
      }
      for(const card of state.hand) if(card.cost<=state.actionsLeft&&(!card.condition||card.condition(state))&&(card.resourceCost??0)<=state.resources&&(card.armamentCost??0)<=state.armaments) {
        const input=copy(state),next={...input,...card.effect(input)};
        let score=objective(next)-baseline;
        if(next.currentEvent) {
          const choices=next.currentEvent.options.filter(o=>!o.condition||o.condition(next));
          if(!choices.length)continue;
          score=Math.max(...choices.map(o=>{const c=copy(next);return objective({...c,...o.effect(c)})-baseline;}));
        }
        // For the peace/uprising search, neutral plays also cycle the finite deck.
        if((route==='peace'||route==='asturias'||route.startsWith('split'))&&score>=-0.1)score+=0.01;
        candidates.push({kind:'card',card,score});
      }
      setRng(rng);candidates.sort((a,b)=>b.score-a.score);
      const best=candidates[0];if(!best) {blocked='no playable hand card/advisor action to spend the remaining AP';break;}
      if(best.kind==='card') dispatch({type:'PLAY_CARD',payload:best.card},{card:best.card.id});
      else dispatch({type:'RESOLVE_EVENT',payload:s=>({...best.action.effect(s),actionsLeft:s.actionsLeft-1})},{advisor:best.advisor,action:best.action.id});
      resolve();if(blocked)break;
    }
  }
  for (let guard = 0; guard < 650 && !state.isGameOver && !blocked; guard++) {
    resolve();
    if (state.isGameOver || blocked) break;
    if(state.phase==='action')politics();
    if(state.isGameOver||blocked)break;
    if(state.phase==='action'&&state.actionsLeft!==0){blocked='UI End Turn requires 0 AP';break;}
    if(state.phase==='event'){dispatch({type:'CHECK_EVENT'});continue;}
    if (state.phase === 'war') {
      if (['revolution','government','generic','split','split_defeat','defeat','asturias'].includes(route)) military();
      else dispatch({type:'END_MAP_PLAYER_TURN'});
    }
    if(state.isGameOver)break;
    dispatch({type:'NEXT_PHASE'});
  }
  return {validationVersion:5,scenario,difficulty,route,seed,...summary(),blocked,goals:{journal:state.journal,relations:state.partyRelations,factions:state.factions,union:state.unionShare,ministers:state.ministers,coup:state.coupProgress,
    provinces:Object.values(state.provinces).filter(p=>p.owner!==getPlayerMapFaction(state)).map(p=>({id:p.id,owner:p.owner,sv:p.strategicValue,buildings:p.buildings})),
    armies:state.armies.map(a=>({id:a.id,faction:a.faction,province:a.provinceId,composition:a.composition,morale:a.morale})),hand:state.hand.map(c=>({id:c.id,cost:c.cost,available:!c.condition||c.condition(state)}))},sv:Object.fromEntries(Object.values(MapFaction).map(f=>[f,strategicValue(state,f)])), trace};
}

const args = process.argv.slice(2);
const runs = args[0]==='--final-matrix' ? (['easy','normal','hard','historical'] as const).flatMap(difficulty=>[
  run('1936',difficulty,'revolution',1),run('1936',difficulty,'government',3),run('1936',difficulty,'generic',1),
  run('1936',difficulty,'defeat',1),run('1936',difficulty,'idle',1),
  run('1936',difficulty,'split',1),run('1936',difficulty,'split_defeat',1),
  run('1933',difficulty,'asturias',2),run('1933',difficulty,'peace',3),
]) : args[0]==='--war-matrix' ? (['easy','normal','hard','historical'] as const).flatMap(difficulty=>[1,2,3,4].map(seed=>run('1936',difficulty,'revolution',seed)))
  : args.length ? [run(args[0] as '1936',args[1] as Difficulty,(args[2] || 'idle') as Route,Number(args[3] || 1))]
  : (['1933','1936'] as const).flatMap(scenario => (['easy','normal','hard','historical'] as const).map(difficulty => run(scenario,difficulty,'idle',1)));
mkdirSync('output', {recursive:true});
const previous=existsSync('output/ending-reachability.json')?JSON.parse(readFileSync('output/ending-reachability.json','utf8')).runs.filter((r:any)=>r.validationVersion>=3 && (!r.ending || r.ending in ENDING_DETAILS)):[];
const key=(r:any)=>[r.scenario,r.difficulty,r.route,r.seed].join(':');
const allRuns=[...previous.filter((r:any)=>!runs.some(n=>key(n)===key(r))),...runs];
const currentRuns=allRuns.filter((r:any)=>r.validationVersion===5);
writeFileSync('output/ending-reachability.json',JSON.stringify({method:'Real scenario; ordinary event options; UI End Turn requires 0 AP; recruitment sliders use 1000-person steps and at most 8000 of each type per mobilization; no sandbox/load/debug/undrawn-card actions.', endings:Object.keys(ENDING_DETAILS),runs:allRuns},null,2));
const rows=Object.entries(ENDING_DETAILS).map(([id,ending])=>{
  const witnesses=currentRuns.filter((r:any)=>r.ending===id&&!r.blocked);
  const status=id==='RUSSIAN_SPAIN'?'unreachable by current gameplay writers':witnesses.length?'reachable with complete route evidence':'not yet witnessed';
  return {id,title:ending.titleZh,status,verifiedModes:[...new Set(witnesses.map((r:any)=>r.difficulty))],
    examples:witnesses.map(({scenario,difficulty,route,seed,date,fervor,dissent,stance,trace}:any)=>({scenario,difficulty,route,seed,date,fervor,dissent,stance,actions:trace.length})),
  };
});
writeFileSync('output/ending-review.json',JSON.stringify({
  scope:'Union of non-sandbox difficulties. An ending is reachable if at least one complete ordinary route reaches it. Modes not listed are unverified, except the explicit historical peace restriction.',
  method:'Real starts, seeded ordinary draws, actual available event options, 0 AP before End Turn, legal recruitment slider values; no state loads, sandbox, debug endings, or undrawn card plays.',
  endings:rows,attemptedRoutes:currentRuns.length,
  restrictions:[{ending:'SILENT_REPUBLIC',mode:'historical',status:'unreachable',reason:'Forced July 1936 war in 1931/1933; 1936 starts at war.'}],
  issues:[
    {priority:1,problem:'Russian Spain still has no gameplay writer for pceInPower. The 1935 Comintern event and 1936 start now supply pceAcceptsComintern.'},
    {priority:2,problem:'Great Purge requires national PCE support >75 and Russian Spain >70. The loose upper bound of 78 no longer excludes these thresholds; reaching them still needs complete ordinary-route evidence.'},
    {priority:1,problem:'Catalonia seizure spreads a control-share patch containing stats.workerControl alone; full stats are replaced and fervor becomes undefined/NaN, disabling both fervor-specific victory checks.'},
  ],
  evidence:{routes:'output/ending-reachability.json',invariants:'output/ending-invariants.json'},
},null,2));
for(const {trace,goals,...result} of runs) console.log(JSON.stringify({...result,steps:trace.length}));
