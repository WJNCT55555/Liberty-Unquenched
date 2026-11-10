import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const families = [
  ['action_affairs', '行动卡牌', '行动卡牌详解.md', 'ACTION_AFFAIRS'],
  ['government_affairs', '政府卡牌', '政府卡牌详解.md', 'GOVERNMENT_AFFAIRS'],
  ['military_affairs', '武装卡牌', '武装卡牌详解.md', 'MILITARY_AFFAIRS'],
];

const propName = (p) => p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) ? p.name.text : undefined;
const prop = (obj, name) => obj?.properties.find((p) => propName(p) === name);
const initializer = (obj, name) => {
  const found = prop(obj, name);
  return found && ts.isShorthandPropertyAssignment(found) ? found.name : found?.initializer;
};
const display = (node, source) => {
  if (!node) return '无';
  if (ts.isStringLiteralLike(node)) return node.text;
  return node.getText(source).trim();
};
const code = (node, source) => node ? node.getText(source).trim() : '';
const line = (node, source) => source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
const inline = (value) => {
  const normalized = String(value).replaceAll(/\s*\r?\n\s*/g, ' ');
  const longest = Math.max(0, ...[...normalized.matchAll(/`+/g)].map((match) => match[0].length));
  const fence = '`'.repeat(longest + 1);
  return `${fence}${normalized}${fence}`;
};

function declarations(source) {
  const byName = new Map();
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      byName.set(node.name.text, node.initializer);
    }
    if (ts.isFunctionDeclaration(node) && node.name) byName.set(node.name.text, node);
    ts.forEachChild(node, visit);
  }
  visit(source);
  return byName;
}

function resolved(node, source, byName) {
  if (ts.isIdentifier(node) && byName.has(node.text)) {
    const definition = byName.get(node.text);
    return { text: code(definition, source), at: line(definition, source) };
  }
  return { text: code(node, source) };
}

function findCard(source) {
  let found;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.initializer && ts.isObjectLiteralExpression(node.initializer) &&
        initializer(node.initializer, 'id') && initializer(node.initializer, 'cost') &&
        initializer(node.initializer, 'type')) found = node.initializer;
    ts.forEachChild(node, visit);
  }
  visit(source);
  return found;
}

function findOptions(source) {
  const options = [];
  function visit(node) {
    if (ts.isObjectLiteralExpression(node) && initializer(node, 'text') && initializer(node, 'effect')) {
      options.push(node);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return options.sort((a, b) => a.pos - b.pos);
}

function visibility(option, source) {
  const gates = [];
  let cursor = option.parent;
  while (cursor && cursor !== source) {
    if (ts.isIfStatement(cursor)) {
      const inThen = option.pos >= cursor.thenStatement.pos && option.end <= cursor.thenStatement.end;
      const inElse = cursor.elseStatement && option.pos >= cursor.elseStatement.pos && option.end <= cursor.elseStatement.end;
      if (inThen) gates.unshift({ expression: cursor.expression, negate: false });
      else if (inElse) gates.unshift({ expression: cursor.expression, negate: true });
    }
    cursor = cursor.parent;
  }
  return gates;
}

function enclosingEvent(option, source) {
  let cursor = option.parent;
  while (cursor && cursor !== source) {
    if (ts.isObjectLiteralExpression(cursor) && initializer(cursor, 'options') && initializer(cursor, 'title')) {
      const title = initializer(cursor, 'titleZh') ?? initializer(cursor, 'title');
      return ts.isStringLiteralLike(title) ? title.text : '动态事件';
    }
    cursor = cursor.parent;
  }
  return '动态构造的事件或选项组';
}

function getRegisteredNames(indexPath, arrayName) {
  const source = ts.createSourceFile(indexPath, fs.readFileSync(indexPath, 'utf8'), ts.ScriptTarget.Latest, true);
  const imports = new Map();
  let names = [];
  for (const stmt of source.statements) {
    if (ts.isImportDeclaration(stmt) && stmt.importClause?.namedBindings && ts.isNamedImports(stmt.importClause.namedBindings)) {
      for (const spec of stmt.importClause.namedBindings.elements) imports.set(spec.name.text, `${stmt.moduleSpecifier.text}.ts`);
    }
    if (ts.isVariableStatement(stmt)) for (const decl of stmt.declarationList.declarations) {
      if (decl.name.getText(source) === arrayName && decl.initializer && ts.isArrayLiteralExpression(decl.initializer)) {
        names = decl.initializer.elements.filter(ts.isIdentifier).map((e) => e.text);
      }
    }
  }
  return names.map((name) => ({ name, file: imports.get(name) }));
}

function callbackBody(expr, source) {
  if (!expr) return '无';
  return code(expr, source);
}

const fieldZh = {
  resources: '资源', armaments: '军备', budget: '预算', actionsLeft: '行动点',
  revolutionaryFervor: '革命热情', tension: '社会紧张度', anarchistMilitia: '无政府主义民兵力量',
  armyLoyalty: '军队忠诚度', coupProgress: '政变进度', partySupport: '政党支持',
  classes: '阶级支持', factions: '派系状态', stats: '全局指标', relations: '外交关系',
  partyRelations: '政党关系', domesticPolicy: '国内政策', armedForces: '武装力量',
  cntStance: 'CNT立场', civilWarStatus: '内战状态', year: '年份', month: '月份',
  manpower: '人力', loyalty: '忠诚度', militarization: '军事化率',
  tax_lower_class: '下层所得税率', tax_middle_class: '中层所得税率', tax_upper_class: '上层所得税率',
  tax_tariff: '关税税率', tax_consumption: '消费税率', currentEvent: '当前事件',
  finance: '财政部长', interior: '内政部长', war: '战争部长', agriculture: '农业部长',
  aragonCouncilExists: '阿拉贡防务委员会',
  land_reform_progress: '土地改革进度', security_corps_law: '治安机关法',
  max_hours_law: '最高工时法', workplace_safety: '工作安全法',
  judiciary_reform_progress: '司法改革进度', health_reform_progress: '卫生改革进度',
  republicanAuthority: '共和国权威', republican_authority: '共和国权威',
  bureaucratization: '官僚化程度', military_spending: '军事开支',
  ideological_propaganda: '意识形态宣传', unemployment_rate: '失业率',
  france: '法国关系', portugal: '葡萄牙关系', germany: '德国关系', italy: '意大利关系',
  mexico: '墨西哥关系', uk: '英国关系', usa: '美国关系', ussr: '苏联关系',
  internationalSocialists: '国际社会主义者关系', international_socialists: '国际社会主义者关系',
  estado: '外交部长', public_debt: '公共债务', foreign_exchange: '外汇储备',
  gibraltar_resolved: '直布罗陀问题解决标记', coalition_dissent: '联合政府分歧',
  dissent: '当前派系分歧', influence: '派系影响力',
  assassination_training_general: '通用训练等级', assassination_training: '专项训练等级',
  current: '当前训练等级',
  francoStatus: '佛朗哥状态', queipoStatus: '凯波状态', sanjurjoStatus: '桑胡尔霍状态',
  calvoSoteloStatus: '卡尔沃·索特洛状态', primoDeRiveraStatus: '普里莫·德·里维拉状态',
  ramiroLedesmaStatus: '莱德斯马状态', zamoraStatus: '萨莫拉状态', alfonsoXIIIStatus: '阿方索十三世状态',
  fe_founded: '长枪党', falange_jons: '长枪党与民族工团进攻委员会联盟',
  ceda_formed: 'CEDA', usa_total_embargo: '美国全面禁运',
  isPresidentImpeached: '总统已被弹劾', fe_leadership_crisis: '长枪党领导危机',
  president: '总统', presidentZh: '总统姓名', government: '政府',
  tankResearchProgress: '坦克研发进度',
  tankResearchCompleted: '坦克研发完成', hasArmoredCars: '装甲车辆已解锁',
  radio: '广播网络等级', cinema: '电影宣传等级', ateneos_established: '自由雅典学院数量',
  commercialized_propaganda: '商业化宣传程度', campaign_propaganda: '竞选宣传程度',
  dissentFactor: '派系分歧系数', religion_policy: '宗教政策等级',
  covert_ops_france: '法国秘密行动能力', covert_ops_portugal: '葡萄牙秘密行动能力',
  land: '土地所有权', industry: '工业所有权', trade: '贸易控制权',
  latifundia: '大庄园', church: '教会', collective: '集体', cooperative: '合作社',
  smallholders: '小农', state: '国家', private: '私人', foreign: '外国资本',
  bigCapital: '大资本', smallBusiness: '小企业', union: '工会', other: '其他工会',
  inflation_rate: '通胀率', activeCoalitions: '执政联盟',
  impeachPresidentAvailable: '总统弹劾时机', treintistasLeft: '三十人派已退出',
  commercializedPropaganda: '商业化宣传程度', campaignPropaganda: '竞选宣传程度',
  CNT_FAI: 'CNT-FAI', cnt: 'CNT', gov: '政府军', pce: '西共', unorganized: '未组织工人',
  multiplier: '派系分歧系数', df: '派系分歧系数',
  workerSupport: '工人支持变化值', workingClassSupport: '劳动阶级支持变化值',
  middleClassSupport: '中产阶级支持变化值', upperClassSupport: '上层阶级支持变化值',
  faistasDissent: '无政府主义派分歧变化值', puristasDissent: '纯粹派分歧变化值',
};
const economyZh = {
  wartime_requisition: '战时征购', family_rationing: '家庭配给', wartime_trade_monopoly: '战时贸易垄断',
  rail_nationalization: '铁路国有化', coal_nationalization: '煤矿国有化', industrial_cooperative: '工业合作社',
  foreign_capital_seizure: '外资企业接管', supply_coordination_network: '物资统筹网络',
  currency_abolition: '废除货币', private_bank_seizure: '私人银行接管',
  mutual_credit_network: '互助信贷网络', credit_exchange_committee: '信用兑换委员会',
};
const valueZh = { ongoing: '进行中', not_started: '尚未开始', govern: '执政', dead: '死亡', CNT: 'CNT', true: '是', false: '否' };
const classZh = { Obreros: '工人', Braceros: '雇农', Labradores: '自耕农', Clero: '教士', Latifundistas: '大地主', PequenaBurguesia: '小资产阶级', Intelectuales: '知识分子', Burguesia: '资产阶级' };
const factionZh = { Faistas: '无政府主义派', Puristas: '纯粹派', Treintistas: '三十人派', Sindicalistas: '工团派', Cenetistas: '工会派', Jabalistas: '野猪派' };
const unquote = (node, source) => ts.isStringLiteralLike(node) ? node.text : code(node, source);
const label = (name) => {
  if (!name) return '相关项目';
  if (fieldZh[name] || classZh[name] || factionZh[name]) return fieldZh[name] ?? classZh[name] ?? factionZh[name];
  if (name.endsWith('_timer')) return '该事务冷却时间';
  if (name.startsWith('draft_tax_')) return '税率草案';
  if (name.startsWith('temp_tax_')) return '税率审查基准';
  if (name.endsWith('_submitted')) return '税种组提交标记';
  if (name.startsWith('covert_ops_')) return '秘密行动能力';
  if (name.endsWith('_progress')) return '相关进度';
  return name.replaceAll(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ');
};
const signed = (value) => /^[-+]/.test(value) ? value : `+${value}`;
let activeNames = new Map();

function functionBody(node) {
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node)) return node.body;
  return node;
}

function returnExpression(node) {
  const body = functionBody(node);
  if (!body) return undefined;
  if (!ts.isBlock(body)) return body;
  return body.statements.find(ts.isReturnStatement)?.expression;
}

function readableValue(node, source) {
  if (!node) return '未知';
  if (ts.isStringLiteralLike(node)) return valueZh[node.text] ?? label(node.text);
  if (ts.isNumericLiteral(node)) return node.text;
  if (node.kind === ts.SyntaxKind.TrueKeyword) return '是';
  if (node.kind === ts.SyntaxKind.FalseKeyword) return '否';
  if (ts.isPropertyAccessExpression(node)) return label(node.name.text);
  if (ts.isIdentifier(node)) {
    const definition = activeNames.get(node.text);
    return definition && ts.isNumericLiteral(definition) ? definition.text : label(node.text);
  }
  if (ts.isParenthesizedExpression(node)) return readableValue(node.expression, source);
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.BarBarToken && ts.isNumericLiteral(node.right) && node.right.text === '0') return readableValue(node.left, source);
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) return readableValue(node.left, source);
  if (ts.isConditionalExpression(node)) return `${readableValue(node.whenTrue, source)}（满足条件时）或${readableValue(node.whenFalse, source)}（否则）`;
  let result = code(node, source).replaceAll(/\b(?:state|s|s2|next)\./g, '').replaceAll('||', '或').replaceAll('&&', '且').replaceAll('*', '×');
  result = result.replaceAll(/getDissentMultiplier\([^)]*\)/g, '派系分歧系数');
  for (const [key, value] of Object.entries(fieldZh)) result = result.replaceAll(new RegExp(`\\b${key}\\b`, 'g'), value);
  return result;
}

function conditionValue(node, source, byName) {
  if (ts.isIdentifier(node) && byName.has(node.text)) {
    const definition = byName.get(node.text);
    if (ts.isNumericLiteral(definition) || ts.isStringLiteralLike(definition)) return readableValue(definition, source);
  }
  const raw = code(node, source);
  if (raw.includes('Faistas?.influence') && raw.includes('Puristas?.influence')) return '无政府主义派与纯粹派影响力之和';
  if (ts.isCallExpression(node)) {
    const functionName = code(node.expression, source);
    if (functionName === 'getEconomyCounter') {
      const key = unquote(node.arguments[1], source);
      return `${economyZh[key] ?? '该经济方案'}已实施次数`;
    }
    if (functionName === 'lawLevel') return '治安机关法等级';
    if (functionName === 'corpsLoyalty') {
      const corps = unquote(node.arguments[1], source);
      return `${{ guardiaNacional: '国民警卫队', guardiaAsalto: '突击卫队', guardiaRepublicana: '共和国警卫队' }[corps] ?? '警卫队'}忠诚度`;
    }
  }
  if (raw.includes('getUnionShare(') && raw.endsWith('.CNT')) return 'CNT工会份额';
  return readableValue(node, source);
}

function conditionText(node, source, byName) {
  if (!node) return '无额外条件';
  if (node.kind === ts.SyntaxKind.TrueKeyword) return '无额外时机门槛';
  if (node.kind === ts.SyntaxKind.FalseKeyword) return '当前不可用';
  if (ts.isIdentifier(node) && byName.has(node.text)) return conditionText(byName.get(node.text), source, byName);
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) return conditionText(returnExpression(node), source, byName);
  if (ts.isParenthesizedExpression(node)) return conditionText(node.expression, source, byName);
  if (ts.isBlock(node)) return conditionText(node.statements.find(ts.isReturnStatement)?.expression, source, byName);
  if (ts.isBinaryExpression(node)) {
    const op = node.operatorToken.kind;
    if (op === ts.SyntaxKind.AmpersandAmpersandToken) return `${conditionText(node.left, source, byName)}，且${conditionText(node.right, source, byName)}`;
    if (op === ts.SyntaxKind.BarBarToken) {
      if (ts.isNumericLiteral(node.right) && node.right.text === '0') return conditionText(node.left, source, byName);
      return `${conditionText(node.left, source, byName)}，或${conditionText(node.right, source, byName)}`;
    }
    const operators = new Map([[ts.SyntaxKind.GreaterThanEqualsToken, '≥'], [ts.SyntaxKind.LessThanEqualsToken, '≤'],
      [ts.SyntaxKind.GreaterThanToken, '>'], [ts.SyntaxKind.LessThanToken, '<'], [ts.SyntaxKind.EqualsEqualsEqualsToken, '为'],
      [ts.SyntaxKind.ExclamationEqualsEqualsToken, '不为'], [ts.SyntaxKind.EqualsEqualsToken, '为'], [ts.SyntaxKind.ExclamationEqualsToken, '不为']]);
    if (operators.has(op)) return `${conditionValue(node.left, source, byName)}${operators.get(op)}${conditionValue(node.right, source, byName)}`;
  }
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) {
    const raw = code(node.operand, source);
    if (raw.startsWith('target.isDead(')) return '目标尚未死亡';
    if (ts.isPropertyAccessExpression(node.operand)) return `${readableValue(node.operand, source)}尚未成立`;
    return `不满足“${conditionText(node.operand, source, byName)}”`;
  }
  if (ts.isCallExpression(node)) {
    const name = code(node.expression, source);
    if (name === 'isOrganizationActive') return `${readableValue(node.arguments[1], source)}组织已启用`;
    if (name === 'isSpanishCivilWarOngoing') return '内战正在进行';
    if (name === 'isRepublicanPartyEligible') return `${readableValue(node.arguments[1], source)}符合接触条件`;
    if (name === 'isFactionActiveForDissent') return '该派系仍活跃';
    if (name === 'isOrganizationEstablished') return `${readableValue(node.arguments[1], source)}组织已成立`;
    if (name === 'hasCampaignResource') return '竞选所需资源足够';
    if (name === 'hasUsesLeft') return '革命准备仍有可用次数';
    if (name === 'atWar') return '处于战争状态';
    if (name === 'canTransferMoscowGold') return '具备转运黄金储备的条件';
    if (name === 'prrevsCampaigning.condition') return 'PRRevS竞选卡牌可使用';
    if (name === 'target.isDead') return '目标已死亡';
    if (name === 'target.gate') return '目标的时机条件已满足';
    if (name === 'Boolean') return `${readableValue(node.arguments[0], source)}有效`;
    if (name === 'remainingUses') return '尚有使用次数';
    return `${label(name.replace(/^.*\./, ''))}条件成立`;
  }
  if (ts.isPropertyAccessExpression(node)) {
    if (code(node, source) === 'weapon.condition') return '所选武器的资源与军备要求已满足';
    return `${readableValue(node, source)}已成立`;
  }
  if (ts.isIdentifier(node)) return `${label(node.text)}成立`;
  return readableValue(node, source);
}

function stringResult(node, source) {
  if (!node) return undefined;
  const result = returnExpression(node);
  return result && ts.isStringLiteralLike(result) ? result.text : undefined;
}

function changeText(key, value, source) {
  const name = label(key);
  if (!value) return `${name}变化`;
  if (value.kind === ts.SyntaxKind.UndefinedKeyword || ts.isIdentifier(value) && value.text === 'undefined') return `清除${name}`;
  if (ts.isStringLiteralLike(value)) return `${name}设为${readableValue(value, source)}`;
  if (ts.isNumericLiteral(value)) return `${name}设为${value.text}${key.endsWith('_timer') ? '个月' : ''}`;
  if (value.kind === ts.SyntaxKind.TrueKeyword) return `${name}启用`;
  if (value.kind === ts.SyntaxKind.FalseKeyword) return `${name}关闭`;
  const raw = code(value, source);
  const delta = raw.match(/(?:\.|\b)\w+\s*([+-])\s*(\d+(?:\.\d+)?)(?:\s*\*\s*(\w+))?/)
    ?? raw.match(/\)\s*([+-])\s*(\d+(?:\.\d+)?)/);
  if (delta) {
    const multiplier = delta[3] === 'get' && raw.includes('getDissentMultiplier') ? '派系分歧系数' : label(delta[3]);
    return `${name}${delta[1]}${delta[2]}${delta[3] ? `×${multiplier}` : ''}${raw.includes('Math.min(100') ? '（上限100）' : ''}${raw.includes('Math.max(0') ? '（下限0）' : ''}`;
  }
  const constantDelta = raw.match(/\b([+-])\s*([A-Z][A-Z_0-9]+)\b/);
  if (constantDelta) {
    const definition = activeNames.get(constantDelta[2]);
    if (definition && ts.isNumericLiteral(definition)) return `${name}${constantDelta[1]}${definition.text}`;
  }
  if (/^Math\.max\(0,\s*\w+\.\w+\s*-\s*\d+/.test(raw)) return `${name}减少并保证不低于0`;
  if (ts.isConditionalExpression(value)) return `${name}随条件变化`;
  if (ts.isCallExpression(value)) return `${name}按规则调整`;
  if (ts.isIdentifier(value)) return `${name}更新`;
  return `${name}更新`;
}

function helperText(call, source) {
  const name = code(call.expression, source).replace(/^.*\./, '');
  const args = call.arguments;
  const arg = (i) => args[i] ? readableValue(args[i], source) : '';
  if (name === 'adjustClassSupport') return `${arg(1)}对${arg(2)}支持${signed(arg(3))}`;
  if (name === 'adjustFactionInfluence') return `${arg(1)}影响力${signed(arg(2))}`;
  if (name === 'adjustFactionDissent') return `${arg(1)}分歧${signed(arg(2))}`;
  if (name === 'adjustAllActiveFactionDissent') return `所有活跃派系分歧${signed(arg(1))}`;
  if (name === 'adjustFactionDissents' && ts.isObjectLiteralExpression(args[1])) return args[1].properties.filter((p) => propName(p)).map((p) => `${label(propName(p))}分歧${signed(readableValue(p.initializer, source))}`).join('、');
  if (name === 'applyUnionShareDelta' && ts.isObjectLiteralExpression(args[1])) return `工会份额：${args[1].properties.filter((p) => propName(p)).map((p) => `${label(propName(p))}${signed(readableValue(p.initializer, source))}`).join('、')}`;
  if (name === 'adjustMilitarization') return `${arg(1)}军事化率${signed(arg(2))}`;
  if (name === 'adjustCntMilitiaManpower') return `CNT民兵人力${signed(arg(1))}`;
  if (name === 'raiseSecurityCorpsLoyalty') return `${arg(1)}忠诚度${signed(arg(2))}`;
  if (name === 'applyEconomicOption') {
    const changes = args[2];
    if (ts.isObjectLiteralExpression(changes)) {
      const areas = [];
      for (const area of changes.properties) {
        if (!ts.isPropertyAssignment(area) || !ts.isObjectLiteralExpression(area.initializer)) continue;
        const deltas = area.initializer.properties.filter((p) => ts.isPropertyAssignment(p)).map((p) => `${label(propName(p))}${signed(readableValue(p.initializer, source))}`);
        if (deltas.length) areas.push(`${label(propName(area))}：${deltas.join('、')}`);
      }
      if (areas.length) return areas.join('；');
    }
    return '调整生产资料所有权与经济结构';
  }
  if (name === 'concludeForeignPolicy') {
    const payload = args[0];
    const parts = [];
    function visitPayload(obj, prefix = '') {
      for (const p of obj.properties) {
        if (!ts.isPropertyAssignment(p)) continue;
        const key = propName(p);
        if (key === 'currentEvent') continue;
        if (ts.isObjectLiteralExpression(p.initializer)) visitPayload(p.initializer, `${prefix}${label(key)}·`);
        else if (!['factions', 'classes', 'stats'].includes(key)) parts.push(`${prefix}${changeText(key, p.initializer, source)}`);
      }
    }
    if (ts.isObjectLiteralExpression(payload)) visitPayload(payload);
    return `${parts.join('；')}${parts.length ? '；' : ''}结束外交政策并进入2个月冷却`;
  }
  return undefined;
}

function effectText(node, source, byName) {
  if (ts.isIdentifier(node) && byName.has(node.text)) node = byName.get(node.text);
  if (ts.isPropertyAccessExpression(node)) return '按所选目标的专属规则结算成功或失败效果';
  const rootBody = functionBody(node);
  const normalizedBody = rootBody && ts.isParenthesizedExpression(rootBody) ? rootBody.expression : rootBody;
  const changes = [];
  let returns = 0;
  function add(value) { if (value && !changes.includes(value)) changes.push(value); }
  function describeObject(obj, prefix = '') {
    for (const p of obj.properties) {
      if (ts.isSpreadAssignment(p)) continue;
      const key = propName(p);
      const value = initializer(obj, key);
      if (!key || !value) continue;
      if (key === 'currentEvent') {
        if (value.kind === ts.SyntaxKind.NullKeyword) add('结束当前事件');
        else if (ts.isObjectLiteralExpression(value)) add(`进入“${display(initializer(value, 'titleZh') ?? initializer(value, 'title'), source)}”事件`);
        else add('进入后续事件或返回事件菜单');
      } else if (ts.isObjectLiteralExpression(value)) describeObject(value, `${prefix}${label(key)}·`);
      else if (key !== 'classes' && key !== 'factions' && key !== 'stats' && key !== 'partyRelations' && key !== 'relations') add(`${prefix}${changeText(key, value, source)}`);
    }
  }
  function visit(node, isRoot = false) {
    if (!node) return;
    if (!isRoot && (ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node))) return;
    const returned = ts.isReturnStatement(node) && node.expression && ts.isParenthesizedExpression(node.expression) ? node.expression.expression : node.expression;
    if (ts.isReturnStatement(node) && returned && ts.isObjectLiteralExpression(returned)) {
      returns++;
      describeObject(returned);
    }
    if (ts.isCallExpression(node)) add(helperText(node, source));
    ts.forEachChild(node, (child) => visit(child));
  }
  if (normalizedBody && ts.isObjectLiteralExpression(normalizedBody)) { returns++; describeObject(normalizedBody); visit(normalizedBody, true); }
  else visit(normalizedBody, true);
  if (returns > 1) add('结果随条件或随机判定分支变化');
  return changes.join('；');
}

function entranceSummary(expr, source) {
  if (!expr || !ts.isArrowFunction(expr) && !ts.isFunctionExpression(expr)) return '进入卡牌决策';
  let body = expr.body;
  if (ts.isBlock(body)) {
    const returns = body.statements.filter(ts.isReturnStatement);
    body = returns.at(-1)?.expression;
  }
  if (body && ts.isParenthesizedExpression(body)) body = body.expression;
  if (!body || !ts.isObjectLiteralExpression(body)) return '进入卡牌决策，具体流程随当前局势变化';
  const fields = body.properties.map((field) => {
    const key = propName(field);
    if (ts.isSpreadAssignment(field)) return '按当前局势结算附加效果';
    const value = ts.isShorthandPropertyAssignment(field) ? field.name : field.initializer;
    if (key === 'currentEvent') {
      if (ts.isObjectLiteralExpression(value)) return `进入“${display(initializer(value, 'titleZh') ?? initializer(value, 'title'), source)}”事件`;
      return '进入卡牌决策事件';
    }
    return key ? changeText(key, value, source) : '更新状态';
  });
  return fields.join('；') || '进入卡牌决策';
}

function optionTitle(node, source) {
  if (!node) return '未命名选项';
  if (ts.isStringLiteralLike(node)) return node.text;
  const value = returnExpression(node) ?? node;
  if (ts.isTemplateExpression(value) || ts.isNoSubstitutionTemplateLiteral(value)) {
    return code(value, source).slice(1, -1).replaceAll(/\$\{[^}]+\}/g, '随局势变化');
  }
  return '动态选项';
}

const optionOverrides = {
  fundraising: {
    1: { title: '维持当前会费', effect: '获得与当前会费等级相同数值的资源，会费等级保持不变。' },
    2: { title: '降低会费', condition: '当前会费等级高于1', effect: '会费等级−1；资源增加降低后的会费等级数值；所有活跃派系分歧−8。' },
    3: { title: '提高会费', effect: '会费等级+1；资源增加新的会费等级数值；工人与雇农对CNT-FAI支持各−3。若会费升至5级，两类支持各−15。' },
  },
  mitinPopular: {
    1: { effect: '集会结束；革命热情减少3×（1−派系分歧系数），最低为0。' },
    2: { effect: '工人对CNT-FAI支持增加4×派系分歧系数，知识分子支持增加3×该系数，革命热情增加5×该系数。社会紧张度超过60时被捕概率60%，否则30%；被捕则另失1资源并驱散集会，未被捕则继续集会。' },
    3: { effect: '比较CNT防线力量与国民警卫队压力。守住时，无政府主义派影响力+3、分歧−3，民兵力量+5，革命热情增加8×派系分歧系数，集会继续；失守时，资源−1、无政府主义派分歧+5、民兵力量−3、革命热情减少2×该系数，集会被驱散。' },
    5: { effect: '比较CNT街头力量与长枪党力量。获胜时，工人与小资产阶级对CNT-FAI支持分别增加5×、2×派系分歧系数，长枪党关系−5，民兵力量+3、革命热情增加6×该系数，集会继续；失利时资源−2，工人对CNT-FAI支持−3、对长枪党支持+1，小资产阶级对长枪党支持+2，长枪党关系−8、民兵力量−5，集会被驱散。' },
  },
  internationalContacts: {
    2: { effect: '消耗1资源；葡萄牙关系−5；无政府主义派影响力+5，纯粹派影响力增加四舍五入后的“5×派系分歧系数”；葡萄牙秘密行动能力+1。' },
    3: { effect: '消耗1资源；意大利与德国关系各−10；无政府主义派影响力+5，工会派影响力增加四舍五入后的“3×派系分歧系数”；CNT民兵人力+150。' },
  },
  propagandaByDeed: {
    2: { effect: '无政府主义派分歧+5；革命热情增加3×派系分歧系数；结束当前事件。' },
    9: { title: '针对所选目标进行特训', condition: '至少2资源，且该目标专项训练尚未达到30', effect: '消耗2资源；所选目标的专项训练+15（最多30），因此该目标的暗杀成功率相应提高；结束当前事件。' },
    10: { title: '全运动通用训练', condition: '至少2资源，且通用训练尚未达到10', effect: '消耗2资源；全目标通用训练+5（最多10），因此所有目标的暗杀成功率相应提高；结束当前事件。' },
  },
  anarchyTanks: {
    4: { effect: '消耗1军备；坦克研发进度+25（最多100）；进入研发报告。' },
    5: { effect: '消耗2军备，纯粹派分歧+5；研发进度有50%概率+50、25%概率+25、15%概率不变、10%概率−25，结果限制在0–100；进入研发报告。' },
    6: { effect: '消耗1资源。成功率：简单与沙盒75%，普通50%，困难30%。成功时解锁装甲车辆，CNT与西共军事化率各+6，三十人派、工会派、无政府主义派、纯粹派分歧各−5。失败时CNT民兵人力−1000；困难难度将研发进度归零，并使无政府主义派分歧+5、纯粹派分歧+10；普通难度研发进度−25；简单与沙盒难度保留研发进度。最后进入实战测试报告。' },
  },
  prepareForRevolution: {
    1: { title: '武装民兵', condition: '至少1军备、CNT民兵军事化率低于40，且本手段累计使用未满5次', unavailable: '军备不足、CNT民兵军事化率达到40，或本手段累计已使用5次时不可选。', effect: '消耗1军备；CNT民兵军事化率+2（和平时期最多40）；本手段使用次数+1；结束本次选择，设置4个月冷却。' },
    2: { title: '争取武装部队', condition: '至少1军备，且本手段累计使用未满5次', unavailable: '军备不足，或本手段累计已使用5次时不可选。', effect: '消耗1军备；军队忠诚度+3（最多100）；本手段使用次数+1；结束本次选择，设置4个月冷却。' },
    3: { title: '破坏反动派', condition: '至少1军备，本手段累计使用未满5次，且至少存在一支右翼民兵', unavailable: '军备不足、没有已成立的右翼民兵，或本手段累计已使用5次时不可选。', effect: '消耗1军备；已经成立的卡洛斯派雷盖特、长枪党一线民兵军事化率各−2；本手段使用次数+1；结束本次选择，设置4个月冷却。' },
    4: { effect: '本次不采取准备手段；结束事件，设置4个月冷却。' },
  },
  armsAcquisition: {
    1: { effect: '消耗1资源；n为法国秘密行动累计次数，以50%＋n×10%（最高90%）的概率获得1＋n军备；失败时不获得军备。无论结果如何，本次事件结束。' },
  },
  fiscalPolicy: {
    1: { effect: '锁定所得税草案；按照下层、中层、上层税率相对审查基准的改变量，一次性调整对应阶级对CNT-FAI的支持以及无政府主义派、纯粹派分歧；返回财政审查菜单。此时尚未写入实际税率。' },
    3: { effect: '锁定关税与消费税草案；按照草案相对审查基准的改变量，一次性调整工人与雇农支持、无政府主义派与纯粹派分歧，以及英国、法国关系；返回财政审查菜单。此时尚未写入实际税率。' },
    7: { effect: '将所有所得税、关税和消费税草案一次性写入正式税率；清除临时基准、草案和提交标记；财政政策冷却6个月，结束审查。税款只在之后的月度结算入账。' },
  },
};

function optionSection(option, source, relativePath, ordinal, byName, cardName) {
  const title = optionTitle(initializer(option, 'textZh') ?? initializer(option, 'text'), source);
  const subtitle = initializer(option, 'subtitleZh') ?? initializer(option, 'subtitle');
  const cond = initializer(option, 'condition');
  const unavailable = initializer(option, 'unavailableSubtitleZh') ?? initializer(option, 'unavailableSubtitle');
  const effect = initializer(option, 'effect');
  const gate = visibility(option, source);
  const lead = subtitle && ts.isStringLiteralLike(subtitle) ? subtitle.text : '';
  const mechanics = effectText(effect, source, byName);
  const override = optionOverrides[cardName]?.[ordinal];
  const unavailableText = stringResult(unavailable, source);
  const computedCondition = cond ? conditionText(cond, source, byName) : '无额外条件';
  const readableCondition = unavailableText && /\([^)]*\)|条件成立|\b[a-z]+[A-Z]|\?/.test(computedCondition)
    ? `需满足以下限制：${unavailableText}` : computedCondition;
  const output = [
    `#### ${ordinal}. ${override?.title ?? title}`,
    '',
    `- **所在事件：** ${enclosingEvent(option, source)}`,
    `- **出现条件：** ${gate.length ? gate.map((item) => `${item.negate ? '不满足' : '满足'}“${conditionText(item.expression, source, byName)}”`).join('，且') : '始终显示'}`,
    `- **可选条件：** ${override?.condition ?? readableCondition}`,
    `- **选项效果：** ${override?.effect ?? `${[lead, mechanics].filter(Boolean).map((part) => part.replace(/[。；\s]+$/g, '')).join('；')}。`}`,
  ];
  if (unavailable) output.splice(4, 0, `- **条件不足时：** ${override?.unavailable ?? unavailableText ?? '该选项不可用'}`);
  output.push('');
  return output;
}

function specialSection(name, source, byName, relativePath) {
  const out = [];
  if (name === 'propagandaByDeed') {
    out.push('### 动态目标、武器与判定', '',
      '“刺杀目标”“选择武器”“针对目标特训”等选项由目标和武器数据表循环生成。下面逐项列出目标门槛、成功与失败效果，以及武器消耗和风险。', '');
    const targets = byName.get('TARGETS');
    if (targets && ts.isObjectLiteralExpression(targets)) {
      for (const entry of targets.properties) {
        if (!ts.isPropertyAssignment(entry) || !ts.isObjectLiteralExpression(entry.initializer)) continue;
        const target = entry.initializer;
        const label = display(initializer(target, 'nameZh'), source);
        out.push(`#### 目标：${label}`, '',
          `- **目标条件：** ${conditionText(initializer(target, 'gate'), source, byName)}；目标尚未死亡。`,
          `- **基础成功率修正：** ${display(initializer(target, 'modifier'), source)}个百分点`,
          `- **成功效果：** ${effectText(initializer(target, 'success'), source, byName)}。`,
          `- **失败效果：** ${effectText(initializer(target, 'failure'), source, byName)}。`, '');
      }
    }
    const weapons = byName.get('WEAPONS');
    if (weapons && ts.isObjectLiteralExpression(weapons)) {
      out.push('#### 武器一览', '', '| 武器 | 选项条件 | 资源 | 军备 | 成功率修正 | 被捕风险 | 连带伤害风险 |',
        '| --- | --- | ---: | ---: | ---: | ---: | ---: |');
      for (const entry of weapons.properties) {
        if (!ts.isPropertyAssignment(entry) || !ts.isObjectLiteralExpression(entry.initializer)) continue;
        const weapon = entry.initializer;
        const item = (key) => display(initializer(weapon, key), source);
        out.push(`| ${item('nameZh')} | ${conditionText(initializer(weapon, 'condition'), source, byName)} | ${item('resourcesCost')} | ${item('armamentsCost')} | ${item('modifier')} | ${item('captureRisk')} | ${item('collateralRisk')} |`);
      }
      out.push('');
    }
    out.push('成功率以基础值 65% 为起点，叠加目标和武器修正、目标训练与通用训练，扣除紧张度惩罚，最后限制在 5%–95%。', '');
  }
  if (name === 'fiscalPolicy') {
    out.push('### 专用税率草案界面', '',
      '所得税组与关税/消费税组使用专用界面。每次点击 −5、−1、+1、+5 按钮只更新草案，税率被限制在 1%–100%；点击相应“提交”选项结算政治反应，最终“结束审查”选项才写入全部税率。', '');
  }
  if (name === 'policeAffairs') {
    out.push('### 三个警卫队忠诚度选项', '',
      '主事件的前三个选项分别针对以下警卫队。', '',
      '| 选项 | 可选条件 | 选项效果 |', '| --- | --- | --- |',
      '| 提高国民警卫队忠诚 | 国民警卫队人力 > 0 | 国民警卫队忠诚度 +5；警察事务冷却 6 个月 |',
      '| 提高突击卫队忠诚 | 突击卫队人力 > 0 | 突击卫队忠诚度 +5；警察事务冷却 6 个月 |',
      '| 提高共和国警卫队忠诚 | 共和国警卫队人力 > 0 | 共和国警卫队忠诚度 +5；警察事务冷却 6 个月 |', '');
  }
  return out;
}

function cardSection({ name, file }, family) {
  if (!file) throw new Error(`Missing import for ${name}`);
  let relativePath = `src/game/${family}/${file.replace('./', '')}`;
  if (!fs.existsSync(path.join(root, relativePath))) relativePath = relativePath.replace(/\.ts$/, '.tsx');
  const absolutePath = path.join(root, relativePath);
  const source = ts.createSourceFile(absolutePath, fs.readFileSync(absolutePath, 'utf8'), ts.ScriptTarget.Latest, true,
    absolutePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const byName = declarations(source);
  activeNames = byName;
  const card = findCard(source);
  if (!card) throw new Error(`Missing card object in ${relativePath}`);
  const title = display(initializer(card, 'titleZh') ?? initializer(card, 'title'), source);
  const english = display(initializer(card, 'title'), source);
  const cardId = display(initializer(card, 'id'), source);
  const options = findOptions(source).filter((option) =>
    !(name === 'policeAffairs' && code(initializer(option, 'text'), source) === 'text'));
  const descriptionNode = initializer(card, 'descriptionZh') ?? initializer(card, 'description');
  const description = descriptionNode && ts.isIdentifier(descriptionNode) && byName.has(descriptionNode.text)
    ? display(byName.get(descriptionNode.text), source) : display(descriptionNode, source);
  const cost = display(initializer(card, 'cost'), source);
  const resourceCost = initializer(card, 'resourceCost');
  const armamentCost = initializer(card, 'armamentCost');
  const condition = initializer(card, 'condition');
  const cardCondition = name === 'prepareForRevolution'
    ? '内战尚未开始、防卫委员会已启用、准备革命未在冷却，且三种手段至少还有一次可用次数'
    : condition ? conditionText(condition, source, byName) : '无额外卡牌条件';
  const out = [
    `<a id="card-${cardId}"></a>`,
    '',
    `## ${title} / ${english}`,
    '',
    `- **卡牌：** ${title}`, 
    `- **用途：** ${description}`,
    `- **行动点：** ${cost}${resourceCost ? `；资源成本：${display(resourceCost, source)}` : ''}${armamentCost ? `；军备成本：${display(armamentCost, source)}` : ''}`,
    `- **打出条件：** ${cardCondition}`,
    `- **打出后的直接效果：** ${entranceSummary(initializer(card, 'effect'), source)}`, 
    '',
  ];
  if (name === 'prepareForRevolution') {
    out.push('每次打出这张卡牌只能选择一个选项。前三种准备手段各自累计最多选择5次；“本次暂不准备”不消耗手段次数。选择任一选项后，本次事件结束，卡牌冷却4个月。', '');
  }
  if (name === 'policeAffairs') {
    out.push(...specialSection(name, source, byName, relativePath));
    out.push(`### 其余选项（${options.length} 项）`, '');
  } else {
    out.push(`### 选项（${options.length} 项）`, '');
  }
  options.forEach((option, index) => out.push(...optionSection(option, source, relativePath, index + 1, byName, name)));
  if (!options.length) out.push('此文件没有静态选项对象，交互由自定义界面实现。', '');
  if (name !== 'policeAffairs') out.push(...specialSection(name, source, byName, relativePath));
  return { content: out, count: options.length, name: title, id: cardId };
}

for (const [folder, label, outputName, arrayName] of families) {
  const index = path.join(root, 'src/game', folder, 'index.ts');
  const registered = getRegisteredNames(index, arrayName);
  const sections = registered.map((entry) => cardSection(entry, folder));
  const lines = [
    `# ${label}详解`,
    '',
    `依据当前游戏内容整理，共 ${registered.length} 张卡牌。`,
    '',
    '## 阅读说明',
    '',
    '- “打出条件”是卡牌本身的门槛；仍须满足游戏通用的行动点、资源及手牌规则。',
    '- “出现条件”表示选项何时列在事件中；“可选条件”表示列出后何时可以点击。',
    '- “选项效果”先写选项文本提供的说明，再列出实际数值、状态、冷却与事件变化。随机判定和条件分支会在文字中说明。',
    '- 同一事件的菜单跳转和结果确认也列出；按目标或武器生成的选项作为模板说明，具体目标见附表。',
    '',
    '## 卡牌目录',
    '',
    ...sections.map((s) => `- [${s.name}](#card-${s.id})`),
    '',
  ];
  for (const section of sections) lines.push(...section.content);
  const document = lines.join('\n') + '\n';
  const opened = (document.match(/<details>/g) ?? []).length;
  const closed = (document.match(/<\/details>/g) ?? []).length;
  if (opened !== closed) throw new Error(`${outputName}: unbalanced details tags`);
  for (const match of document.matchAll(/\.\.\/(src\/[^)#]+)#L(\d+)/g)) {
    const sourcePath = path.join(root, match[1]);
    const sourceLines = fs.readFileSync(sourcePath, 'utf8').split(/\r?\n/).length;
    if (Number(match[2]) > sourceLines) throw new Error(`${outputName}: invalid source line ${match[0]}`);
  }
  fs.writeFileSync(path.join(root, 'docs', outputName), document, 'utf8');
  process.stdout.write(`${outputName}: ${registered.length} cards, ${sections.reduce((n, s) => n + s.count, 0)} option definitions\n`);
}
