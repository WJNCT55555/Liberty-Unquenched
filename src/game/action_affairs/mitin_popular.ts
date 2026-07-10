import { Card, Faction, GameEvent, GameState, SocialClass } from '../types';
import {
  adjustAllActiveFactionDissent,
  adjustClassSupport,
  adjustFactionDissent,
  adjustFactionDissents,
  adjustFactionInfluence,
  getDissentMultiplier
} from '../utils';
import { prrevsCampaigning } from './prrevs_campaigning';
import { strike } from './strike';
import type { ClassPoliticalForce } from '../utils';
import {
  classSupportPreview,
  effectLine,
  eventPreview,
  factionDissentPreview,
  factionInfluencePreview,
  resourcePreview,
  statPreview,
  textPreview
} from '../effectPreview';

const MITIN_POPULAR_COOLDOWN = 6;

type ClassSupportDelta = [SocialClass, ClassPoliticalForce, number];

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));
const clampRelation = (value: number) => Math.max(-100, Math.min(100, value));

const adjustClassSupports = (
  classes: GameState['classes'],
  deltas: ClassSupportDelta[]
): GameState['classes'] => {
  return deltas.reduce((updatedClasses, [targetClass, targetForce, delta]) => {
    return adjustClassSupport(updatedClasses, targetClass, targetForce, delta);
  }, classes);
};

const influenceThenDissent = (
  factions: GameState['factions'],
  targetFaction: Faction,
  influenceDelta: number,
  dissentDeltas: Partial<Record<Faction, number>>
): GameState['factions'] => {
  const influencedFactions = adjustFactionInfluence(factions, targetFaction, influenceDelta);
  return adjustFactionDissents(influencedFactions, dissentDeltas);
};

export const mitinPopular: Card = {
  id: 'mitin_popular',
  title: 'Popular Assembly',
  titleZh: '群众集会',
  type: 'Action',
  description: 'Mass assemblies are the lifeblood of anarcho-syndicalism. Workers, peasants, and the dispossessed gather in plazas and union halls to debate, to listen, and to decide the path forward. Every assembly is both a school of libertarian thought and a weapon against the state.',
  descriptionZh: '群众集会是安那其工团主义的命脉。工人、农民和被剥夺者在广场和工会大厅聚集，辩论、倾听、决定前进的道路。每一次集会既是自由意志思想的学校，也是对抗国家的武器。',
  cost: 1,
  condition: (state: GameState) => {
    return (state.mitin_popular_timer || 0) <= 0;
  },
  effect: (state: GameState): Partial<GameState> => {
    const dissentFactor = getDissentMultiplier(state.factions);
    const options: GameEvent['options'] = [];

    const gcCondition = state.stats.tension > 40 && state.cntStance !== 'govern';
    const feCondition = (state.fe_founded || state.falange_jons) && state.partySupport.FE > 15;

    // Populated after the theme options are built; disruption chains use it to route back to the assembly.
    let buildMainAssemblyEvent: (df: number) => GameEvent;

    const resolveFE = (s: GameState, df: number): Partial<GameState> => {
      const cntMilitancy = s.stats.anarchistMilitia * 1.2 + s.stats.workerControl * 0.8;
      const falangeMilitancy = s.partySupport.FE * 1.8;
      const success = cntMilitancy >= falangeMilitancy;

      if (success) {
        const classes = adjustClassSupports(s.classes, [
          ['Obreros', 'CNT_FAI', 5 * df],
          ['PequenaBurguesia', 'CNT_FAI', 2 * df]
        ]);

        return {
          classes,
          partyRelations: {
            ...s.partyRelations,
            FE: clampRelation((s.partyRelations.FE || 0) - 5)
          },
          stats: {
            ...s.stats,
            anarchistMilitia: clampPercent(s.stats.anarchistMilitia + 3),
            revolutionaryFervor: clampPercent(s.stats.revolutionaryFervor + 6 * df)
          }
        };
      }

      const classes = adjustClassSupports(s.classes, [
        ['Obreros', 'CNT_FAI', -3],
        ['Obreros', 'FE', 1],
        ['PequenaBurguesia', 'FE', 2]
      ]);

      return {
        resources: Math.max(0, s.resources - 2),
        classes,
        partyRelations: {
          ...s.partyRelations,
          FE: clampRelation((s.partyRelations.FE || 0) - 8)
        },
        stats: {
          ...s.stats,
          anarchistMilitia: Math.max(0, s.stats.anarchistMilitia - 5)
        }
      };
    };

    const buildCancelledEvent = (df: number, reasonEn: string, reasonZh: string): GameEvent => ({
      id: 'mitin_cancelled',
      date: { year: state.year, month: state.month },
      title: 'Assembly Dispersed',
      titleZh: '集会取消',
      description: `${reasonEn} The red-and-black flags are furled; compañeros exchange grim looks. The crowd melts into the side streets—today's assembly is over before it could truly begin.`,
      descriptionZh: `${reasonZh} 红黑旗帜被卷起，同志们交换着沉重的目光。人群消散在小巷中——今天的集会在真正开始之前就结束了。`,
      options: [
        {
          text: 'Regroup and live to fight another day.',
          textZh: '重新集结，来日再战。',
          subtitle: 'The struggle continues. Today was a setback, not a defeat.',
          subtitleZh: '斗争还在继续。今天只是挫折，不是失败。',
          effectPreview: () => [
            effectLine('Revolutionary fervor', '革命热情', -3 * (1 - df)),
            textPreview('End current event', '结束当前事件')
          ],
          effect: (s: GameState): Partial<GameState> => {
            return {
              stats: {
                ...s.stats,
                revolutionaryFervor: Math.max(0, s.stats.revolutionaryFervor - 3 * (1 - df))
              },
              currentEvent: null
            };
          }
        }
      ]
    });

    const buildGCOptions = (
      df: number,
      onSuccessCb: (df: number) => GameEvent
    ): GameEvent['options'] => [
      {
        text: 'Stand our ground peacefully. Let them arrest us if they dare.',
        textZh: '和平地坚守阵地。让他们逮捕我们，如果他们敢的话。',
        subtitle: 'Nonviolent resistance exposes state repression for what it is.',
        subtitleZh: '非暴力抵抗将国家镇压的本质暴露在光天化日之下。',
        effectPreview: (s2: GameState) => {
          const arrestChance = s2.stats.tension > 60 ? 60 : 30;
          return [
            textPreview(`Arrest chance: ${arrestChance}%.`, `被逮捕概率：${arrestChance}%。`),
            classSupportPreview(s2, 'Obreros', 'CNT_FAI', 4 * df),
            classSupportPreview(s2, 'Intelectuales', 'CNT_FAI', 3 * df),
            statPreview(s2, 'revolutionaryFervor', 5 * df),
            textPreview(
              'If arrested: resources -1, pro-Republic sentiment -2, then the assembly is dispersed.',
              '若被逮捕：资源 -1，亲共和国倾向 -2，然后集会被驱散。',
              'negative'
            ),
            textPreview(
              'If not arrested: pro-Republic sentiment +1, then return to the assembly.',
              '若未被逮捕：亲共和国倾向 +1，然后返回集会。',
              'positive'
            )
          ];
        },
        effect: (s2: GameState): Partial<GameState> => {
          const arrestRoll = s2.stats.tension > 60 ? 0.6 : 0.3;
          const arrested = Math.random() < arrestRoll;
          const classes = adjustClassSupports(s2.classes, [
            ['Obreros', 'CNT_FAI', 4 * df],
            ['Intelectuales', 'CNT_FAI', 3 * df]
          ]);

          return {
            ...(arrested ? { resources: Math.max(0, s2.resources - 1) } : {}),
            classes,
            stats: {
              ...s2.stats,
              revolutionaryFervor: clampPercent(s2.stats.revolutionaryFervor + 5 * df)
            },
            pro_republic: s2.pro_republic + (arrested ? -2 : 1),
            currentEvent: arrested
              ? buildCancelledEvent(
                  df,
                  'Compañeros are dragged away in handcuffs. The Guardia Civil has made its point—resistance is punished with steel and prison.',
                  '同志们被戴上手铐拖走了。国民卫队用钢铁和监狱表明了他们的立场——抵抗必将受到惩罚。'
                )
              : onSuccessCb(df)
          };
        }
      },
      {
        text: 'Form a defensive cordon with our militants. They will not pass.',
        textZh: '用我们的激进分子组成防线。他们休想通过。',
        subtitle: 'The anarchist youth and union toughs link arms in front of the crowd.',
        subtitleZh: '安那其青年和工会硬汉们在人群前排起了人墙。',
        effectPreview: (s2: GameState) => {
          const guardStrength = s2.stats.tension * 0.5;
          const cntDefense = s2.stats.anarchistMilitia * 1.5 + s2.stats.workerControl;
          const success = cntDefense >= guardStrength;

          return success
            ? [
                factionInfluencePreview('Faistas', 3),
                factionDissentPreview('Faistas', -3),
                statPreview(s2, 'anarchistMilitia', 5),
                statPreview(s2, 'revolutionaryFervor', 8 * df),
                eventPreview('Popular Assembly', '群众集会')
              ]
            : [
                resourcePreview(-1),
                factionDissentPreview('Faistas', 5),
                statPreview(s2, 'anarchistMilitia', -3),
                statPreview(s2, 'revolutionaryFervor', -2 * df),
                eventPreview('Assembly Dispersed', '集会取消')
              ];
        },
        effect: (s2: GameState): Partial<GameState> => {
          const guardStrength = s2.stats.tension * 0.5;
          const cntDefense = s2.stats.anarchistMilitia * 1.5 + s2.stats.workerControl;
          const success = cntDefense >= guardStrength;
          const factions = success
            ? influenceThenDissent(s2.factions, 'Faistas', 3, { Faistas: -3 })
            : adjustFactionDissent(s2.factions, 'Faistas', 5);

          return {
            ...(success ? {} : { resources: Math.max(0, s2.resources - 1) }),
            factions,
            stats: {
              ...s2.stats,
              anarchistMilitia: clampPercent(s2.stats.anarchistMilitia + (success ? 5 : -3)),
              revolutionaryFervor: clampPercent(s2.stats.revolutionaryFervor + (success ? 8 : -2) * df)
            },
            currentEvent: success
              ? onSuccessCb(df)
              : buildCancelledEvent(
                  df,
                  'The defensive line buckles under Guardia Civil batons. Militants are beaten back; the plaza belongs to the tricornios tonight.',
                  '防线在国民卫队的警棍下崩溃了。战士们被击退；今晚广场属于三尖帽。'
                )
          };
        }
      },
      {
        text: 'Disperse and regroup later. No sense in martyrs today.',
        textZh: '解散并稍后重新集结。今天没有必要制造殉道者。',
        subtitle: 'Preserve our strength for a more favorable moment.',
        subtitleZh: '保存实力，等待更有利的时机。',
        effectPreview: () => [
          factionDissentPreview('Treintistas', -3),
          factionDissentPreview('Faistas', 5),
          factionDissentPreview('Puristas', 3),
          eventPreview('Assembly Dispersed', '集会取消')
        ],
        effect: (s2: GameState): Partial<GameState> => {
          const factions = adjustFactionDissents(s2.factions, {
            Treintistas: -3,
            Faistas: 5,
            Puristas: 3
          });

          return {
            factions,
            currentEvent: buildCancelledEvent(
              df,
              'We disperse in good order before the Guardia Civil can advance. The assembly is cancelled, but our people are safe.',
              '我们在国民卫队推进之前有序解散了。集会被取消了，但我们的人安全了。'
            )
          };
        }
      }
    ];

    const buildFEChainEvent = (df: number): GameEvent => ({
      id: 'mitin_falange_chain',
      date: { year: state.year, month: state.month },
      title: '¡Falangistas!',
      titleZh: '长枪党来了！',
      description: 'As the dust settles, a new threat emerges. Blue-shirted figures push through the shaken crowd—Falangist pistoleros, emboldened by the chaos, are charging the platform with fists and pistols raised. The assembly hangs by a thread.',
      descriptionZh: '尘埃尚未落定，新的威胁已然浮现。蓝衫身影推开惊魂未定的人群——长枪党手枪手们趁乱冲向讲台，挥舞着拳头和手枪。集会命悬一线。',
      options: [
        {
          text: 'Face them head-on! ¡No pasarán!',
          textZh: '正面对垒！他们休想通过！',
          subtitle: 'Our militants form a battle line. We will not yield the plaza to fascist thugs.',
          subtitleZh: '我们的战士排成战线。我们不会把广场让给法西斯暴徒。',
          effectPreview: (s2: GameState) => {
            const cntMilitancy = s2.stats.anarchistMilitia * 1.2 + s2.stats.workerControl * 0.8;
            const falangeMilitancy = s2.partySupport.FE * 1.8;
            const feSuccess = cntMilitancy >= falangeMilitancy;

            return feSuccess
              ? [
                  classSupportPreview(s2, 'Obreros', 'CNT_FAI', 5 * df),
                  classSupportPreview(s2, 'PequenaBurguesia', 'CNT_FAI', 2 * df),
                  effectLine('Relations with Falange', '与长枪党关系', -5),
                  statPreview(s2, 'anarchistMilitia', 3),
                  statPreview(s2, 'revolutionaryFervor', 6 * df),
                  eventPreview('Popular Assembly', '群众集会')
                ]
              : [
                  resourcePreview(-2),
                  classSupportPreview(s2, 'Obreros', 'CNT_FAI', -3),
                  classSupportPreview(s2, 'Obreros', 'FE', 1),
                  classSupportPreview(s2, 'PequenaBurguesia', 'FE', 2),
                  effectLine('Relations with Falange', '与长枪党关系', -8),
                  statPreview(s2, 'anarchistMilitia', -5),
                  eventPreview('Assembly Dispersed', '集会取消')
                ];
          },
          effect: (s2: GameState): Partial<GameState> => {
            const cntMilitancy = s2.stats.anarchistMilitia * 1.2 + s2.stats.workerControl * 0.8;
            const falangeMilitancy = s2.partySupport.FE * 1.8;
            const feSuccess = cntMilitancy >= falangeMilitancy;

            return {
              ...resolveFE(s2, df),
              currentEvent: feSuccess
                ? buildMainAssemblyEvent(df)
                : buildCancelledEvent(
                    df,
                    'The Falangists have overwhelmed our defenses. Militants are beaten back with bloodied faces. The plaza is lost—the assembly cannot continue under fascist boots.',
                    '长枪党压倒了我们的防线。战士们满脸是血地被击退。广场失守了——在法西斯的铁蹄下集会无法继续。'
                  )
            };
          }
        },
        {
          text: 'Strategic retreat. We cannot win this fight today.',
          textZh: '策略撤退。今天我们打不赢这场仗。',
          subtitle: 'Disengage before the fascists can inflict serious casualties. Live to fight another day.',
          subtitleZh: '在法西斯分子造成严重伤亡之前脱离接触。留得青山在。',
          effectPreview: (s2: GameState) => [
            statPreview(s2, 'anarchistMilitia', -1),
            eventPreview('Assembly Dispersed', '集会取消')
          ],
          effect: (s2: GameState): Partial<GameState> => {
            return {
              stats: {
                ...s2.stats,
                anarchistMilitia: Math.max(0, s2.stats.anarchistMilitia - 1)
              },
              currentEvent: buildCancelledEvent(
                df,
                'We withdraw in good order, but the assembly cannot continue under fascist threat. The blue shirts have won the street—for now.',
                '我们有秩序地撤退了，但在法西斯威胁下集会无法继续进行。蓝衫赢得了街头——暂时的。'
              )
            };
          }
        }
      ]
    });

    const buildGCDisruptionEvent = (df: number): GameEvent => {
      const gcDescription = feCondition
        ? 'The Guardia Civil has surrounded our assembly! If we hold our ground, fascist thugs may try to exploit the chaos. We must respond decisively.'
        : 'The Guardia Civil has surrounded our assembly! We must respond.';
      const gcDescriptionZh = feCondition
        ? '国民卫队包围了我们的集会！如果我们守住了阵地，法西斯暴徒可能会趁乱来袭。我们必须果断应对。'
        : '国民卫队包围了我们的集会！我们必须做出回应。';

      return {
        id: 'mitin_guardia_disruption',
        date: { year: state.year, month: state.month },
        title: '¡La Guardia Civil!',
        titleZh: '国民卫队来了！',
        description: `The plaza buzzes with energy as compañeros take the stage—but a sharp whistle cuts through the air. Green uniforms emerge from side streets. ${gcDescription}`,
        descriptionZh: `广场上充满了活力，同志们走上讲台——但一声尖锐的哨响划破了空气。绿色制服从小巷中涌出。${gcDescriptionZh}`,
        options: buildGCOptions(df, feCondition ? buildFEChainEvent : buildMainAssemblyEvent)
      };
    };

    options.push({
      text: 'An assembly for revolutionary syndicalism.',
      textZh: '一场宣扬革命工团主义的集会。',
      subtitle: 'The union is the embryo of the future society.',
      subtitleZh: '工会是未来社会的胚胎。',
      effect: (s: GameState): Partial<GameState> => {
        const classes = adjustClassSupports(s.classes, [
          ['Obreros', 'CNT_FAI', 4 * dissentFactor],
          ['Braceros', 'CNT_FAI', 3 * dissentFactor],
          ['Intelectuales', 'CNT_FAI', 2 * dissentFactor]
        ]);
        const factions = influenceThenDissent(s.factions, 'Cenetistas', 4, {
          Cenetistas: -5,
          Puristas: 3
        });

        return {
          classes,
          factions,
          stats: {
            ...s.stats,
            workerControl: clampPercent(s.stats.workerControl + 6 * dissentFactor),
            bureaucratization: clampPercent(s.stats.bureaucratization + 1),
            revolutionaryFervor: clampPercent(s.stats.revolutionaryFervor + 3 * dissentFactor)
          },
          currentEvent: null
        };
      }
    });

    options.push({
      text: 'An assembly for libertarian communism.',
      textZh: '一场宣扬自由意志共产主义的集会。',
      subtitle: 'From each according to ability, to each according to need.',
      subtitleZh: '各尽所能，按需分配。',
      effect: (s: GameState): Partial<GameState> => {
        const classes = adjustClassSupports(s.classes, [
          ['Obreros', 'CNT_FAI', 3 * dissentFactor],
          ['Braceros', 'CNT_FAI', 4 * dissentFactor],
          ['Intelectuales', 'CNT_FAI', 3 * dissentFactor],
          ['Clero', 'CNT_FAI', -4 * dissentFactor],
          ['Latifundistas', 'CNT_FAI', -2 * dissentFactor]
        ]);
        const factions = influenceThenDissent(s.factions, 'Puristas', 5, {
          Puristas: -5,
          Treintistas: 5
        });

        return {
          classes,
          factions,
          stats: {
            ...s.stats,
            revolutionaryFervor: clampPercent(s.stats.revolutionaryFervor + 5 * dissentFactor)
          },
          socialism: clampPercent(s.socialism + 4 * dissentFactor),
          currentEvent: null
        };
      }
    });

    options.push({
      text: 'An assembly against fascism at home and abroad.',
      textZh: '一场反对国内外法西斯主义的集会。',
      subtitle: 'Forge a common front with all workers\' organizations against the rising tide of reaction.',
      subtitleZh: '与所有工人组织建立共同阵线，对抗日益高涨的反动势力。',
      condition: (s: GameState) => {
        return s.fe_founded || s.falange_jons || s.stats.tension > 30;
      },
      unavailableSubtitle: () => 'The fascist threat has not yet materialized.',
      unavailableSubtitleZh: () => '法西斯威胁尚未显现。',
      effect: (s: GameState): Partial<GameState> => {
        const classes = adjustClassSupports(s.classes, [
          ['Obreros', 'CNT_FAI', 4 * dissentFactor],
          ['Intelectuales', 'CNT_FAI', 4 * dissentFactor],
          ['PequenaBurguesia', 'CNT_FAI', 2 * dissentFactor]
        ]);
        const factions = adjustAllActiveFactionDissent(s.factions, -4);

        return {
          classes,
          factions,
          partyRelations: {
            ...s.partyRelations,
            PSOE: clampRelation((s.partyRelations.PSOE || 0) + 3),
            POUM: clampRelation((s.partyRelations.POUM || 0) + 4),
            FE: clampRelation((s.partyRelations.FE || 0) - 5)
          },
          stats: {
            ...s.stats,
            anarchistMilitia: clampPercent(s.stats.anarchistMilitia + 5 * dissentFactor),
            revolutionaryFervor: clampPercent(s.stats.revolutionaryFervor + 3 * dissentFactor)
          },
          currentEvent: null
        };
      }
    });

    options.push({
      text: 'An assembly for the PRRevS.',
      textZh: '一场宣扬PRRevS的集会。',
      subtitle: 'Channel the assembly into electoral campaigning for our revolutionary syndicalist party.',
      subtitleZh: '将集会转向革命共和工团党的竞选宣传。',
      condition: (s: GameState) => {
        return prrevsCampaigning.condition ? prrevsCampaigning.condition(s) : true;
      },
      unavailableSubtitle: () => 'Requires the PRRevS to exist, Treintistas to remain active, and campaign cooldown to be ready.',
      unavailableSubtitleZh: () => '需要PRRevS已成立、三十人集团仍活跃，并且竞选冷却已结束。',
      effect: (s: GameState): Partial<GameState> => {
        const campaignResult = prrevsCampaigning.effect(s);

        return {
          currentEvent: campaignResult.currentEvent || null
        };
      }
    });

    options.push({
      text: 'Down with militarism! The army is the school of obedience.',
      textZh: '打倒军国主义！军队是服从的学校。',
      subtitle: 'Denounce the military caste and the colonial war in Morocco that bleeds the people dry.',
      subtitleZh: '谴责军事特权阶层和在摩洛哥吸干人民鲜血的殖民战争。',
      effect: (s: GameState): Partial<GameState> => {
        const classes = adjustClassSupports(s.classes, [
          ['Obreros', 'CNT_FAI', 3 * dissentFactor],
          ['Braceros', 'CNT_FAI', 3 * dissentFactor],
          ['Intelectuales', 'CNT_FAI', 5 * dissentFactor],
          ['Clero', 'CNT_FAI', -1 * dissentFactor]
        ]);
        const factions = adjustFactionDissents(s.factions, {
          Faistas: -3,
          Puristas: -3
        });
        const pacifismEffect = s.pacifism >= 3 ? 1.8 : 1;

        return {
          classes,
          factions,
          stats: {
            ...s.stats,
            armyLoyalty: Math.max(0, s.stats.armyLoyalty - 1),
            revolutionaryFervor: clampPercent(s.stats.revolutionaryFervor + 2 * dissentFactor)
          },
          pacifism: clampPercent(s.pacifism + 3 * dissentFactor * pacifismEffect),
          nationalism: Math.max(0, s.nationalism - 2 * dissentFactor),
          currentEvent: null
        };
      }
    });

    options.push({
      text: 'For bread and work!',
      textZh: '为了面包与工作！',
      subtitle: 'Focus the assembly on concrete economic demands: higher wages and workplace safety.',
      subtitleZh: '将集会焦点放在具体的经济诉求上：提高工资和工作场所安全。',
      effect: (s: GameState): Partial<GameState> => {
        const laborMomentum = 1 + (s.domesticPolicy.max_hours_law + s.domesticPolicy.min_wage + s.domesticPolicy.workplace_safety) * 0.1;
        const classes = adjustClassSupports(s.classes, [
          ['Obreros', 'CNT_FAI', 6 * dissentFactor],
          ['Braceros', 'CNT_FAI', 3 * dissentFactor],
          ['PequenaBurguesia', 'CNT_FAI', -1 * dissentFactor],
          ['Burguesia', 'CNT_FAI', -3 * dissentFactor]
        ]);
        let factions = adjustFactionInfluence(s.factions, 'Cenetistas', 2);
        factions = influenceThenDissent(factions, 'Treintistas', 2, {
          Cenetistas: -4,
          Treintistas: -4,
          Faistas: 3
        });

        return {
          classes,
          factions,
          domesticPolicy: {
            ...s.domesticPolicy,
            min_wage: Math.min(10, s.domesticPolicy.min_wage + 1),
            workplace_safety: Math.min(10, s.domesticPolicy.workplace_safety + 1)
          },
          stats: {
            ...s.stats,
            workerControl: clampPercent(s.stats.workerControl + 5 * dissentFactor * laborMomentum),
            revolutionaryFervor: clampPercent(s.stats.revolutionaryFervor + 2 * dissentFactor)
          },
          currentEvent: null
        };
      }
    });

    options.push({
      text: 'Promote the cooperative commonwealth.',
      textZh: '宣扬合作社共同体。',
      subtitle: 'Promote worker cooperatives, mutual aid societies, and syndicalist enterprises as the foundation of a new economy.',
      subtitleZh: '推广工人合作社、互助会和工团企业，将其作为新经济的基础。',
      effect: (s: GameState): Partial<GameState> => {
        const coopBonus = s.stats.workerControl >= 50 ? 1.4 : 1;
        const classes = adjustClassSupports(s.classes, [
          ['Obreros', 'CNT_FAI', 4 * dissentFactor],
          ['Braceros', 'CNT_FAI', 3 * dissentFactor],
          ['Labradores', 'CNT_FAI', 3 * dissentFactor],
          ['PequenaBurguesia', 'CNT_FAI', 3 * dissentFactor],
          ['Intelectuales', 'CNT_FAI', 1 * dissentFactor],
          ['Burguesia', 'CNT_FAI', -2 * dissentFactor]
        ]);
        let factions = adjustFactionInfluence(s.factions, 'Cenetistas', 4);
        factions = influenceThenDissent(factions, 'Treintistas', 2, {
          Cenetistas: -5,
          Faistas: 2
        });

        return {
          resources: s.resources + 1,
          classes,
          factions,
          stats: {
            ...s.stats,
            workerControl: clampPercent(s.stats.workerControl + 5 * dissentFactor * coopBonus),
            bureaucratization: clampPercent(s.stats.bureaucratization + 1)
          },
          unemployment_rate: Math.max(0, s.unemployment_rate - 0.5 * dissentFactor),
          currentEvent: null
        };
      }
    });

    options.push({
      text: 'Support the Republic\'s agrarian reform.',
      textZh: '支持共和国的土地改革。',
      subtitle: 'Work within the Republican framework to achieve concrete gains for the landless. Reform is the first step toward liberation.',
      subtitleZh: '在共和框架内为无地者争取切实成果。改革是通向解放的第一步。',
      effect: (s: GameState): Partial<GameState> => {
        const classes = adjustClassSupports(s.classes, [
          ['Braceros', 'CNT_FAI', 7 * dissentFactor],
          ['Labradores', 'CNT_FAI', 5 * dissentFactor],
          ['Obreros', 'CNT_FAI', 2 * dissentFactor],
          ['Latifundistas', 'CNT_FAI', -6 * dissentFactor],
          ['Burguesia', 'CNT_FAI', -1 * dissentFactor]
        ]);
        let factions = adjustFactionInfluence(s.factions, 'Treintistas', 3);
        factions = influenceThenDissent(factions, 'Cenetistas', 2, {
          Treintistas: -5,
          Faistas: 4,
          Puristas: 3
        });

        return {
          classes,
          factions,
          partyRelations: {
            ...s.partyRelations,
            PSOE: clampRelation((s.partyRelations.PSOE || 0) + 2)
          },
          domesticPolicy: {
            ...s.domesticPolicy,
            land_reform_progress: clampPercent(s.domesticPolicy.land_reform_progress + 3)
          },
          stats: {
            ...s.stats,
            revolutionaryFervor: clampPercent(s.stats.revolutionaryFervor + 2 * dissentFactor),
            workerControl: clampPercent(s.stats.workerControl + 2 * dissentFactor),
            republicanAuthority: clampPercent(s.stats.republicanAuthority + 1)
          },
          pro_republic: s.pro_republic + 4,
          currentEvent: null
        };
      }
    });

    options.push({
      text: 'Reject the bourgeois land reform!',
      textZh: '反对资产阶级的土地改革！',
      subtitle: 'Government reform is a trick to pacify the peasantry. Only direct expropriation by the workers and peasants themselves can bring true liberation.',
      subtitleZh: '政府改革是安抚农民的诡计。只有工人和农民自己直接征用才能带来真正的解放。',
      effect: (s: GameState): Partial<GameState> => {
        const classes = adjustClassSupports(s.classes, [
          ['Braceros', 'CNT_FAI', 4 * dissentFactor],
          ['Obreros', 'CNT_FAI', 4 * dissentFactor],
          ['Latifundistas', 'CNT_FAI', -4 * dissentFactor],
          ['Labradores', 'CNT_FAI', -1 * dissentFactor]
        ]);
        let factions = adjustFactionInfluence(s.factions, 'Faistas', 5);
        factions = influenceThenDissent(factions, 'Puristas', 3, {
          Faistas: -5,
          Puristas: -3,
          Treintistas: 6,
          Cenetistas: 2
        });

        return {
          classes,
          factions,
          partyRelations: {
            ...s.partyRelations,
            PSOE: clampRelation((s.partyRelations.PSOE || 0) - 3)
          },
          domesticPolicy: {
            ...s.domesticPolicy,
            land_reform_progress: clampPercent(s.domesticPolicy.land_reform_progress + 1)
          },
          stats: {
            ...s.stats,
            revolutionaryFervor: clampPercent(s.stats.revolutionaryFervor + 6 * dissentFactor),
            workerControl: clampPercent(s.stats.workerControl + 3 * dissentFactor)
          },
          socialism: clampPercent(s.socialism + 3 * dissentFactor),
          currentEvent: null
        };
      }
    });

    options.push({
      text: 'The assembly gradually escalates into a strike.',
      textZh: '集会逐渐升级为一场罢工。',
      subtitle: 'Use the crowd\'s momentum to move directly into a strike decision.',
      subtitleZh: '利用群众动员的势头，直接转入罢工决策。',
      condition: (s: GameState) => {
        return s.stats.workerControl >= 50;
      },
      unavailableSubtitle: () => 'Requires Worker Control at least 50.',
      unavailableSubtitleZh: () => '需要工人控制大于等于50。',
      effect: (s: GameState): Partial<GameState> => {
        const strikeResult = strike.effect(s);

        return {
          currentEvent: strikeResult.currentEvent || null
        };
      }
    });

    options.push({
      text: 'The assembly is not the right venue today. Adjourn.',
      textZh: '今天集会不是合适的场合。散会。',
      subtitle: 'Preserve our energy for more opportune moments.',
      subtitleZh: '保存精力，等待更合适的时机。',
      effect: (): Partial<GameState> => {
        return {
          currentEvent: null
        };
      }
    });

    buildMainAssemblyEvent = (df: number): GameEvent => ({
      id: 'mitin_popular_event',
      date: { year: state.year, month: state.month },
      title: 'Popular Assembly',
      titleZh: '群众集会',
      description: `The plaza fills with the murmur of voices—workers in worn overalls, landless braceros with sun-darkened faces, anarchist students, and militant women. The red-and-black flag of the CNT-FAI flutters above the crowd. A compañero takes the makeshift stage: "¡Compañeros y compañeras!" The assembly has begun.

What is the primary message of this assembly? Each theme rallies different segments of our movement and alienates others. Choose wisely—the assembly is both a mirror of our soul and a forge of our future.`,
      descriptionZh: `广场上充满了低语声——穿着破旧工装的工人、面色黝黑的无地雇农、安那其学生和激进女性。CNT-FAI的红黑旗帜在人群上方飘扬。一位同志走上临时搭建的讲台："同志们！"集会开始了。

这次集会的主要信息是什么？每个主题都会动员我们运动中的不同群体，也会疏远另一些群体。请明智选择——集会既是我们灵魂的镜子，也是我们未来的锻造炉。`,
      options
    });

    const openingEvent = gcCondition
      ? buildGCDisruptionEvent(dissentFactor)
      : feCondition
        ? buildFEChainEvent(dissentFactor)
        : buildMainAssemblyEvent(dissentFactor);

    return {
      mitin_popular_timer: MITIN_POPULAR_COOLDOWN,
      currentEvent: openingEvent
    };
  }
};
