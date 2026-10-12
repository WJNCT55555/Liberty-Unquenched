import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { INITIAL_CLASSES, SCENARIO_1933_CLASSES, SCENARIO_1936_CLASSES } from '../src/game/parties';
import { CLASS_INFO } from '../src/game/constants';
import { adjustSingleClassSupport, type ClassPoliticalForce } from '../src/game/utils/classSupport';
import { createSeededRng } from '../src/game/rules/rng';
import { PCE_ENDING_THRESHOLDS } from '../src/game/endings';

// This file checks static invariants. These constructed class distributions are
// NOT playable-route witnesses; those live in audit-ending-reachability.ts.
const anchors = { Braceros:'Other', Labradores:'ERC', Latifundistas:'UR', PequenaBurguesia:'ERC', Intelectuales:'ERC', Burguesia:'ERC', Clero:'PNV' } as const;
const classNames=new Set(Object.keys(CLASS_INFO));
const files=(directory:string):string[]=>fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(`${directory}/${entry.name}`):/\.tsx?$/.test(entry.name)?[`${directory}/${entry.name}`]:[]);
const sources=files('src/game');
const writes: {file:string;line:number;socialClass:string;force:string;kind:string}[]=[];
const dynamicCalls: {file:string;line:number;expression:string}[]=[];
const literal=(node:ts.Node|undefined)=>node&&ts.isStringLiteral(node)?node.text:undefined;
for(const file of sources) {
  const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
  const record=(node:ts.Node,socialClass:string|undefined,force:string|undefined,kind:string)=>{
    if(socialClass&&force)writes.push({file,line:source.getLineAndCharacterOfPosition(node.getStart()).line+1,socialClass,force,kind});
  };
  const visit=(node:ts.Node)=>{
    if(ts.isCallExpression(node)&&node.expression.getText(source)==='adjustClassSupport') {
      const socialClass=literal(node.arguments[1]),force=literal(node.arguments[2]);
      record(node,socialClass,force,'direct helper');
      if(!socialClass||!force)dynamicCalls.push({file,line:source.getLineAndCharacterOfPosition(node.getStart()).line+1,expression:node.getText(source)});
    }
    if(ts.isCallExpression(node)&&file.endsWith('/economicFeedback.ts')&&node.expression.getText(source)==='apply') record(node,literal(node.arguments[0]),literal(node.arguments[1]),'economic feedback wrapper');
    if(ts.isArrayLiteralExpression(node)&&classNames.has(literal(node.elements[0])??'')&&literal(node.elements[1]))record(node,literal(node.elements[0]),literal(node.elements[1]),'content tuple');
    if(ts.isObjectLiteralExpression(node)) {
      const properties=new Map(node.properties.filter(ts.isPropertyAssignment).map(p=>[p.name.getText(source),p.initializer]));
      if(literal(properties.get('kind'))==='classSupport')record(node,literal(properties.get('targetClass')),literal(properties.get('targetForce')),'monthly policy');
    }
    ts.forEachChild(node,visit);
  };
  visit(source);
}
const pceClasses = new Set(writes.filter(write=>write.force==='PCE').map(write=>write.socialClass));
for(const write of writes) {
  assert(!(write.force==='PCE'&&write.socialClass!=='Obreros'
    && !(write.file.endsWith('/events/civil_war/pce_social_expansion.ts')
      && ['Labradores','PequenaBurguesia','Intelectuales'].includes(write.socialClass))),`Unreviewed nonworker PCE writer: ${write.file}:${write.line}`);
  assert(write.force!==anchors[write.socialClass as keyof typeof anchors],`Anchor now has a direct writer: ${write.file}:${write.line}`);
}
// The only dynamic calls are the three literal tuple reducers, economic
// feedback's local wrapper, and the policy modifier dispatcher inspected above.
const unreviewed=dynamicCalls.filter(call=>!['action_affairs/mitin_popular.ts','action_affairs/propaganda_by_deed.ts','action_affairs/prrevs_campaigning.ts','rules/economicFeedback.ts','rules/policy.ts','events/founding_syndicalist_party.ts'].some(path=>call.file.endsWith(path)));
assert.equal(unreviewed.length,0,JSON.stringify(unreviewed));
const baseline=[];
let largestRoundingExcursion=0;
let transitions=0;
for(const [scenario,classes] of Object.entries({'1931':INITIAL_CLASSES,'1933':SCENARIO_1933_CLASSES,'1936':SCENARIO_1936_CLASSES})) {
  const rng=createSeededRng(Number(scenario));
  for(const [socialClass,anchor] of Object.entries(anchors)) {
    if(pceClasses.has(socialClass))continue;
    let support={...classes[socialClass as keyof typeof classes].support};
    assert(support.PCE<=support[anchor]);
    baseline.push({scenario,socialClass,population:CLASS_INFO[socialClass as keyof typeof CLASS_INFO].pop,pce:support.PCE,anchor,anchorSupport:support[anchor]});
    const targets=Object.keys(support).filter(force=>force!=='PCE'&&force!==anchor) as ClassPoliticalForce[];
    for(let i=0;i<10000;i++) {
      transitions++;
      support=adjustSingleClassSupport(support,targets[Math.floor(rng.next()*targets.length)],(rng.next()-.5)*200);
      largestRoundingExcursion=Math.max(largestRoundingExcursion,support.PCE-support[anchor]);
      assert(support.PCE<=support[anchor]+.005);
    }
  }
}
const idealUpperBound=Object.entries(CLASS_INFO).reduce((sum,[socialClass,info])=>sum+info.pop*(pceClasses.has(socialClass)?1:.5),0);
const report={
  scope:'Current source tree; ordinary gameplay excludes load/debug/sandbox state injection.',
  unreachable:[
    {ending:'RUSSIAN_SPAIN',reason:'pceInPower initializes false and has no gameplay writer. The 1935 Comintern event now supplies pceAcceptsComintern; the 1936 start pre-applies that historical flag.'},
  ],
  supportBounds:{idealUpperBound,baseline,thresholds:PCE_ENDING_THRESHOLDS,
    excludedByUpperBound:{greatPurge:idealUpperBound<=PCE_ENDING_THRESHOLDS.greatPurge,russianSpain:idealUpperBound<=PCE_ENDING_THRESHOLDS.russianSpain},
    note:'A loose upper bound does not prove a legal route can attain either threshold. The new >75 / >70 thresholds are no longer excluded by this bound.'},
  modeRestrictions:[{ending:'SILENT_REPUBLIC',mode:'historical',reason:'1931/1933 force the civil-war announcement in July 1936; 1936 starts with the civil war ongoing.'}],
  overlap:{earlier:'THE_GREAT_PURGE',later:'RUSSIAN_SPAIN',reason:'While CNT governs, PCE >75 preempts Russian Spain; 70 < PCE <=75 permits Russian Spain if its remaining conditions are supplied.'},
  supportWrites:writes.filter(write=>write.force==='PCE'),dynamicCalls,
  normalizationStressCheck:{transitions,largestRoundingExcursion,note:'Helper invariant stress check for classes without direct PCE gains, not an end-to-end playability test.'},
};
fs.mkdirSync('output',{recursive:true});fs.writeFileSync('output/ending-invariants.json',JSON.stringify(report,null,2));
console.log(`Ending invariants checked: ${sources.length} source files, ${writes.length} resolved support writers, ${transitions} normalization transitions. Ideal PCE upper bound: ${idealUpperBound}%.`);
