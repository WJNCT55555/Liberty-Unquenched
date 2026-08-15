import type { GameEvent } from '../types';
import { adjustClassSupport, adjustFactionDissent, adjustFactionInfluence } from '../utils';
import { ramonFranco } from '../advisors/ramon_franco';
import { eduardoBarriobero } from '../advisors/eduardo_barriobero';
import { pedroVallina } from '../advisors/pedro_vallina';

const prrevsMeta = {
  category: 'politics' as const,
  flow: 'solo' as const,
  series: ['prrevs'],
};

export const jabaliEvent: GameEvent = {
  id: 'jabali',
  meta: prrevsMeta,
  title: 'Jabalí?',
  titleZh: '野猪议员？',
  description: `As Ángel Pestaña reached the foot of the building that housed Ramón Franco's office, a faint unease gnawed at him. The building sat on a narrow side street off Madrid's Gran Vía, its facade grey with grime, a shuttered tobacconist below. It was hard to imagine that this was the "ground office" of the legendary aviator. Pestaña pulled his coat collar tighter; the wind cut to the bone. Shaking hands with a "Franco" — in CNT circles, the very idea was absurd beyond imagining. The stairwell was dim, and with every step his unease deepened. Pestaña was a calculating man. In his political ledger, expelling the FAI had been a necessary operation, but this next step — wagering everything on Ramón Franco — was like tying the fate of the entire organization to a pilot's fantasy. The door opened. Ramón Franco was shorter than he had imagined, and more wiry. He wore an open-collared shirt, sleeves rolled to the elbows, bent over a large wooden table sketching something. The table was cluttered with atlases of Spanish geography and a half-drunk cup of coffee. On the wall hung a Republican flag; in a frame beside it, a young Ramón stood shoulder to shoulder with his brother Francisco — a photograph from the glorious years of their transatlantic flight together. Pestaña noted the detail. Now Francisco Franco commanded the Foreign Legion in Morocco, while his brother plotted to overthrow the very same Republic. The Franco family dinners must be quite something. "Pestaña." Ramón looked up, his eyes oddly bright. He used no "comrade" or "sir" or any such word. He gestured for his visitor to sit. "You did fine work in Barcelona. Those FAI lunatics should have been shown the door long ago." Pestaña accepted the coffee cautiously, studying Ramón thoughtfully, his gaze drifting to the maps behind him, marked with military garrisons and militia strongholds across Spain, and symbols he could not decipher. "You know why I've come." Pestaña spoke, his voice steady. Ramón Franco was no stranger to him: national hero of the transatlantic flight, a man who in 1930 had taken part in overthrowing the monarch who had decorated him, then exile, return, and back again... His first half-life had been like Spain itself — chaotic but resolute, glorious but adrift; perhaps at heart he was an adventurer, a rebel, a madman... Ramón turned his head slowly; the sunlight slipped away, touching only half his face, leaving the other half in shadow, inscrutable. He stubbed out his cigar in the ashtray, walked to the window, and turned his back to Pestaña. "A position of weight. A chance to put Spain back together the way I like it. An Iberian Federation — Catalonia, the Basque Country, Galicia, Andalusia, even Portugal, perhaps Andorra and Gibraltar — where every people has the right to decide its own destiny. A federal Iberia. A strong Iberia. A truly united Iberia." He turned around, and in his eyes Pestaña saw something he had seen elsewhere — not conviction, but hunger. "What I want is simple: a position of weight, a chance for Iberia to be reborn." Pestaña was silent for a moment, weighing. Ramón Franco was a gambler, a madman, a creature more dangerous than any sans-culotte. He tried to close his eyes and escape the thick cigar smoke of Franco's office, tried to recall the people working in the fields, who looked up and smiled gently at him. Pestaña knew full well the opponents he would face — he had seen them in Moscow, in Milan, in North Africa; and there was also the death of Seguí, and the lawyers who had once helped the CNT. A vast confusion lifted him like a hot-air balloon, shot out from a giant Havana cigar, then dashed him back down: "give ground again" or "one step back, two steps forward"; "give ground again" or "one step back, two steps forward"... Ramón Franco stared at him for a long time. Only the ticking of the wall clock filled the room. Then the aviator burst into laughter, laughing until tears came. "Pestaña, do you know? I like you. At least you don't quote scripture before threatening a man. I like you. I like you very much..." He stepped forward and held out his hand. Pestaña took it. Rough, strong — like gripping the control column of an airplane. On the way downstairs he did not pull his collar up again. The weather still did not agree with him, but the unease had faded. In its place was something more complex — as though he had just swallowed a potent draught, or perhaps only his own personal flicker of the last light...`,
  descriptionZh: '当安赫尔·佩斯塔尼抵达拉蒙·佛朗哥的办公室楼下时，他心中总有一种隐隐的不安。这栋建筑坐落在马德里格兰大道旁一条狭窄的侧街上，外墙灰扑扑的，楼下是一家歇业的烟客店。很难想象，这里就是那位传奇飞行员的“地面办公室”。佩斯塔尼拉了拉大衣领子，风刮得人骨头缝里发凉。和一位“佛朗哥”握手，在CNT的圈子里，这本身就荒诞到难以想象。楼梯间灯光昏暗，每走一步，那种不安就加重一分。佩斯塔尼是个擅长计算的人。在他的政治账本里，驱逐FAI是必要的手术，但接下来的这一步——将赌注押在拉蒙·佛朗哥身上——却像是把整个组织的命运拴在一个飞行员的狂想上。门开了。拉蒙·佛朗哥比他想象中更矮小，也更精悍。他穿着敞领衬衫，袖子卷到肘部，正伏在一张木质的大桌上画着什么。桌上歪歪斜斜的摆着几本有关西班牙地理的图册、一杯喝了一半的咖啡。墙上挂着一面共和派旗帜，旁边的相框里，年轻时的拉蒙和哥哥弗朗西斯科并肩而立——那张照片拍摄于他们共同完成跨大西洋飞行的辉煌年代。佩斯塔尼注意到了这个细节。如今，弗朗西斯科·佛朗哥正在摩洛哥指挥外籍军团，而他的弟弟却在密谋推翻同一个共和国。佛朗哥家族的晚餐一定很精彩。“佩斯塔尼。”拉蒙抬起头，眼睛亮得出奇。他没用“同志、先生”或诸如此类的词汇。他伸伸手，示意来访者坐下。“你在巴塞罗干得真漂亮。FAI那群疯子早就该被请出去了。”佩斯塔尼谨慎的接过对方递来的咖啡，一边若有所思的看着拉蒙，又是不是打量着身后那些地图，上面标注着西班牙各地的军事驻地、民兵据点，还有一些他看不懂的符号。“你知道我来这里的目的。”佩斯塔尼开口，声音平稳。他对拉蒙·佛朗哥并不陌生：从飞越大西洋的民族英雄，到1930年曾参与推翻给他授勋的君主，再到流亡，回归，反复……他的前半生如同西班牙一样，混乱但坚定、荣耀但迷茫，或许他骨子里就是个冒险家，一个叛逆者，一个疯子……拉蒙悄悄把头转过来，阳光缓缓的流走，只占据他的半张脸，剩下半张隐藏在阴影中的脸则显得神态莫测。他把雪茄按灭在烟灰缸里，走到窗边，背对着佩斯塔尼。“一个有分量的位置，一个能让西班牙重新拼成我喜欢模样的机会。伊比利亚联邦——加泰罗尼亚、巴斯克、加利西亚、安达卢西亚，甚至葡萄牙，或许还有安道尔和直布罗陀——在每个地方，人们都有权决定自己的命运，一个联邦制的伊比利亚，一个强大的伊比利亚，一个真正团结的伊比利亚。”他转过身，那双眼睛里突然有了一种佩斯塔尼在别处见过的东西——不是信念，而是饥饿。“我要的很简单：一个有分量的位置，一个能让伊比利亚——重生的机会。”佩斯塔尼沉默了片刻。他在掂量。拉蒙·佛朗哥是个赌徒，一个狂人，一个比无裤套汉更危险的家伙。他尝试闭上眼睛，从弗朗哥办公室里浓浓的雪茄味中逃出去，他努力回忆着那些在田间地头中劳作的人们，他们抬起头，轻轻地向他微笑。佩斯塔尼当然知道他将要面临什么样的对手，在莫斯科，在米兰，在北非，他都曾亲眼见过，除此之外，还有塞吉的死，以及曾经帮助过CNT的律师们。一种巨大的混乱如同气流将他像热气球一样顶上了天，从一根巨大的美洲雪茄上被喷出，又重重的摔了下来，“一退再退”还是“退一步，进两步”，“一退再退”还是“退一步，进两步”……拉蒙·佛朗哥盯着他看了很长时间。房间里只有挂钟的滴答声。然后，这位飞行员爆发出一阵大笑，笑得眼泪都快出来了。“佩斯塔尼，你知道吗？我喜欢你。至少你威胁人之前不念圣经。我喜欢，我非常喜欢……”他走上前，伸出手。佩斯塔尼握住了那只手。粗糙，有力，像是在握住一架飞机的操纵杆。下楼的时候，领子没有再拉起来。气候依旧不让他舒服，但那种不安已经消退了。取而代之的是一种更复杂的感觉——像是刚刚吞下一剂猛药，又或者不过是他的个人的回光返照……',
  condition: (state) => {
    return !state.isJabaliTriggered && state.isPRRevSFormed && state.prrevs_formed_months >= 1;
  },
  options: [
    {
      text: "Let the boar's tusks tear old Spain apart!",
      textZh: '让野猪的獠牙撕碎旧西班牙',
      subtitle: 'Unleash radical passions: introduce the Jabalistas faction (Influence 15, Dissent 0), unlock Ramón Franco, Eduardo Barriobero, and Pedro Vallina as advisors, increase revolutionary fervor, and gain worker support.',
      subtitleZh: '释放激进的狂热：引入野猪议员派系（影响力 15，分歧 0），解锁顾问拉蒙·弗朗哥、爱德华多·巴里奥贝罗和佩德罗·瓦利纳加入池中，提高革命热情并赢得工人支持。',
      effect: (state) => {
        let newClasses = state.classes;
        newClasses = adjustClassSupport(newClasses, 'Obreros', 'CNT_FAI', 8);
        newClasses = adjustClassSupport(newClasses, 'Braceros', 'CNT_FAI', 8);

        let newFactions = adjustFactionInfluence(state.factions, 'Jabalistas', 15);
        newFactions = adjustFactionDissent(newFactions, 'Jabalistas', -(newFactions.Jabalistas?.dissent ?? 0));

        const newPool = [...state.advisorPool];
        if (!newPool.some(a => a.id === 'Ramón Franco')) {
          newPool.push(ramonFranco);
        }
        if (!newPool.some(a => a.id === 'Eduardo Barriobero')) {
          newPool.push(eduardoBarriobero);
        }
        if (!newPool.some(a => a.id === 'Pedro Vallina')) {
          newPool.push(pedroVallina);
        }

        return {
          classes: newClasses,
          factions: newFactions,
          advisorPool: newPool,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 15),
            republicanAuthority: Math.max(0, state.stats.republicanAuthority - 8)
          },
          isJabaliTriggered: true
        };
      }
    },
    {
      text: 'This is too crazy...',
      textZh: '这太疯狂了......',
      subtitle: 'Distance ourselves from the radical hotheads, but slightly cools revolutionary spirits.',
      subtitleZh: '与激进的狂热分子保持距离，但会轻微冷却革命热情。',
      effect: (state) => {
        return {
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 8),
            republicanAuthority: Math.min(100, state.stats.republicanAuthority + 10)
          },
          isJabaliTriggered: true
        };
      }
    }
  ]
};
