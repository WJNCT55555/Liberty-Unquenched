import { GameEvent } from '../types';

export const birthOfFeDeLasJons: GameEvent = {
  id: 'The Birth of FE de las JONS',
  date: { year: 1934, month: 2 },
  title: 'The Birth of FE de las JONS',
  titleZh: '长枪党与JONS的合并',
  description: `The Falange Española has officially merged with the Juntas de Ofensiva Nacional-Sindicalista (JONS). This union brings together José Antonio's aristocratic appeal and Ledesma's radical, violent national-syndicalist rhetoric under a single banner: FE de las JONS. Emboldened by their new unity, fascist militias have begun aggressively targeting leftist workers and union leaders in the streets.`,
  descriptionZh: `西班牙长枪党已正式与“国家工团主义进攻委员会”（JONS）合并。这次联合将何塞·安东尼奥的贵族吸引力与莱德斯马激进、暴力的国家工团主义言辞统一在了“FE de las JONS”的旗帜下。受到这种新团结的鼓舞，法西斯民兵开始在街头咄咄逼人地袭击左翼工人和工会领袖。`,
  options: [
    {
      text: 'Let us wait and see',
      textZh: '让我们静观其变',
      effect: (state) => {
        const newClasses = JSON.parse(JSON.stringify(state.classes));
        
        // FE de las JONS gains more support
        newClasses.Latifundistas.support.FE = Math.min(100, newClasses.Latifundistas.support.FE + 5);
        newClasses.PequenaBurguesia.support.FE = Math.min(100, newClasses.PequenaBurguesia.support.FE + 10);
        newClasses.Clero.support.FE = Math.min(100, newClasses.Clero.support.FE + 5);
        
        return {
          classes: newClasses,
          falange_jons: true
        };
      }
    }
  ]
};
