import React from 'react';

type HerculesRailSide = 'left' | 'right';

const INK = '#211f1c';
const PAPER = '#f7f2e7';
const BASE = '#e6decb';
const WELL = '#dcd2bc';
const LINE = '#524c44';
const CRIMSON = '#7d2226';
const MORADO = '#51335c';
const BLUE = '#234969';
const GOLD = '#9c7321';

const SERIF = '"Cormorant Garamond", "Times New Roman", serif';

/**
 * Ornate Pillars of Hercules flanking the law archive. The drawing follows the
 * 1931 republican archive language (paper, iron-gall ink, muted republican
 * accents) but adds the full architectural order: wall crown and star finial,
 * volute capital with egg-and-dart and acanthus, fluted entasis shaft with
 * gilded studs, a folded PLUS / ULTRA banner, an Attic base with a rosette
 * medallion, and the Straits waves. Purely decorative, hence aria-hidden.
 */
export const HerculesRail: React.FC<{ side: HerculesRailSide }> = ({ side }) => {
  const isLeft = side === 'left';
  const crownAccent = isLeft ? CRIMSON : MORADO;
  const shaftGradientId = `hercules-shaft-${side}`;

  const abacusDentils = Array.from({ length: 12 }, (_, index) => 8 + index * 4.6);
  const plinthDentils = Array.from({ length: 14 }, (_, index) => 7 + index * 4.1);
  const eggs = Array.from({ length: 7 }, (_, index) => 18 + index * 6);
  const darts = Array.from({ length: 6 }, (_, index) => 21 + index * 6);

  return (
    <aside
      className={`law-page__rail law-page__rail--${side} hidden w-16 shrink-0 lg:flex xl:w-[72px]`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 72 900" preserveAspectRatio="none" fill="none" className="h-full w-full">
        <defs>
          <linearGradient id={shaftGradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#e3d9c5" />
            <stop offset="0.16" stopColor="#fbf7ee" />
            <stop offset="0.5" stopColor="#f7f2e7" />
            <stop offset="0.84" stopColor="#f0e9da" />
            <stop offset="1" stopColor="#dcd2bd" />
          </linearGradient>
        </defs>

        {/* 外建筑边距线 */}
        <line x1="4" y1="6" x2="4" y2="894" stroke={LINE} strokeWidth="0.75" />
        <line x1="68" y1="6" x2="68" y2="894" stroke={LINE} strokeWidth="0.75" />

        {/* 顶端共和星与城墙冠 */}
        <path
          d="M36 2.5 L37.2 5.8 L40.6 6 L38 8.3 L38.9 11.6 L36 9.5 L33.1 11.6 L34 8.3 L31.4 6 L34.8 5.8 Z"
          fill={GOLD}
          stroke={INK}
          strokeWidth="0.45"
        />
        <rect x="13" y="20" width="46" height="6" fill={PAPER} stroke={INK} strokeWidth="1.1" />
        <line x1="15" y1="23" x2="57" y2="23" stroke={GOLD} strokeWidth="0.55" />
        <path d="M36 21.4 L37.6 23 L36 24.6 L34.4 23 Z" fill={GOLD} stroke={INK} strokeWidth="0.35" />
        {[16, 24, 32, 40, 48].map(x => (
          <g key={`crown-${x}`}>
            <rect x={x} y="12" width="6" height="8" fill={BASE} stroke={INK} strokeWidth="1" />
            <line x1={x + 3} y1="13.5" x2={x + 3} y2="19" stroke={INK} strokeWidth="0.4" opacity="0.45" />
          </g>
        ))}
        <line x1="12" y1="27.5" x2="60" y2="27.5" stroke={crownAccent} strokeWidth="1.5" />
        <circle cx="17" cy="26" r="0.9" fill={GOLD} />
        <circle cx="55" cy="26" r="0.9" fill={GOLD} />

        {/* 柱头：顶板、齿饰、蛋箭纹、涡卷与茛苕叶 */}
        <rect x="6" y="30" width="60" height="7" fill={PAPER} stroke={INK} strokeWidth="1.2" />
        <line x1="8" y1="32" x2="64" y2="32" stroke={GOLD} strokeWidth="0.55" />
        {abacusDentils.map(x => (
          <rect key={`abacus-${x}`} x={x} y="34.8" width="2" height="2" fill={INK} />
        ))}
        <path d="M10 50 C10 41 14 38 20 38 H52 C58 38 62 41 62 50 Z" fill={PAPER} stroke={INK} strokeWidth="1.1" />
        {eggs.map(x => (
          <ellipse key={`egg-${x}`} cx={x} cy="44" rx="1.7" ry="2.4" fill="none" stroke={GOLD} strokeWidth="0.65" />
        ))}
        {darts.map(x => (
          <line key={`dart-${x}`} x1={x} y1="41" x2={x} y2="47" stroke={INK} strokeWidth="0.55" />
        ))}
        <path d="M11 39 C6 39 6 47 12 47 C16 47 16 41 12 41 C10 41 10 44 12 44" fill="none" stroke={INK} strokeWidth="0.9" />
        <path d="M61 39 C66 39 66 47 60 47 C56 47 56 41 60 41 C62 41 62 44 60 44" fill="none" stroke={INK} strokeWidth="0.9" />
        <rect x="14" y="50" width="44" height="4" fill={WELL} stroke={INK} strokeWidth="0.9" />
        <line x1="16" y1="51.5" x2="56" y2="51.5" stroke={GOLD} strokeWidth="0.5" />
        <rect x="15" y="55" width="42" height="17" fill={PAPER} stroke={INK} strokeWidth="1.1" />
        {[20, 24, 28, 32, 40, 44, 48, 52].map(x => (
          <line key={`bell-${x}`} x1={x} y1="56" x2={x} y2="70" stroke={INK} strokeWidth="0.4" opacity="0.4" />
        ))}
        <path
          d="M36 71 C31 66 29 59 33 54 C34 58 35 63 36 66 C37 63 38 58 39 54 C43 59 41 66 36 71 Z"
          fill="#ece0c4"
          stroke={INK}
          strokeWidth="0.8"
        />
        <path
          d="M27 71 C23 67 21 61 25 56 C26 60 28 65 30 68 C30 63 31 59 33 56 C34 61 31 68 27 71 Z"
          fill={BASE}
          stroke={INK}
          strokeWidth="0.7"
        />
        <path
          d="M45 71 C49 67 51 61 47 56 C46 60 44 65 42 68 C42 63 41 59 39 56 C38 61 41 68 45 71 Z"
          fill={BASE}
          stroke={INK}
          strokeWidth="0.7"
        />
        <line x1="36" y1="58" x2="36" y2="68" stroke={GOLD} strokeWidth="0.45" />
        <rect x="14" y="72" width="44" height="4" fill={WELL} stroke={INK} strokeWidth="1" />
        <line x1="16" y1="73.5" x2="56" y2="73.5" stroke={GOLD} strokeWidth="0.5" />

        {/* 凹槽柱身（轻微收分与圆柱明暗） */}
        <path
          d="M20 76 C19.4 250 18.8 500 18 800 L54 800 C53.2 500 52.6 250 52 76 Z"
          fill={`url(#${shaftGradientId})`}
          stroke={INK}
          strokeWidth="1.4"
        />
        <line x1="23.6" y1="76" x2="21.4" y2="800" stroke="#fff8ea" strokeWidth="0.8" opacity="0.5" />
        <line x1="24" y1="76" x2="22" y2="800" stroke={INK} strokeWidth="0.45" opacity="0.55" />
        <line x1="28" y1="76" x2="26.5" y2="800" stroke="#3c3832" strokeWidth="0.85" />
        <line x1="32" y1="76" x2="31" y2="800" stroke={INK} strokeWidth="0.75" />
        <line x1="36" y1="76" x2="35.5" y2="800" stroke={INK} strokeWidth="1" />
        <line x1="40" y1="76" x2="40" y2="800" stroke="#3c3832" strokeWidth="0.8" />
        <line x1="44" y1="76" x2="44.5" y2="800" stroke={INK} strokeWidth="0.85" />
        <line x1="48" y1="76" x2="49" y2="800" stroke="#3c3832" strokeWidth="0.8" />
        <line x1="50" y1="76" x2="52" y2="800" stroke={INK} strokeWidth="0.45" opacity="0.5" />
        <line x1="52" y1="76" x2="54" y2="800" stroke="#8a8175" strokeWidth="0.5" opacity="0.6" />

        {/* 柱身环带与镀金圆花饰 */}
        <rect x="15" y="180" width="42" height="6" fill={BASE} stroke={INK} strokeWidth="0.9" />
        <line x1="16" y1="181" x2="56" y2="181" stroke={GOLD} strokeWidth="0.5" />
        <line x1="16" y1="185" x2="56" y2="185" stroke={GOLD} strokeWidth="0.5" />
        <circle cx="36" cy="183" r="1.8" fill={GOLD} stroke={INK} strokeWidth="0.4" />
        <rect x="15" y="700" width="42" height="6" fill={BASE} stroke={INK} strokeWidth="0.9" />
        <line x1="16" y1="701" x2="56" y2="701" stroke={GOLD} strokeWidth="0.5" />
        <line x1="16" y1="705" x2="56" y2="705" stroke={GOLD} strokeWidth="0.5" />
        <circle cx="36" cy="703" r="1.8" fill={GOLD} stroke={INK} strokeWidth="0.4" />

        {/* 折叠绶带：PLUS / ULTRA */}
        <polygon points="4,372 68,356 68,368 4,384" fill={WELL} stroke={INK} strokeWidth="0.9" />
        <rect x="4" y="372" width="64" height="128" fill={PAPER} stroke={INK} strokeWidth="1.4" />
        <line x1="7" y1="377" x2="65" y2="377" stroke={CRIMSON} strokeWidth="1" />
        <line x1="7" y1="495" x2="65" y2="495" stroke={MORADO} strokeWidth="1" />
        <rect x="7.5" y="378.5" width="61" height="115" fill="none" stroke={GOLD} strokeWidth="0.45" opacity="0.75" />
        <line x1="5.5" y1="372" x2="5.5" y2="500" stroke={INK} strokeWidth="0.5" opacity="0.6" />
        <line x1="66.5" y1="372" x2="66.5" y2="500" stroke={INK} strokeWidth="0.5" opacity="0.6" />
        {isLeft ? (
          <>
            <text x="36" y="404" textAnchor="middle" fill={INK} fontFamily={SERIF} fontWeight="700" fontSize="15">P</text>
            <text x="36" y="430" textAnchor="middle" fill={INK} fontFamily={SERIF} fontWeight="700" fontSize="15">L</text>
            <text x="36" y="456" textAnchor="middle" fill={INK} fontFamily={SERIF} fontWeight="700" fontSize="15">U</text>
            <text x="36" y="482" textAnchor="middle" fill={INK} fontFamily={SERIF} fontWeight="700" fontSize="15">S</text>
          </>
        ) : (
          <>
            <text x="36" y="396" textAnchor="middle" fill={INK} fontFamily={SERIF} fontWeight="700" fontSize="14.5">U</text>
            <text x="36" y="420" textAnchor="middle" fill={INK} fontFamily={SERIF} fontWeight="700" fontSize="14.5">L</text>
            <text x="36" y="444" textAnchor="middle" fill={INK} fontFamily={SERIF} fontWeight="700" fontSize="14.5">T</text>
            <text x="36" y="468" textAnchor="middle" fill={INK} fontFamily={SERIF} fontWeight="700" fontSize="14.5">R</text>
            <text x="36" y="492" textAnchor="middle" fill={INK} fontFamily={SERIF} fontWeight="700" fontSize="14.5">A</text>
          </>
        )}
        <polygon points="4,500 68,484 68,496 4,512" fill={WELL} stroke={INK} strokeWidth="0.9" />

        {/* 阿提卡柱础、齿饰基座与圆花饰 */}
        <rect x="15" y="800" width="42" height="4" fill={WELL} stroke={INK} strokeWidth="0.8" />
        <path d="M13 820 C13 808 18 804 24 804 C28 802 44 802 48 804 C54 804 59 808 59 820 Z" fill={PAPER} stroke={INK} strokeWidth="1.1" />
        <rect x="16" y="820" width="40" height="6" fill={BASE} stroke={INK} strokeWidth="0.8" />
        <rect x="12" y="826" width="48" height="4" fill={WELL} stroke={INK} strokeWidth="0.8" />
        <rect x="6" y="830" width="60" height="14" fill={PAPER} stroke={INK} strokeWidth="1.2" />
        <line x1="8" y1="832" x2="64" y2="832" stroke={GOLD} strokeWidth="0.5" />
        {plinthDentils.map(x => (
          <rect key={`plinth-${x}`} x={x} y="838.5" width="1.8" height="2.2" fill={INK} />
        ))}
        <line x1="8" y1="842.5" x2="64" y2="842.5" stroke={GOLD} strokeWidth="0.5" />
        <rect x="4" y="844" width="64" height="20" fill={BASE} stroke={INK} strokeWidth="1.3" />
        <rect x="8" y="848" width="56" height="12" fill={PAPER} stroke={INK} strokeWidth="0.6" />
        <circle cx="36" cy="854" r="4" fill={PAPER} stroke={INK} strokeWidth="0.7" />
        {[0, 45, 90, 135].map(angle => (
          <ellipse
            key={`rosette-${angle}`}
            cx="36"
            cy="854"
            rx="4.5"
            ry="1.1"
            fill="none"
            stroke={GOLD}
            strokeWidth="0.45"
            transform={`rotate(${angle} 36 854)`}
          />
        ))}
        <circle cx="36" cy="854" r="1" fill={GOLD} />
        <rect x="2" y="864" width="68" height="10" fill={WELL} stroke={INK} strokeWidth="1.4" />
        <line x1="5" y1="867" x2="67" y2="867" stroke={GOLD} strokeWidth="0.55" />
        <line x1="5" y1="871" x2="67" y2="871" stroke={INK} strokeWidth="0.45" opacity="0.5" />

        {/* 直布罗陀海峡波浪 */}
        <path d="M4 880 Q10 876 16 880 T28 880 T40 880 T52 880 T64 880" stroke={BLUE} strokeWidth="1.2" fill="none" />
        <path d="M8 886 Q14 882 20 886 T32 886 T44 886 T56 886 T68 886" stroke={INK} strokeWidth="0.85" fill="none" />
        <path d="M4 892 Q12 888 20 892 T36 892 T52 892 T68 892" stroke={MORADO} strokeWidth="1.05" fill="none" />
        <circle cx="12" cy="876" r="0.7" fill={BLUE} />
        <circle cx="60" cy="876" r="0.7" fill={BLUE} />
      </svg>
    </aside>
  );
};
