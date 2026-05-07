import { GameEvent } from '../types';
import { adjustFactionInfluence } from '../utils';

export const manifestoOfThirty: GameEvent = {
  id: 'The Manifesto of the Thirty',
  date: { year: 1931, month: 8 },
  title: 'The Manifesto of the Thirty',
  titleZh: '三十人宣言',
  description: `The revolutionary rumblings of Durruti and Oliver, along with the crumbling authority of the more moderate National Committee, prompted its members and their allies to act. Thus in the final days of July they issued a manifesto, signed by, all in all, thirty syndicalists and "reformists", close to the Solidaridad circle.
The manifesto claims that the convictions of the authors to the Confederation and to the pains of the working class are stornger than ever. It also points out that the CNT had its part in the fall of the monarchy while also criticizing the inaction of the Provisional government while the economic reality is becoming worse and worse. 
Its main criticism is pointed at the revolutionary fervour of a few "individuals" which romanticize "The Revolution" and its violence. It warns that these "militants" might endanger the collective by acting without preparation towards a revolution that has no clarity and trusts only to chance.
What they propose is a preparation not in martiality, but a moral one, so that the revolution can be the achivement of "the masses", not a few individuals with authority.

"We are most certainly revolutionaries, but we are not cultivating the myth of revolution. 
We seek an end to capitalism and the state, be it red, white or black, not so
we may erect a new tyranny in its place, but so that the economic revolution of the
working class can thwart the reintroduction of all power, whatever its persuasion.
We desire a revolution born from the most profound feelings of people, as it is taking
shape today. We do not want a revolution that is offered to us, perpetrated by
a handful of individuals who, were they to succeed, would, however they label it,
inevitably convert themselves into dictators on the morrow of their triumph. "

While some have agreed with their positions, the more radical comrades and especially those of the FAI feel attacked. They claim that the manifesto is a last ditch attempt of the bureacratic union leaders to preserve their power and call for resignations and deunciations of that shamefull document.`,
  descriptionZh: `杜鲁蒂和奥利弗的革命骚动，以及较为温和的全国委员会权威的崩溃，促使其成员及其盟友采取行动。因此，在7月的最后几天，他们发布了一份宣言，总共有30名工团主义者和“改良派”签署，这些人与《团结报》圈子关系密切。
该宣言声称作者对联盟和工人阶级痛苦的信念比以往任何时候都更加坚定。它还指出，CNT在君主制垮台过程中发挥了作用，同时也批评了临时政府在经济现实日益恶化时的不作为。
其主要批评针对少数“个人”的革命热忱，这些人将“革命”及其暴力浪漫化。它警告说，这些“激进分子”可能会因为在没有准备的情况下采取行动而危及集体，走向一场不明朗且仅凭运气的革命。
他们提出的是一种非军事的、而是道德上的准备，这样革命才能成为“群众”的成就，而不是少数有权威的个人的成就。

“我们当然是革命者，但我们并不崇拜革命神话。
我们寻求结束资本主义和国家，无论是红色的、白色的还是黑色的，不是为了在它的位置上建立一个新的暴政，而是为了让工人阶级的经济革命能够挫败所有权力的重新引入，无论其说服力如何。
我们渴望一场诞生于人们最深层情感的革命，正如它在今天形成的那样。我们不想要一场提供给我们的革命，由少数人策划，如果他们成功了，无论他们如何标记它，不可避免地会在胜利的第二天将自己转变为独裁者。”

虽然有些人同意他们的立场，但更激进的同志，尤其是FAI的同志感到受到了攻击。他们声称该宣言是官僚工会领导人为保留权力而进行的最后尝试，并要求这些可耻文件的签署者辞职并予以谴责。`,
  options: [
    {
      text: 'Wait and see',
      textZh: '静观其变',
      effect: (state) => {
        const newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions.Treintistas.dissent += 5;
        newFactions.Faistas.dissent += 5;
        return { factions: newFactions };
      },
    },
    {
      text: 'Expel the traitors immediately',
      textZh: '立刻把亵渎无政府主义的叛徒开除出去',
      condition: (state) => {
        const faistasInfluence = state.factions.Faistas.influence;
        return faistasInfluence > state.factions.Treintistas.influence &&
               faistasInfluence > state.factions.Cenetistas.influence &&
               faistasInfluence > state.factions.Puristas.influence;
      },
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Treintistas', -state.factions.Treintistas.influence);
        
        const newClasses = JSON.parse(JSON.stringify(state.classes));
        newClasses.Obreros.support.CNT_FAI -= 5;
        newClasses.Intelectuales.support.CNT_FAI -= 3;
        
        // Remove Ángel Pestaña from pool and active
        const newPool = state.advisorPool.filter(a => a.id !== 'Ángel Pestaña');
        const newActive = state.activeAdvisors.map(a => a?.id === 'Ángel Pestaña' ? null : a);
        
        return {
          factions: newFactions,
          classes: newClasses,
          advisorPool: newPool,
          activeAdvisors: newActive,
          treintistasLeft: true
        };
      },
    },
  ],
};
