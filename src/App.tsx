// 政治風暴 (POLITIKO Taiwan) 四人對戰遊戲
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users,
  Shield,
  Zap,
  Trophy,
  RefreshCw,
  Eye,
  Check,
  X,
  BookOpen,
  Play,
  Flame,
  Sparkles,
  Crown,
  Shuffle,
  ArrowRight,
  Bot,
  User,
  Unlock,
  Lock,
  Coins,
  Volume2,
  Ban,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

// 相容各版本環境的握手結盟圖示
function Handshake({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m11 17 2 2a1 1 0 1 0 3-3" />
      <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
      <path d="m21 3 1 11h-2" />
      <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
      <path d="M3 4h8" />
    </svg>
  );
}

// 報紙與複製內建 SVG 圖示
function NewspaperIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" />
      <path d="M15 18h-5" />
      <path d="M10 6h8v4h-8V6Z" />
    </svg>
  );
}

function CopyIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

// ============================================================================
// 1. 遊戲核心資料定義：9 張政黨卡、80 張選民卡母體、68 張陰謀卡完整清單
// ============================================================================

const PARTIES = [
  {
    id: 'dpp',
    name: '民主黨',
    camp: '泛綠／反中',
    badgeColor: 'bg-emerald-600 text-white border-emerald-400',
    panelBorder: 'border-emerald-500/50',
    accentText: 'text-emerald-400',
    poolSize: 52,
    ruleDesc: '所有反中選民 ＋ 所有中間選民',
    blockedIds: ['kmt', 'pfirst', 'unif', 'third'],
    checkValid: (v) => v.stance === 'anti' || v.stance === 'neutral',
  },
  {
    id: 'kmt',
    name: '國民陣線',
    camp: '泛藍／親中',
    badgeColor: 'bg-blue-600 text-white border-blue-400',
    panelBorder: 'border-blue-500/50',
    accentText: 'text-blue-400',
    poolSize: 48,
    ruleDesc: '所有親中選民 ＋ 所有中間選民',
    blockedIds: ['dpp', 'tsolid', 'indep', 'third'],
    checkValid: (v) => v.stance === 'pro' || v.stance === 'neutral',
  },
  {
    id: 'pfirst',
    name: '人民黨',
    camp: '泛藍／親中',
    badgeColor: 'bg-orange-600 text-white border-orange-400',
    panelBorder: 'border-orange-500/50',
    accentText: 'text-orange-400',
    poolSize: 43,
    ruleDesc: '所有親中選民 ＋ 北部中間選民',
    blockedIds: ['dpp', 'tsolid', 'indep', 'third'],
    checkValid: (v) => v.stance === 'pro' || (v.stance === 'neutral' && v.region === 'north'),
  },
  {
    id: 'tsolid',
    name: '本土黨',
    camp: '泛綠／反中',
    badgeColor: 'bg-amber-700 text-white border-amber-400',
    panelBorder: 'border-amber-500/50',
    accentText: 'text-amber-400',
    poolSize: 41,
    ruleDesc: '所有反中選民 ＋ 閩南人中間選民',
    blockedIds: ['kmt', 'pfirst', 'unif', 'third'],
    checkValid: (v) => v.stance === 'anti' || (v.stance === 'neutral' && v.ethnic === 'minnan'),
  },
  {
    id: 'hakka',
    name: '客家黨',
    camp: '族群／中間',
    badgeColor: 'bg-pink-600 text-white border-pink-400',
    panelBorder: 'border-pink-500/50',
    accentText: 'text-pink-400',
    poolSize: 30,
    ruleDesc: '所有客家人 ＋ 所有中間選民',
    blockedIds: ['unif', 'indep'],
    checkValid: (v) => v.ethnic === 'hakka' || v.stance === 'neutral',
  },
  {
    id: 'indep',
    name: '獨立黨',
    camp: '泛綠／深綠',
    badgeColor: 'bg-teal-700 text-white border-teal-400',
    panelBorder: 'border-teal-500/50',
    accentText: 'text-teal-400',
    poolSize: 28,
    ruleDesc: '閩南人反中選民',
    blockedIds: ['kmt', 'pfirst', 'unif', 'third', 'indig', 'hakka'],
    checkValid: (v) => v.ethnic === 'minnan' && v.stance === 'anti',
  },
  {
    id: 'unif',
    name: '統一黨',
    camp: '泛藍／深藍',
    badgeColor: 'bg-indigo-700 text-white border-indigo-400',
    panelBorder: 'border-indigo-500/50',
    accentText: 'text-indigo-400',
    poolSize: 27,
    ruleDesc: '北部親中選民',
    blockedIds: ['dpp', 'tsolid', 'indep', 'third', 'indig', 'hakka'],
    checkValid: (v) => v.region === 'north' && v.stance === 'pro',
  },
  {
    id: 'indig',
    name: '原住民黨',
    camp: '族群／中間',
    badgeColor: 'bg-purple-600 text-white border-purple-400',
    panelBorder: 'border-purple-500/50',
    accentText: 'text-purple-400',
    poolSize: 23,
    ruleDesc: '所有原住民 ＋ 所有中間選民',
    blockedIds: ['unif', 'indep'],
    checkValid: (v) => v.ethnic === 'indigenous' || v.stance === 'neutral',
  },
  {
    id: 'third',
    name: '第三勢力聯盟',
    camp: '中間路線',
    badgeColor: 'bg-cyan-600 text-white border-cyan-400',
    panelBorder: 'border-cyan-500/50',
    accentText: 'text-cyan-400',
    poolSize: 20,
    ruleDesc: '所有中間選民',
    blockedIds: ['kmt', 'pfirst', 'unif', 'dpp', 'tsolid', 'indep'],
    checkValid: (v) => v.stance === 'neutral',
  },
];

const STANCE_LABELS = {
  pro: { text: '親中', color: 'from-rose-600 to-red-700', pill: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  anti: { text: '反中', color: 'from-emerald-600 to-green-700', pill: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  neutral: { text: '中間選民', color: 'from-amber-500 to-orange-600', pill: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
};

const ETHNIC_LABELS = {
  minnan: '閩南人',
  hakka: '客家人',
  mainlander: '外省人',
  indigenous: '原住民',
};

const REGION_LABELS = {
  north: '北部',
  south: '南部',
};

// 精準對應全遊戲 80 張選民卡人口比例與各黨交集（親中28/反中32/中間20；閩南48/客家15/外省11/原民6；北47/南33）
const VOTER_SPECS = [
  // 親中 (28張: 北27, 南1)
  { stance: 'pro', ethnic: 'minnan', region: 'north', count: 10 },
  { stance: 'pro', ethnic: 'minnan', region: 'south', count: 1 },
  { stance: 'pro', ethnic: 'hakka', region: 'north', count: 8 },
  { stance: 'pro', ethnic: 'mainlander', region: 'north', count: 7 },
  { stance: 'pro', ethnic: 'indigenous', region: 'north', count: 2 },
  // 反中 (32張: 北5, 南27；閩南反中=28)
  { stance: 'anti', ethnic: 'minnan', region: 'north', count: 4 },
  { stance: 'anti', ethnic: 'minnan', region: 'south', count: 24 },
  { stance: 'anti', ethnic: 'hakka', region: 'north', count: 1 },
  { stance: 'anti', ethnic: 'hakka', region: 'south', count: 1 },
  { stance: 'anti', ethnic: 'mainlander', region: 'south', count: 1 },
  { stance: 'anti', ethnic: 'indigenous', region: 'south', count: 1 },
  // 中間選民 (20張: 北15, 南5；閩南9, 客家5, 外省3, 原民3)
  { stance: 'neutral', ethnic: 'minnan', region: 'north', count: 5 },
  { stance: 'neutral', ethnic: 'minnan', region: 'south', count: 4 },
  { stance: 'neutral', ethnic: 'hakka', region: 'north', count: 4 },
  { stance: 'neutral', ethnic: 'hakka', region: 'south', count: 1 },
  { stance: 'neutral', ethnic: 'mainlander', region: 'north', count: 3 },
  { stance: 'neutral', ethnic: 'indigenous', region: 'north', count: 3 },
];

// 完整 68 張陰謀卡定義
const SCHEME_SPECS = [
  { code: 'buy_votes', name: '買票', count: 4, timing: 'once', category: '直接得分', desc: '抽 4 張牌；選民卡直接入自家選票區且皆視為有效選票，陰謀卡洗回牌堆。' },
  { code: 'rig_votes', name: '作票', count: 3, timing: 'once', category: '直接得分', desc: '直接將此卡放入自家選票區，視為 2 張有效選民卡。' },
  { code: 'amend_charter', name: '修改黨綱', count: 2, timing: 'continuous', category: '結構突破', desc: '【連續2回合】無法打出選民卡；2 回合結束後，自家有效選民結構永久不受限制。' },

  { code: 'us_beef', name: '美牛', count: 2, timing: 'once', category: '搶奪選票', desc: '指定任一政黨，從其選票區交給自家 2 張選民卡（無效則棄置）。', stealCount: 2 },
  { code: 'special_fund', name: '特別費', count: 1, timing: 'once', category: '搶奪選票', desc: '指定任一政黨，從其選票區交給自家 2 張選民卡（無效則棄置）。', stealCount: 2 },
  { code: 'ghost_island', name: '鬼島', count: 2, timing: 'once', category: '搶奪選票', desc: '指定任一政黨，從其選票區交給自家 2 張選民卡（無效則棄置）。', stealCount: 2 },
  { code: 'im_japanese', name: '境外資金介選', count: 1, timing: 'once', category: '搶奪選票', desc: '指定任一政黨，從其選票區交給自家 2 張選民卡（無效則棄置）。', stealCount: 2 },
  { code: 'recall', name: '罷免', count: 1, timing: 'once', category: '搶奪選票', desc: '指定任一政黨或聯盟，從其選票區交給自家 3 張選民卡。', stealCount: 3 },

  { code: 'brawl', name: '立法院互毆', count: 2, timing: 'once', category: '全場掃票', desc: '所有其他政黨各從其選票區交給自家 1 張選民卡。', aoeSteal: 1 },
  { code: 'shooting', name: '包車造勢', count: 1, timing: 'once', category: '全場掃票', desc: '所有其他政黨各從其選票區交給自家 1 張選民卡。', aoeSteal: 1 },
  { code: 'party_strife', name: '政黨惡鬥', count: 2, timing: 'once', category: '全場掃票', desc: '所有其他政黨各從其選票區交給自家 2 張選民卡。', aoeSteal: 2 },

  { code: 'ethnic_minnan', name: '操控族群對立 1', count: 1, timing: 'once', category: '族群搶票', desc: '指定任一政黨，從其選票區交給自家最多 3 張「閩南人」選民卡。', targetEthnic: 'minnan' },
  { code: 'ethnic_mainlander', name: '操控族群對立 2', count: 1, timing: 'once', category: '族群搶票', desc: '指定任一政黨，從其選票區交給自家最多 3 張「外省人」選民卡。', targetEthnic: 'mainlander' },
  { code: 'ethnic_hakka', name: '操控族群對立 3', count: 1, timing: 'once', category: '族群搶票', desc: '指定任一政黨，從其選票區交給自家最多 3 張「客家人」選民卡。', targetEthnic: 'hakka' },
  { code: 'one_china', name: '一中同表', count: 1, timing: 'once', category: '意識形態', desc: '二選一：棄置自家或聯盟所有「反中」選票；或所有其他政黨各交給自家最多 3 張「親中」選票。' },

  // 民生議題二選一系列（共 14 張：22K x2 ＋ 高房價等民生卡 x12）
  { code: 'livelihood', name: '22K', count: 2, timing: 'once', category: '民生議題', desc: '二選一：指定任一政黨交給自家 1 張選民卡；或從棄牌堆挑 1 張有效選民卡入選票區。' },
  { code: 'livelihood', name: '高房價', count: 4, timing: 'once', category: '民生議題', desc: '二選一：指定任一政黨交給自家 1 張選民卡；或從棄牌堆挑 1 張有效選民卡入選票區。' },
  { code: 'livelihood', name: '低薪過勞', count: 3, timing: 'once', category: '民生議題', desc: '二選一：指定任一政黨交給自家 1 張選民卡；或從棄牌堆挑 1 張有效選民卡入選票區。' },
  { code: 'livelihood', name: '物價飛漲', count: 3, timing: 'once', category: '民生議題', desc: '二選一：指定任一政黨交給自家 1 張選民卡；或從棄牌堆挑 1 張有效選民卡入選票區。' },
  { code: 'livelihood', name: '少子化危機', count: 2, timing: 'once', category: '民生議題', desc: '二選一：指定任一政黨交給自家 1 張選民卡；或從棄牌堆挑 1 張有效選民卡入選票區。' },

  { code: 'apache', name: '政見辯論會', count: 2, timing: 'once', category: '棄牌回收', desc: '從棄牌堆中挑選最多 2 張有效選民卡放入自家選票區。' },
  { code: 'fake_poll', name: '假民調', count: 1, timing: 'continuous', category: '棄牌回收', desc: '【連續3回合】每回合從棄牌堆挑選 1 張有效選民卡放入自家選票區（打出當下立即執行第 1 次）。' },

  { code: 'mob_protest', name: '暴民抗議', count: 1, timing: 'once', category: '破壞選票', desc: '指定任一政黨，從其選票區將 1 張選民卡丟入棄牌堆。' },
  { code: 'food_safety', name: '食安', count: 1, timing: 'once', category: '破壞選票', desc: '指定任一政黨，從其選票區將 1 張選民卡丟入棄牌堆。' },
  { code: 'curriculum', name: '課綱微調', count: 1, timing: 'continuous', category: '破壞選票', desc: '【連續3回合】指定任一政黨每回合開始時將選票區 1 張選民卡丟入棄牌堆。' },
  { code: 'occupy_yuan', name: '佔領立法院', count: 1, timing: 'continuous', category: '破壞選票', desc: '【連續3回合】指定任一政黨每回合開始時將選票區 1 張選民卡丟入棄牌堆。' },

  { code: 'media_monopoly', name: '媒體壟斷', count: 2, timing: 'once', category: '手牌干擾', desc: '指定任一政黨，隨機抽取其 2 張手牌丟入棄牌堆。' },
  { code: 'fuel_hike', name: '油電雙漲', count: 2, timing: 'once', category: '手牌干擾', desc: '指定任一政黨，隨機抽取其 2 張手牌成為自家手牌。' },
  { code: 'military_scandal', name: 'AI造假影片', count: 2, timing: 'continuous', category: '抽牌封鎖', desc: '【連續1回合】指定任一政黨於下回合不能抽取卡牌。' },
  { code: 'cyber_army', name: '網軍', count: 2, timing: 'continuous', category: '抽牌封鎖', desc: '【連續3回合】指定任一政黨每回合少抽取 1 張卡牌。' },

  { code: 'replace_candidate', name: '更換候選人', count: 3, timing: 'once', category: '換牌控頂', desc: '將自家所有手牌丟入棄牌堆，並重新從抽牌堆抽取 7 張牌。' },
  { code: 'lower_voting_age', name: '降低投票年齡', count: 2, timing: 'once', category: '換牌控頂', desc: '從棄牌堆挑選最多 10 張選民卡，洗回抽牌堆中。' },
  { code: 'black_box', name: '黑箱作業', count: 1, timing: 'once', category: '換牌控頂', desc: '檢視並重新調整抽牌堆最上方 8 張卡牌的放置順序。' },

  { code: 'amnesty', name: '總統特赦', count: 1, timing: 'instant', category: '即時反制', desc: '【任何時刻】取消指定的陰謀效果。' },
  { code: 'dino_judge', name: '恐龍法官', count: 2, timing: 'instant', category: '即時反制', desc: '【任何時刻】取消指定的陰謀效果。' },
  { code: 'pundit_rule', name: '名嘴治國', count: 2, timing: 'instant_or_once', category: '即時反制', desc: '二選一：【任何時刻】取消指定陰謀；或主動指定任一政黨隨機棄置其 3 張手牌。' },

  { code: 'party_mutiny', name: '政黨叛變', count: 3, timing: 'once', category: '強制結盟', desc: '二選一：指定任一政黨強制與自家結盟（不受政黨卡限制）；或強制解除聯盟。' },
];

// ============================================================================
// 2. 輔助函式：洗牌、組牌、有效選票判定、勝利條件計算
// ============================================================================

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildFullDeck() {
  const cards = [];
  let uidCounter = 1;

  VOTER_SPECS.forEach((spec) => {
    for (let i = 0; i < spec.count; i++) {
      cards.push({
        uid: `voter-${uidCounter++}`,
        cardType: 'voter',
        stance: spec.stance,
        ethnic: spec.ethnic,
        region: spec.region,
        name: `${REGION_LABELS[spec.region]}${ETHNIC_LABELS[spec.ethnic]}`,
      });
    }
  });

  SCHEME_SPECS.forEach((spec) => {
    for (let i = 0; i < spec.count; i++) {
      cards.push({
        uid: `scheme-${uidCounter++}`,
        cardType: 'scheme',
        code: spec.code,
        name: spec.name,
        timing: spec.timing,
        category: spec.category,
        desc: spec.desc,
        stealCount: spec.stealCount || 0,
        aoeSteal: spec.aoeSteal || 0,
        targetEthnic: spec.targetEthnic || null,
      });
    }
  });

  return shuffleArray(cards);
}

// 抽牌輔助：若牌堆耗盡自動將棄牌堆洗回
function drawFromDeckSafe(deck, discard, count) {
  let nextDeck = [...deck];
  let nextDiscard = [...discard];
  const drawn = [];

  for (let i = 0; i < count; i++) {
    if (nextDeck.length === 0 && nextDiscard.length > 0) {
      // 重置卡片上的臨時標記並重洗
      nextDeck = shuffleArray(
        nextDiscard.map((c) => {
          const clean = { ...c };
          delete clean.boughtVote;
          return clean;
        })
      );
      nextDiscard = [];
    }
    if (nextDeck.length === 0) break;
    drawn.push(nextDeck.shift());
  }

  return { drawn, nextDeck, nextDiscard };
}

function isVoterValidForPlayer(card, player) {
  if (!card || card.cardType !== 'voter') return false;
  if (card.boughtVote) return true;
  if (player.partyUnrestricted) return true;
  const party = PARTIES.find((p) => p.id === player.partyId);
  return party ? party.checkValid(card) : false;
}

function canNaturallyAlly(p1, p2) {
  if (!p1 || !p2 || p1.id === p2.id) return false;
  if (p1.allyId !== null || p2.allyId !== null) return false;
  const party1 = PARTIES.find((p) => p.id === p1.partyId);
  const party2 = PARTIES.find((p) => p.id === p2.partyId);
  if (!party1 || !party2) return false;
  return !party1.blockedIds.includes(party2.id) && !party2.blockedIds.includes(party1.id);
}

function getPlayerVoteScore(player) {
  if (!player) return 0;
  return player.ballotBox.reduce((sum, c) => {
    if (c.cardType === 'scheme' && c.code === 'rig_votes') return sum + 2;
    return sum + 1;
  }, 0);
}

function getEligibleBallotVoters(player, filterFn = null) {
  return player.ballotBox.filter((c) => {
    if (c.cardType !== 'voter') return false;
    return filterFn ? filterFn(c) : true;
  });
}

function checkGameWinners(players) {
  // 單獨獲勝：未結盟且選票區 >= 8 票
  for (const p of players) {
    if (p.allyId === null && getPlayerVoteScore(p) >= 8) {
      return {
        mode: 'solo',
        winners: [p],
        totalVotes: getPlayerVoteScore(p),
      };
    }
  }
  // 聯合獲勝：結盟雙方合計 >= 15 票
  for (const p of players) {
    if (p.allyId !== null) {
      const ally = players.find((x) => x.id === p.allyId);
      if (ally) {
        const combined = getPlayerVoteScore(p) + getPlayerVoteScore(ally);
        if (combined >= 15) {
          return {
            mode: 'coalition',
            winners: [p, ally],
            totalVotes: combined,
          };
        }
      }
    }
  }
  return null;
}

function canPlayCounter(card) {
  return (
    card.cardType === 'scheme' &&
    (card.code === 'amnesty' || card.code === 'dino_judge' || card.code === 'pundit_rule')
  );
}

// 逆時針座位推進：0(下) -> 1(右) -> 2(上) -> 3(左) -> 0(下)
function nextCounterClockwiseId(currentId) {
  return (currentId + 1) % 4;
}

// ============================================================================
// 2.5 終局政治新聞產生器（Gemini API 結構化生成 ＋ 本地斷網備援撰稿）
// ============================================================================

const NEWS_STYLES = [
  {
    id: 'standard',
    label: '📰 權威頭版專題',
    tag: '頭版政治要聞',
    promptHint: '採用臺灣主流大報頭版政治專題風格，筆觸沉穩犀利、脈絡分明，完整剖析選票版圖消長、關鍵陰謀攻防與執政意義。',
  },
  {
    id: 'tabloid',
    label: '🔥 週刊內幕爆料',
    tag: '政壇獨家內幕',
    promptHint: '採用八卦內幕週刊爆料風格，語氣充滿戲劇張力與懸疑感，聚焦密室換票、買票作票疑雲、政黨叛變背刺與驚天逆轉。',
  },
  {
    id: 'pundit',
    label: '🎙️ 政論名嘴激辯',
    tag: '政論火線點評',
    promptHint: '採用晚間政論節目名嘴激昂評論風格，節奏明快、金句連發、辛辣嘲諷各黨操盤失誤與贏家的狠辣手段。',
  },
];

// 本地備援新聞撰稿引擎（當網路受限或 API 逾時時自動啟用，確保必定產出完整報導）
function buildFallbackNewsArticle(winData, finalPlayers, historyList, totalRounds, styleId = 'standard') {
  const winnerLabels = winData.winners.map((w) => {
    const pt = PARTIES.find((x) => x.id === w.partyId);
    return `${pt?.name}（黨主席：${w.name}）`;
  });
  const winnerShortNames = winData.winners
    .map((w) => PARTIES.find((x) => x.id === w.partyId)?.name)
    .join('、');

  const losers = finalPlayers
    .filter((p) => !winData.winners.some((w) => w.id === p.id))
    .sort((a, b) => getPlayerVoteScore(b) - getPlayerVoteScore(a));

  const schemeEvents = historyList.filter((e) => e.text.includes('打出陰謀卡'));
  const counterEvents = historyList.filter((e) => e.text.includes('即時反制'));
  const allyEvents = historyList.filter((e) => e.text.includes('結盟') || e.text.includes('聯盟'));
  const dirtyVotesCount = winData.winners.reduce(
    (acc, w) =>
      acc +
      w.ballotBox.filter((c) => c.boughtVote || (c.cardType === 'scheme' && c.code === 'rig_votes')).length,
    0
  );

  const headline =
    styleId === 'tabloid'
      ? `驚天翻盤！歷經 ${totalRounds} 輪腥風血雨　${winnerShortNames}狂攬 ${winData.totalVotes} 票強勢奪權！`
      : styleId === 'pundit'
      ? `政壇大地震！${winnerShortNames}憑什麼拿下 ${winData.totalVotes} 票？在野陣營潰敗內幕全解析`
      : `${winnerShortNames}奪下 ${winData.totalVotes} 張有效選票　宣布${
          winData.mode === 'solo' ? '單獨完全執政' : '共組聯合政府'
        }`;

  const subheadline =
    winData.mode === 'solo'
      ? `拒絕利益分贓單騎突圍！全場歷經 ${schemeEvents.length} 次政治陰謀交鋒與 ${counterEvents.length} 度即時反制攔截`
      : `跨黨派合縱連橫奏效！雙黨結盟衝破 15 票執政門檻，在野陣營防線全面失守`;

  const lead = `【本報特稿】備受全國矚目的政壇執政權爭奪戰於第 ${totalRounds} 輪正式落幕。由 ${winnerLabels.join(
    ' 與 '
  )} 領軍的陣營，在多方派系夾擊與政治風暴洗禮下，最終成功跨過法定門檻，以總計 ${
    winData.totalVotes
  } 張有效選票宣告${winData.mode === 'solo' ? '單獨執政' : '聯合組閣'}，改寫國會與政壇權力版圖。`;

  const highlightSchemes = schemeEvents
    .slice(-4)
    .map((e) => e.text.replace(/^⚡\s*/, ''))
    .join('；');

  const p1 =
    schemeEvents.length > 0
      ? `回顧整場選戰歷程，議場內外可謂暗潮洶湧、招招見血。全場累計爆發多達 ${schemeEvents.length} 波政治陰謀攻勢，其中關鍵轉折包括：${highlightSchemes}。${
          counterEvents.length > 0
            ? `期間更出現 ${counterEvents.length} 次戲劇性的司法與輿論即時反制（${counterEvents[counterEvents.length - 1].text.replace(/^🛡️\s*/, '')}），讓選情數度陷入膠著。`
            : '各黨在缺乏反制籌碼的情況下正面肉搏，選票流向劇烈震盪。'
        }`
      : `回顧本屆選戰，各黨皆採取穩健紮實的組織動員策略，鮮少動用極端政治陰謀，專注於爭取符合自身黨綱結構的核心選民支持，展開一場純粹的基本盤動員競速。`;

  const p2 =
    allyEvents.length > 0 || dirtyVotesCount > 0
      ? `在政黨合縱連橫與選務攻防方面，${
          allyEvents.length > 0
            ? `場上曾多次出現結盟與拆夥談判（如：${allyEvents[allyEvents.length - 1].text.replace(/^[^\s]+\s*/, '')}），充分展現「沒有永遠的敵人，也沒有永遠的朋友」的政治現實。`
            : '各黨始終維持獨立作戰姿態，未讓結盟協商左右大局。'
        }${
          dirtyVotesCount > 0
            ? `值得注意的是，勝選陣營選票匭中亦出現透過《買票》或《作票》強行催出的 ${dirtyVotesCount} 筆爭議票源，引發在野陣營強烈質疑選風敗壞，但仍無法撼動最終計票結果。`
            : '勝選陣營全數選票皆來自合乎黨綱之選民結構支持，正當性十足。'
        }`
      : `儘管選戰中段各黨都有機會透過結盟改寫局勢，但各方黨主席對權力分配各有盤算，最終由基層選票動員效率最高的陣營率先撞線。`;

  const loserSummary = losers
    .map((l) => `${PARTIES.find((x) => x.id === l.partyId)?.name}（${l.name}，${getPlayerVoteScore(l)} 票）`)
    .join('、');

  const p3 = `最終開票結果顯示，敗選的在野陣營分別為：${loserSummary}。面對新執政團隊即將上台，敗選各黨主席於選後記者會難掩失落，紛紛表示將啟動黨內檢討與路線重整，誓言在下屆大選捲土重來。`;

  const punditQuote =
    styleId === 'tabloid'
      ? `資深政壇內幕人士私下透露：「表面上看是選民結構的勝利，實際上最後幾輪的抽牌與陰謀算計才是真正的致命一擊，輸家連怎麼被翻盤的都還沒回過神！」`
      : styleId === 'pundit'
      ? `政論名嘴拍桌直言：「這局完全就是教科書級別的政治精算！當對手還在猶豫要不要打選民卡的時候，贏家早就把票數跟回合節奏算死死了！」`
      : `政治學者分析指出：「本次選舉結果再次印證，在多黨競爭格局下，能否精準掌握自身有效票池並適時化解對手陰謀干擾，是奪取執政權的不二法門。」`;

  return {
    headline,
    subheadline,
    lead,
    bodyParagraphs: [p1, p2, p3],
    punditQuote,
  };
}

// 呼叫 Gemini API 依據完整遊戲歷程撰寫政治新聞
async function fetchPoliticalNewsFromGemini(winData, finalPlayers, historyList, totalRounds, styleId = 'standard') {
  const styleObj = NEWS_STYLES.find((s) => s.id === styleId) || NEWS_STYLES[0];
  const apiKey = '';
  const apiUrl = '/.netlify/functions/generate-news';


  const partyStandings = finalPlayers
    .map((p) => {
      const pt = PARTIES.find((x) => x.id === p.partyId);
      const ally = p.allyId !== null ? finalPlayers.find((a) => a.id === p.allyId) : null;
      const allyPt = ally ? PARTIES.find((x) => x.id === ally.partyId) : null;
      const rigCount = p.ballotBox.filter((c) => c.cardType === 'scheme' && c.code === 'rig_votes').length;
      const boughtCount = p.ballotBox.filter((c) => c.boughtVote).length;
      return `- 【${pt?.name}】黨主席：${p.name}｜最終有效票：${getPlayerVoteScore(p)} 票｜結盟狀態：${
        allyPt ? `與${allyPt.name}結盟` : '無結盟'
      }｜黨綱狀態：${p.partyUnrestricted ? '已修改黨綱全選民通吃' : pt?.ruleDesc}｜選票區內含作票卡 ${rigCount} 張、買票進匭 ${boughtCount} 張`;
    })
    .join('\n');

  const winnerSummary = winData.winners
    .map((w) => `${PARTIES.find((x) => x.id === w.partyId)?.name}（${w.name}）`)
    .join(' ＆ ');

  const timelineText = historyList
    .map((entry, idx) => `${idx + 1}. [第${entry.round}輪] ${entry.text}`)
    .join('\n');

    const systemPrompt = `你是一位資深臺灣政治線特派記者與政論主筆。請根據桌遊《政治風暴》（POLITIKO Taiwan）的四人對戰完整歷程紀錄與最終計票數據，撰寫一篇生動、精彩、極具臺灣政治新聞臨場感（融入立院攻防、派系合縱連橫、密室協商、選情告急、黑箱或買作票爭議、司法特赦反制等元素）的政治頭條新聞報導。
    寫作規範：
    1. 嚴格使用對戰紀錄中的政黨名稱與玩家名稱，切勿代入現實政治人物真名。
    2. 具體點出對戰歷程中真實發生過的關鍵陰謀卡、結盟拆夥、反制或選民動員轉折，讓玩家讀起來充滿共鳴與成就感。
    3. 文筆風格設定：${styleObj.promptHint}
    4. 請使用繁體中文，並嚴格只回傳一個合法的 JSON 物件（不要包含 markdown 標記），格式如下：
    {
      "headline": "主標題",
      "subheadline": "副標題",
      "lead": "導言第一段",
      "bodyParagraphs": ["內文第一段", "內文第二段", "內文第三段"],
      "punditQuote": "名嘴點評"
    }`;
    
      const userQuery = `【本局大選最終結果】
    - 總進行輪數：共 ${totalRounds} 輪
    - 獲勝方式：${winData.mode === 'solo' ? '單獨執政獲勝（率先突破 8 票門檻）' : '聯合執政獲勝（結盟合計突破 15 票門檻）'}
    - 最終執政贏家：${winnerSummary}（合計 ${winData.totalVotes} 票）
    
    【四黨最終得票與狀態】
    ${partyStandings}
    
    【完整對戰歷程時間軸（由開局至終局）】
    ${timelineText}`;
    
      const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
      };
    
      const delays = new Array(1000, 2000, 4000);
      for (let attempt = 0; attempt <= delays.length; attempt++) {
        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
    
          if (!response.ok) {
            const errDetail = await response.text();
            console.error('Gemini Proxy Error:', response.status, errDetail);
            throw new Error(`HTTP ${response.status}`);
          }
    
          const result = await response.json();
          let rawText = result?.candidates?.at(0)?.content?.parts?.at(0)?.text || '';

          rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    
          if (rawText) {
            const parsed = JSON.parse(rawText);
            if (
              parsed.headline &&
              parsed.lead &&
              Array.isArray(parsed.bodyParagraphs) &&
              parsed.bodyParagraphs.length > 0
            ) {
              return parsed;
            }
          }
          throw new Error('Invalid structured response');
        } catch (err) {
          console.error('Attempt failed:', err);
          if (attempt < delays.length) {
            await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
          }
        }
      }
    
      return buildFallbackNewsArticle(winData, finalPlayers, historyList, totalRounds, styleId);
    }
    export default function App() {
  // 遊戲全局階段：'setup' | 'draft' | 'playing' | 'gameover'
  const [stage, setStage] = useState('setup');
  // 政黨隨機分配開關（開啟時直接盲抽分配政黨並開局；關閉時進入輪流選黨階段）
  const [randomPartyDraft, setRandomPartyDraft] = useState(false);

  // 4 名玩家座位設定（預設：1 真人 + 3 電腦 AI，亦可切換全真人同機熱座）
  const [seatConfig, setSeatConfig] = useState([
    { id: 0, name: '玩家 1（你）', isAI: false, cash: 1680 },
    { id: 1, name: '陳總召', isAI: true, cash: 950 },
    { id: 2, name: '林主席', isAI: true, cash: 2300 },
    { id: 3, name: '黃委員', isAI: true, cash: 1200 },
  ]);

  const [startingPlayerId, setStartingPlayerId] = useState(0);
  const [draftTurnId, setDraftTurnId] = useState(0);
  const [players, setPlayers] = useState([]);
  const [deck, setDeck] = useState([]);
  const [discard, setDiscard] = useState([]);

  // 當前回合狀態
  const [turnPlayerId, setTurnPlayerId] = useState(0);
  const [turnNumber, setTurnNumber] = useState(1);
  // turnMode: null (尚未二選一) | 'voter' (已選打出選民) | 'scheme' (已選執行陰謀)
  const [turnMode, setTurnMode] = useState(null);
  const [schemesUsed, setSchemesUsed] = useState(0);

  // 互動視窗與佇列狀態 (取代所有 alert/confirm)
  const [pendingPrompt, setPendingPrompt] = useState(null);
  const [privacyShieldForId, setPrivacyShieldForId] = useState(null);
  const [winnerInfo, setWinnerInfo] = useState(null);

  // 輔助面板開關
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [logs, setLogs] = useState([]);
  const [headline, setHeadline] = useState('歡迎來到《政治風暴》四人執政爭奪戰！');

  // 終局政治新聞報導狀態與完整歷程紀錄
  const [newsArticle, setNewsArticle] = useState(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsStyle, setNewsStyle] = useState('standard');
  const [copiedNews, setCopiedNews] = useState(false);
  const [showTimelineInModal, setShowTimelineInModal] = useState(false);

  // 立院臨時動議（多數決特殊規則）每局冷卻
  const [motionUsedThisTurn, setMotionUsedThisTurn] = useState(false);
  // 協商結盟冷卻：一回合只能對一對象使用，且被拒絕後下回合才能再次提出邀請
  const [allianceProposedThisTurn, setAllianceProposedThisTurn] = useState(false);

  const aiTimerRef = useRef(null);
  const fullHistoryRef = useRef([]);
  const turnNumberRef = useRef(1);
  const newsRequestIdRef = useRef(0);

  const addLog = (msg) => {
    const entry = {
      id: Date.now() + Math.random(),
      round: turnNumberRef.current,
      text: msg,
    };
    fullHistoryRef.current.push(entry);
    setLogs((prev) => [entry, ...prev].slice(0, 50));
    setHeadline(msg);
  };

  // 觸發終局政治新聞生成（支援切換媒體視角重新撰稿）
  const triggerNewsGeneration = async (winData, finalPlayers, styleId = 'standard') => {
    const reqId = ++newsRequestIdRef.current;
    setNewsStyle(styleId);
    setNewsLoading(true);
    setCopiedNews(false);

    const historySnapshot = [...fullHistoryRef.current];
    const roundsSnapshot = turnNumberRef.current;
    const article = await fetchPoliticalNewsFromGemini(
      winData,
      finalPlayers,
      historySnapshot,
      roundsSnapshot,
      styleId
    );
    if (reqId === newsRequestIdRef.current) {
      setNewsArticle(article);
      setNewsLoading(false);
    }
  };


  // 一鍵複製整篇政治新聞報導
  const handleCopyNews = async () => {
    if (!newsArticle) return;
    const styleTag = NEWS_STYLES.find((s) => s.id === newsStyle)?.tag || '政壇頭條';
    const fullText = [
      `【風暴日報 POLITIKO DAILY｜${styleTag}・第 ${turnNumber} 輪終局號外】`,
      `■ ${newsArticle.headline}`,
      newsArticle.subheadline ? `▸ ${newsArticle.subheadline}` : '',
      '',
      newsArticle.lead,
      '',
      ...(newsArticle.bodyParagraphs || []),
      '',
      newsArticle.punditQuote ? `💬 政論點評：${newsArticle.punditQuote}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedNews(true);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = fullText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedNews(true);
    }
    setTimeout(() => setCopiedNews(false), 2500);
  };

  // 判斷目前是否為多真人同機模式
  const humanCount = useMemo(
    () => players.filter((p) => !p.isAI).length,
    [players]
  );

  // 取得當前應顯示在底部操作區的視角玩家
  const viewingPlayer = useMemo(() => {
    if (players.length === 0) return null;
    if (pendingPrompt?.responderId !== undefined) {
      const resp = players.find((p) => p.id === pendingPrompt.responderId);
      if (resp && !resp.isAI) return resp;
    }
    if (pendingPrompt?.victimId !== undefined) {
      const vic = players.find((p) => p.id === pendingPrompt.victimId);
      if (vic && !vic.isAI) return vic;
    }
    const curr = players.find((p) => p.id === turnPlayerId);
    if (curr && !curr.isAI) return curr;
    const firstHuman = players.find((p) => !p.isAI);
    return firstHuman || players[0];
  }, [players, turnPlayerId, pendingPrompt]);

  // --------------------------------------------------------------------------
  // 階段一：遊戲設置與比現金決定起始玩家
  // --------------------------------------------------------------------------
  const randomizeWalletCash = () => {
    setSeatConfig((prev) =>
      prev.map((s) => ({
        ...s,
        cash: Math.floor(Math.random() * 48 + 2) * 100 + (Math.random() > 0.5 ? 50 : 0),
      }))
    );
  };

  const startPartyDraft = () => {
    // 找出身上現金最多的玩家擔任起始玩家
    let richest = seatConfig[0];
    seatConfig.forEach((s) => {
      if (s.cash > richest.cash) richest = s;
    });

    const shuffledParties = shuffleArray(PARTIES);
    const initPlayers = seatConfig.map((s, idx) => ({
      id: s.id,
      name: s.name,
      isAI: s.isAI,
      cash: s.cash,
      partyId: randomPartyDraft ? shuffledParties[idx].id : null,
      hand: [],
      ballotBox: [],
      allyId: null,
      partyUnrestricted: false,
      activeEffects: [], // 場上持續生效的連續效能陰謀卡
    }));

    setStartingPlayerId(richest.id);
    setWinnerInfo(null);
    setPendingPrompt(null);
    setAllianceProposedThisTurn(false);
    setLogs([]);
    fullHistoryRef.current = [];
    turnNumberRef.current = 1;
    newsRequestIdRef.current += 1;
    setNewsArticle(null);
    setNewsLoading(false);
    setCopiedNews(false);
    setShowTimelineInModal(false);

    // 若開啟「政黨隨機選擇開關」，直接為 4 人分配隨機政黨、發放 7 張起始手牌並進入對戰
    if (randomPartyDraft) {
      let freshDeck = buildFullDeck();
      const dealtPlayers = initPlayers.map((p) => {
        const hand = freshDeck.slice(0, 7);
        freshDeck = freshDeck.slice(7);
        return { ...p, hand };
      });
      const assignedSummary = dealtPlayers
        .map((p) => `${p.name}【${PARTIES.find((pt) => pt.id === p.partyId)?.name}】`)
        .join('、');

      addLog(`💰 比現金結果：${richest.name} 攜帶 NT$${richest.cash.toLocaleString()} 全場最有錢，擔任起始玩家！`);
      addLog(`🎲 隨機盲抽政黨完成：${assignedSummary}`);
      setPlayers(dealtPlayers);
      setDeck(freshDeck);
      setDiscard([]);
      setStage('playing');
      beginPlayerTurn(richest.id, dealtPlayers, freshDeck, [], 1);
      return;
    }

    setPlayers(initPlayers);
    setDraftTurnId(richest.id);
    addLog(`💰 比現金結果：${richest.name} 攜帶 NT$${richest.cash.toLocaleString()} 全場最有錢，成為起始玩家並依逆時針挑選政黨！`);
    setStage('draft');
  };

  // 政黨挑選階段：AI 自動選黨
  useEffect(() => {
    if (stage !== 'draft') return;
    const drafter = players.find((p) => p.id === draftTurnId);
    if (!drafter || !drafter.isAI) return;

    const timer = setTimeout(() => {
      const takenIds = players.map((p) => p.partyId).filter(Boolean);
      const available = PARTIES.filter((pt) => !takenIds.includes(pt.id));
      // AI 偏好票池較大或結盟彈性的政黨，保留適度隨機性
      const topChoices = available.slice(0, Math.min(4, available.length));
      const chosen = topChoices[Math.floor(Math.random() * topChoices.length)];
      handlePickParty(drafter.id, chosen.id);
    }, 650);

    return () => clearTimeout(timer);
  }, [stage, draftTurnId, players]);

  const handlePickParty = (playerId, partyId) => {
    const partyObj = PARTIES.find((pt) => pt.id === partyId);
    const updated = players.map((p) => (p.id === playerId ? { ...p, partyId } : p));
    const picker = updated.find((p) => p.id === playerId);
    addLog(`🏛️ ${picker.name} 選擇領導【${partyObj.name}】（有效票池 ${partyObj.poolSize} 張）`);

    const allPicked = updated.every((p) => p.partyId !== null);
    if (allPicked) {
      // 發放起始 7 張手牌並開始第 1 回合
      let freshDeck = buildFullDeck();
      const dealtPlayers = updated.map((p) => {
        const hand = freshDeck.slice(0, 7);
        freshDeck = freshDeck.slice(7);
        return { ...p, hand };
      });
      setPlayers(dealtPlayers);
      setDeck(freshDeck);
      setDiscard([]);
      setStage('playing');
      beginPlayerTurn(startingPlayerId, dealtPlayers, freshDeck, [], 1);
    } else {
      setPlayers(updated);
      setDraftTurnId(nextCounterClockwiseId(playerId));
    }
  };

  // 手動選黨階段輔助：為當前真人玩家隨機抽一黨
  const handleRandomPickForCurrent = () => {
    const currentDrafter = players.find((p) => p.id === draftTurnId);
    if (!currentDrafter || currentDrafter.isAI) return;
    const takenIds = players.map((p) => p.partyId).filter(Boolean);
    const available = PARTIES.filter((pt) => !takenIds.includes(pt.id));
    if (available.length === 0) return;
    const randomParty = available[Math.floor(Math.random() * available.length)];
    handlePickParty(currentDrafter.id, randomParty.id);
  };

  // 手動選黨階段輔助：將所有尚未選黨的玩家一鍵隨機分配並立即開局
  const handleRandomAssignRemaining = () => {
    const takenIds = players.map((p) => p.partyId).filter(Boolean);
    const remainingPool = shuffleArray(PARTIES.filter((pt) => !takenIds.includes(pt.id)));
    let poolIdx = 0;
    const updated = players.map((p) => {
      if (p.partyId) return p;
      const assigned = remainingPool[poolIdx++];
      return { ...p, partyId: assigned.id };
    });

    const summary = updated
      .map((p) => `${p.name}【${PARTIES.find((pt) => pt.id === p.partyId)?.name}】`)
      .join('、');
    addLog(`🎲 剩餘席次隨機分配政黨完成：${summary}`);

    let freshDeck = buildFullDeck();
    const dealtPlayers = updated.map((p) => {
      const hand = freshDeck.slice(0, 7);
      freshDeck = freshDeck.slice(7);
      return { ...p, hand };
    });
    setPlayers(dealtPlayers);
    setDeck(freshDeck);
    setDiscard([]);
    setStage('playing');
    beginPlayerTurn(startingPlayerId, dealtPlayers, freshDeck, [], 1);
  };

  // --------------------------------------------------------------------------
  // 階段二：回合推進、連續效能結算與抽牌
  // --------------------------------------------------------------------------
  const beginPlayerTurn = (nextId, currPlayers, currDeck, currDiscard, nextTurnNum) => {
    let workingPlayers = currPlayers.map((p) => ({
      ...p,
      hand: [...p.hand],
      ballotBox: [...p.ballotBox],
      activeEffects: p.activeEffects.map((ef) => ({ ...ef })),
    }));
    let workingDeck = [...currDeck];
    let workingDiscard = [...currDiscard];

    const activeIdx = workingPlayers.findIndex((p) => p.id === nextId);
    const activeP = workingPlayers[activeIdx];
    const partyName = PARTIES.find((pt) => pt.id === activeP.partyId)?.name || activeP.name;

    setTurnPlayerId(nextId);
    setTurnNumber(nextTurnNum);
    turnNumberRef.current = nextTurnNum;
    setTurnMode(null);
    setSchemesUsed(0);
    setMotionUsedThisTurn(false);
    setAllianceProposedThisTurn(false);

    // 若多人真人同機，顯示隱私遮罩
    const humanPlayersCount = workingPlayers.filter((p) => !p.isAI).length;
    if (!activeP.isAI && humanPlayersCount > 1) {
      setPrivacyShieldForId(nextId);
    } else {
      setPrivacyShieldForId(null);
    }

    // 1. 計算本回合抽牌數（檢查AI造假影片、網軍）
    let drawCount = 2;
    let skipDrawTriggered = false;
    const remainingEffects = [];

    activeP.activeEffects.forEach((ef) => {
      if (ef.code === 'military_scandal') {
        skipDrawTriggered = true;
        ef.turnsLeft -= 1;
        addLog(`🚫 【AI造假影片】發酵！${partyName} 本回合無法抽牌！`);
      } else if (ef.code === 'cyber_army') {
        drawCount = Math.max(0, drawCount - 1);
        ef.turnsLeft -= 1;
        addLog(`💻 【網軍】帶風向！${partyName} 本回合少抽 1 張牌！`);
      }

      if (ef.turnsLeft > 0) {
        remainingEffects.push(ef);
      } else if (ef.code === 'military_scandal' || ef.code === 'cyber_army') {
        workingDiscard.push(ef.cardObj);
      } else {
        remainingEffects.push(ef);
      }
    });

    activeP.activeEffects = remainingEffects;
    if (skipDrawTriggered) drawCount = 0;

    if (drawCount > 0) {
      const res = drawFromDeckSafe(workingDeck, workingDiscard, drawCount);
      activeP.hand.push(...res.drawn);
      workingDeck = res.nextDeck;
      workingDiscard = res.nextDiscard;
      addLog(`🔄 第 ${nextTurnNum} 輪：輪到【${partyName}】（${activeP.name}），抽取 ${res.drawn.length} 張牌。`);
    }

    // 2. 檢查回合初觸發的連續效能（假民調、課綱微調、佔領立法院）
    let startTurnFakePollCount = 0;
    let startTurnLoseVoteCount = 0;
    const afterStartEffects = [];

    activeP.activeEffects.forEach((ef) => {
      if (ef.code === 'fake_poll') {
        startTurnFakePollCount += 1;
        ef.turnsLeft -= 1;
        if (ef.turnsLeft > 0) afterStartEffects.push(ef);
        else workingDiscard.push(ef.cardObj);
      } else if (ef.code === 'curriculum' || ef.code === 'occupy_yuan') {
        startTurnLoseVoteCount += 1;
        ef.turnsLeft -= 1;
        addLog(`📢 【${ef.cardObj.name}】持續抗爭！${partyName} 流失選票！`);
        if (ef.turnsLeft > 0) afterStartEffects.push(ef);
        else workingDiscard.push(ef.cardObj);
      } else {
        afterStartEffects.push(ef);
      }
    });
    activeP.activeEffects = afterStartEffects;

    // 處理假民調自動/手動撿票
    for (let i = 0; i < startTurnFakePollCount; i++) {
      const validInDiscard = workingDiscard.filter((c) => isVoterValidForPlayer(c, activeP));
      if (validInDiscard.length > 0) {
        const picked = validInDiscard[0];
        workingDiscard = workingDiscard.filter((c) => c.uid !== picked.uid);
        activeP.ballotBox.push(picked);
        addLog(`📈 【假民調】持續發酵！${partyName} 從棄牌堆吸收 1 張【${picked.name}】！`);
      }
    }

    // 處理課綱微調/佔領立法院棄票
    for (let i = 0; i < startTurnLoseVoteCount; i++) {
      const voters = getEligibleBallotVoters(activeP);
      if (voters.length > 0) {
        const lost = voters[0];
        activeP.ballotBox = activeP.ballotBox.filter((c) => c.uid !== lost.uid);
        workingDiscard.push(lost);
      }
    }

    setPlayers(workingPlayers);
    setDeck(workingDeck);
    setDiscard(workingDiscard);

    // 檢查假民調是否直接觸發勝利
    const win = checkGameWinners(workingPlayers);
    if (win) {
      finishGame(win, workingPlayers);
    }
  };

  const finishGame = (winData, finalPlayers) => {
    setPlayers(finalPlayers);
    setWinnerInfo(winData);
    setPendingPrompt(null);
    setStage('gameover');
    const names = winData.winners
      .map((w) => `${PARTIES.find((pt) => pt.id === w.partyId)?.name}（${w.name}）`)
      .join(' ＆ ');
    addLog(
      `🏆 執政權誕生！恭喜 ${names} 以 ${winData.totalVotes} 張有效選票達成【${
        winData.mode === 'solo' ? '單獨執政獲勝' : '聯合執政獲勝'
      }】！`
    );
    triggerNewsGeneration(winData, finalPlayers, 'standard');
  };

  // 結束回合：檢查修改黨綱倒數與 7 張手牌上限
  const requestEndTurn = (overridePlayers = players, overrideDeck = deck, overrideDiscard = discard) => {
    const currP = overridePlayers.find((p) => p.id === turnPlayerId);
    if (!currP) return;

    if (currP.hand.length > 7) {
      const excess = currP.hand.length - 7;
      if (currP.isAI) {
        // AI 優先棄掉對自己無效的選民卡或過剩卡牌
        const sortedHand = [...currP.hand].sort((a, b) => {
          const scoreCard = (c) => {
            if (c.cardType === 'scheme') return canPlayCounter(c) ? 10 : 5;
            return isVoterValidForPlayer(c, currP) ? 6 : 0;
          };
          return scoreCard(a) - scoreCard(b);
        });
        const toDrop = sortedHand.slice(0, excess);
        const dropIds = new Set(toDrop.map((c) => c.uid));
        const nextPlayers = overridePlayers.map((p) =>
          p.id === currP.id ? { ...p, hand: p.hand.filter((c) => !dropIds.has(c.uid)) } : p
        );
        const nextDiscard = [...overrideDiscard, ...toDrop];
        addLog(`🗑️ ${currP.name} 棄置了 ${excess} 張超額手牌。`);
        finalizeEndTurn(nextPlayers, overrideDeck, nextDiscard);
      } else {
        setPlayers(overridePlayers);
        setDeck(overrideDeck);
        setDiscard(overrideDiscard);
        setPendingPrompt({
          type: 'DISCARD_EXCESS',
          responderId: currP.id,
          needCount: excess,
          selectedUids: [],
        });
      }
    } else {
      finalizeEndTurn(overridePlayers, overrideDeck, overrideDiscard);
    }
  };

  const finalizeEndTurn = (currPlayers, currDeck, currDiscard) => {
    let nextDiscard = [...currDiscard];
    const updatedPlayers = currPlayers.map((p) => {
      if (p.id !== turnPlayerId) return p;
      let unlocked = p.partyUnrestricted;
      const keptEffects = [];
      p.activeEffects.forEach((ef) => {
        if (ef.code === 'amend_charter') {
          if (ef.justPlayed) {
            keptEffects.push({ ...ef, justPlayed: false });
          } else {
            const left = ef.turnsLeft - 1;
            if (left <= 0) {
              unlocked = true;
              nextDiscard.push(ef.cardObj);
              const partyName = PARTIES.find((pt) => pt.id === p.partyId)?.name;
              addLog(`🔓 【修改黨綱】完成！${partyName} 即刻起解除所有選民結構限制，全選民通吃！`);
            } else {
              keptEffects.push({ ...ef, turnsLeft: left });
            }
          }
        } else {
          keptEffects.push(ef);
        }
      });
      return { ...p, partyUnrestricted: unlocked, activeEffects: keptEffects };
    });

    const nextId = nextCounterClockwiseId(turnPlayerId);
    const nextRound = nextId === startingPlayerId ? turnNumber + 1 : turnNumber;
    beginPlayerTurn(nextId, updatedPlayers, currDeck, nextDiscard, nextRound);
  };

  // --------------------------------------------------------------------------
  // 階段三：打出選民卡（行動二選一之 A）
  // --------------------------------------------------------------------------
  const hasAmendLock = (player) =>
    player?.activeEffects.some((ef) => ef.code === 'amend_charter' && !ef.justPlayed);

  const handlePlayVoterCard = (playerId, cardUid) => {
    const p = players.find((x) => x.id === playerId);
    if (!p || playerId !== turnPlayerId) return;
    if (turnMode === 'scheme') return;
    if (hasAmendLock(p)) return;

    const card = p.hand.find((c) => c.uid === cardUid);
    if (!card || !isVoterValidForPlayer(card, p)) return;

    const nextPlayers = players.map((pl) =>
      pl.id === playerId
        ? {
            ...pl,
            hand: pl.hand.filter((c) => c.uid !== cardUid),
            ballotBox: [...pl.ballotBox, card],
          }
        : pl
    );

    const partyName = PARTIES.find((pt) => pt.id === p.partyId)?.name;
    setTurnMode('voter');
    setPlayers(nextPlayers);
    addLog(`🗳️ 【${partyName}】爭取到選民【${card.name}（${STANCE_LABELS[card.stance].text}）】支持！`);

    const win = checkGameWinners(nextPlayers);
    if (win) finishGame(win, nextPlayers);
  };

  const handlePlayAllValidVoters = (playerId) => {
    const p = players.find((x) => x.id === playerId);
    if (!p || playerId !== turnPlayerId || turnMode === 'scheme' || hasAmendLock(p)) return;

    const validCards = p.hand.filter((c) => isVoterValidForPlayer(c, p));
    if (validCards.length === 0) return;

    const validSet = new Set(validCards.map((c) => c.uid));
    const nextPlayers = players.map((pl) =>
      pl.id === playerId
        ? {
            ...pl,
            hand: pl.hand.filter((c) => !validSet.has(c.uid)),
            ballotBox: [...pl.ballotBox, ...validCards],
          }
        : pl
    );

    const partyName = PARTIES.find((pt) => pt.id === p.partyId)?.name;
    setTurnMode('voter');
    setPlayers(nextPlayers);
    addLog(`🗳️ 【${partyName}】一口氣動員打出 ${validCards.length} 張有效選民卡！`);

    const win = checkGameWinners(nextPlayers);
    if (win) finishGame(win, nextPlayers);
  };

  // --------------------------------------------------------------------------
  // 階段四：陰謀卡發動、即時反制判定與效果結算（行動二選一之 B，上限 2 次）
  // --------------------------------------------------------------------------
  const initiateSchemePlay = (actorId, cardUid, options = {}) => {
    const actor = players.find((p) => p.id === actorId);
    if (!actor || actorId !== turnPlayerId) return;
    if (turnMode === 'voter' || schemesUsed >= 2) return;

    const card = actor.hand.find((c) => c.uid === cardUid);
    if (!card) return;

    // 先從發動者手牌移除此陰謀卡，並消耗 1 次陰謀額度
    const nextPlayers = players.map((p) =>
      p.id === actorId ? { ...p, hand: p.hand.filter((c) => c.uid !== cardUid) } : p
    );
    const nextSchemesUsed = schemesUsed + 1;
    setTurnMode('scheme');
    setSchemesUsed(nextSchemesUsed);
    setPlayers(nextPlayers);

    const actorParty = PARTIES.find((pt) => pt.id === actor.partyId)?.name;
    const targetPlayer = options.targetId !== undefined ? nextPlayers.find((p) => p.id === options.targetId) : null;
    const targetParty = targetPlayer ? PARTIES.find((pt) => pt.id === targetPlayer.partyId)?.name : null;

    addLog(
      `⚡ 【${actorParty}】打出陰謀卡《${card.name}》${targetParty ? `（目標：${targetParty}）` : ''}！`
    );

    const payload = {
      actorId,
      card,
      options,
      nextSchemesUsed,
    };

    // 依逆時針順序檢查其他玩家是否持有並發動「即時反制牌」
    checkCounterWindow(actorId, nextCounterClockwiseId(actorId), payload, nextPlayers, deck, discard);
  };

  const checkCounterWindow = (actorId, checkId, payload, currPlayers, currDeck, currDiscard) => {
    if (checkId === actorId) {
      // 全場無人反制，正式執行陰謀效果！
      executeSchemeResolution(payload, currPlayers, currDeck, currDiscard);
      return;
    }

    const responder = currPlayers.find((p) => p.id === checkId);
    const counterCards = responder ? responder.hand.filter(canPlayCounter) : [];

    if (counterCards.length === 0) {
      checkCounterWindow(actorId, nextCounterClockwiseId(checkId), payload, currPlayers, currDeck, currDiscard);
      return;
    }

    const actor = currPlayers.find((p) => p.id === actorId);
    // 若為電腦 AI 持有反制牌：評估威脅度決定是否攔截（因全牌庫僅 5 張反制牌，AI 只擋關鍵大招）
    if (responder.isAI) {
      const isAlly = responder.allyId === actorId;
      const actorVotes = getPlayerVoteScore(actor);
      const highThreatCodes = ['buy_votes', 'rig_votes', 'recall', 'party_strife', 'apache', 'party_mutiny', 'amend_charter'];
      const targetsMe = payload.options?.targetId === responder.id || payload.card.aoeSteal > 0;
      const shouldAICounter =
        !isAlly &&
        ((highThreatCodes.includes(payload.card.code) && (actorVotes >= 5 || targetsMe)) ||
          (targetsMe && payload.card.stealCount >= 2));

      if (shouldAICounter) {
        const usedCounter = counterCards[0];
        const updatedPlayers = currPlayers.map((p) =>
          p.id === responder.id ? { ...p, hand: p.hand.filter((c) => c.uid !== usedCounter.uid) } : p
        );
        const updatedDiscard = [...currDiscard, payload.card, usedCounter];
        const respParty = PARTIES.find((pt) => pt.id === responder.partyId)?.name;
        addLog(`🛡️ 即時反制！【${respParty}】打出《${usedCounter.name}》，徹底粉碎了《${payload.card.name}》！`);
        setPlayers(updatedPlayers);
        setDiscard(updatedDiscard);
        return;
      } else {
        checkCounterWindow(actorId, nextCounterClockwiseId(checkId), payload, currPlayers, currDeck, currDiscard);
        return;
      }
    }

    // 真人玩家持有反制牌：彈出即時反制詢問視窗
    setPlayers(currPlayers);
    setDeck(currDeck);
    setDiscard(currDiscard);
    setPendingPrompt({
      type: 'COUNTER_PROMPT',
      responderId: responder.id,
      actorId,
      counterCards,
      payload,
    });
  };

  const handleHumanCounterDecision = (counterCardUid) => {
    if (!pendingPrompt || pendingPrompt.type !== 'COUNTER_PROMPT') return;
    const { responderId, actorId, payload } = pendingPrompt;
    setPendingPrompt(null);

    if (counterCardUid) {
      const responder = players.find((p) => p.id === responderId);
      const usedCounter = responder.hand.find((c) => c.uid === counterCardUid);
      const updatedPlayers = players.map((p) =>
        p.id === responderId ? { ...p, hand: p.hand.filter((c) => c.uid !== counterCardUid) } : p
      );
      const updatedDiscard = [...discard, payload.card, usedCounter];
      const respParty = PARTIES.find((pt) => pt.id === responder.partyId)?.name;
      addLog(`🛡️ 即時反制！【${respParty}】拍桌打出《${usedCounter.name}》，取消了《${payload.card.name}》！`);
      setPlayers(updatedPlayers);
      setDiscard(updatedDiscard);
    } else {
      checkCounterWindow(actorId, nextCounterClockwiseId(responderId), payload, players, deck, discard);
    }
  };

  // 正式執行未被反制的陰謀效果
  const executeSchemeResolution = (payload, currPlayers, currDeck, currDiscard) => {
    const { actorId, card, options } = payload;
    let workingPlayers = currPlayers.map((p) => ({
      ...p,
      hand: [...p.hand],
      ballotBox: [...p.ballotBox],
      activeEffects: [...p.activeEffects],
    }));
    let workingDeck = [...currDeck];
    let workingDiscard = [...currDiscard];

    const actor = workingPlayers.find((p) => p.id === actorId);
    const actorParty = PARTIES.find((pt) => pt.id === actor.partyId)?.name;

    // 1. 買票
    if (card.code === 'buy_votes') {
      const res = drawFromDeckSafe(workingDeck, workingDiscard, 4);
      workingDeck = res.nextDeck;
      workingDiscard = res.nextDiscard;
      const drawnVoters = res.drawn
        .filter((c) => c.cardType === 'voter')
        .map((c) => ({ ...c, boughtVote: true }));
      const drawnSchemes = res.drawn.filter((c) => c.cardType === 'scheme');
      actor.ballotBox.push(...drawnVoters);
      workingDeck = shuffleArray([...workingDeck, ...drawnSchemes]);
      workingDiscard.push(card);
      addLog(`💵 《買票》生效！【${actorParty}】抽中 ${drawnVoters.length} 張選民卡直接入匭（不受結構限制），${drawnSchemes.length} 張陰謀洗回牌堆！`);
      commitStateAndCheckWin(workingPlayers, workingDeck, workingDiscard);
      return;
    }

    // 2. 作票
    if (card.code === 'rig_votes') {
      actor.ballotBox.push(card);
      addLog(`📦 《作票》成功！【${actorParty}】選票區直接增加 2 張有效選票！`);
      commitStateAndCheckWin(workingPlayers, workingDeck, workingDiscard);
      return;
    }

    // 3. 修改黨綱（連續2回合禁打選民，之後永久解除結構限制）
    if (card.code === 'amend_charter') {
      actor.activeEffects.push({
        code: 'amend_charter',
        turnsLeft: 2,
        justPlayed: true,
        cardObj: card,
      });
      addLog(`📜 【${actorParty}】啟動《修改黨綱》！接下來 2 回合暫停打出選民卡，完成後將全選民通吃！`);
      commitStateAndCheckWin(workingPlayers, workingDeck, workingDiscard);
      return;
    }

    // 4. 單體搶奪選票（美牛、特別費、鬼島、境外資金介選、罷免、民生卡搶票模式）
    if (
      ['us_beef', 'special_fund', 'ghost_island', 'im_japanese'].includes(card.code) ||
      (card.code === 'livelihood' && options.mode === 'steal')
    ) {
      const count = card.code === 'livelihood' ? 1 : 2;
      workingDiscard.push(card);
      const queue = [{ victimId: options.targetId, count, filterType: 'any', destination: 'steal', attackerId: actorId }];
      processVictimQueue(queue, workingPlayers, workingDeck, workingDiscard);
      return;
    }

    if (card.code === 'recall') {
      workingDiscard.push(card);
      const targetP = workingPlayers.find((p) => p.id === options.targetId);
      const queue = [];
      if (targetP) {
        const targetVoterCount = getEligibleBallotVoters(targetP).length;
        if (targetP.allyId !== null && targetVoterCount < 3) {
          queue.push({ victimId: targetP.id, count: targetVoterCount, filterType: 'any', destination: 'steal', attackerId: actorId });
          queue.push({ victimId: targetP.allyId, count: 3 - targetVoterCount, filterType: 'any', destination: 'steal', attackerId: actorId });
        } else {
          queue.push({ victimId: targetP.id, count: 3, filterType: 'any', destination: 'steal', attackerId: actorId });
        }
      }
      processVictimQueue(queue, workingPlayers, workingDeck, workingDiscard);
      return;
    }

    // 5. 全場掃票（立法院互毆、包車造勢、政黨惡鬥）
    if (card.aoeSteal > 0) {
      workingDiscard.push(card);
      const queue = [];
      let pid = nextCounterClockwiseId(actorId);
      while (pid !== actorId) {
        queue.push({ victimId: pid, count: card.aoeSteal, filterType: 'any', destination: 'steal', attackerId: actorId });
        pid = nextCounterClockwiseId(pid);
      }
      processVictimQueue(queue, workingPlayers, workingDeck, workingDiscard);
      return;
    }

    // 6. 操控族群對立 1/2/3
    if (card.targetEthnic) {
      workingDiscard.push(card);
      const queue = [
        {
          victimId: options.targetId,
          count: 3,
          filterType: 'ethnic',
          filterValue: card.targetEthnic,
          destination: 'steal',
          attackerId: actorId,
        },
      ];
      processVictimQueue(queue, workingPlayers, workingDeck, workingDiscard);
      return;
    }

    // 7. 一中同表
    if (card.code === 'one_china') {
      workingDiscard.push(card);
      if (options.mode === 'purge_anti') {
        const idsToPurge = [actorId, actor.allyId].filter((x) => x !== null);
        let purgedCount = 0;
        workingPlayers.forEach((p) => {
          if (idsToPurge.includes(p.id)) {
            const antiCards = p.ballotBox.filter((c) => c.cardType === 'voter' && c.stance === 'anti');
            purgedCount += antiCards.length;
            workingDiscard.push(...antiCards);
            p.ballotBox = p.ballotBox.filter((c) => !(c.cardType === 'voter' && c.stance === 'anti'));
          }
        });
        addLog(`🔥 《一中同表》清理門戶！共棄置 ${purgedCount} 張反中選民卡！`);
        commitStateAndCheckWin(workingPlayers, workingDeck, workingDiscard);
      } else {
        const queue = [];
        let pid = nextCounterClockwiseId(actorId);
        while (pid !== actorId) {
          queue.push({
            victimId: pid,
            count: 3,
            filterType: 'stance',
            filterValue: 'pro',
            destination: 'steal',
            attackerId: actorId,
          });
          pid = nextCounterClockwiseId(pid);
        }
        processVictimQueue(queue, workingPlayers, workingDeck, workingDiscard);
      }
      return;
    }

    // 8. 棄牌堆回收選票（民生卡回收模式、政見辯論會、假民調）
    if ((card.code === 'livelihood' && options.mode === 'recover') || card.code === 'apache' || card.code === 'fake_poll') {
      const pickMax = card.code === 'apache' ? 2 : 1;
      if (card.code === 'fake_poll') {
        actor.activeEffects.push({
          code: 'fake_poll',
          turnsLeft: 2, // 當下立即撿 1 張 + 接下來 2 回合初各撿 1 張 = 連續 3 回合
          cardObj: card,
        });
      } else {
        workingDiscard.push(card);
      }

      const validInDiscard = workingDiscard.filter((c) => isVoterValidForPlayer(c, actor));
      if (validInDiscard.length === 0) {
        addLog(`📭 棄牌堆中目前沒有符合【${actorParty}】結構的有效選民卡。`);
        commitStateAndCheckWin(workingPlayers, workingDeck, workingDiscard);
        return;
      }

      if (actor.isAI || validInDiscard.length <= pickMax) {
        const chosen = validInDiscard.slice(0, pickMax);
        const chosenSet = new Set(chosen.map((c) => c.uid));
        workingDiscard = workingDiscard.filter((c) => !chosenSet.has(c.uid));
        actor.ballotBox.push(...chosen);
        addLog(`♻️ 【${actorParty}】透過《${card.name}》從棄牌堆吸收了 ${chosen.length} 張有效選票！`);
        commitStateAndCheckWin(workingPlayers, workingDeck, workingDiscard);
      } else {
        setPlayers(workingPlayers);
        setDeck(workingDeck);
        setDiscard(workingDiscard);
        setPendingPrompt({
          type: 'PICK_DISCARD_VOTERS',
          responderId: actorId,
          maxCount: pickMax,
          mode: 'to_ballot',
          selectedUids: [],
          title: `《${card.name}》：請從棄牌堆挑選最多 ${pickMax} 張有效選民卡放入選票區`,
        });
      }
      return;
    }

    // 9. 單體破壞選票（暴民抗議、食安）
    if (card.code === 'mob_protest' || card.code === 'food_safety') {
      workingDiscard.push(card);
      const queue = [{ victimId: options.targetId, count: 1, filterType: 'any', destination: 'discard', attackerId: actorId }];
      processVictimQueue(queue, workingPlayers, workingDeck, workingDiscard);
      return;
    }

    // 10. 連續破壞選票／抽牌封鎖（課綱微調、佔領立法院、AI造假影片、網軍）
    if (['curriculum', 'occupy_yuan', 'military_scandal', 'cyber_army'].includes(card.code)) {
      const target = workingPlayers.find((p) => p.id === options.targetId);
      const turns = card.code === 'military_scandal' ? 1 : 3;
      if (target) {
        target.activeEffects.push({
          code: card.code,
          turnsLeft: turns,
          cardObj: card,
        });
        const targetParty = PARTIES.find((pt) => pt.id === target.partyId)?.name;
        addLog(`📌 《${card.name}》掛載於【${targetParty}】（持續 ${turns} 回合）！`);
      } else {
        workingDiscard.push(card);
      }
      commitStateAndCheckWin(workingPlayers, workingDeck, workingDiscard);
      return;
    }

    // 11. 手牌隨機干擾（媒體壟斷、油電雙漲、名嘴治國主動棄3張）
    if (card.code === 'media_monopoly' || card.code === 'pundit_rule') {
      workingDiscard.push(card);
      const dropNum = card.code === 'pundit_rule' ? 3 : 2;
      const target = workingPlayers.find((p) => p.id === options.targetId);
      if (target && target.hand.length > 0) {
        const shuffled = shuffleArray(target.hand);
        const dropped = shuffled.slice(0, dropNum);
        const dropSet = new Set(dropped.map((c) => c.uid));
        target.hand = target.hand.filter((c) => !dropSet.has(c.uid));
        workingDiscard.push(...dropped);
        const targetParty = PARTIES.find((pt) => pt.id === target.partyId)?.name;
        addLog(`📺 《${card.name}》重創【${targetParty}】，隨機棄置其 ${dropped.length} 張手牌！`);
      }
      commitStateAndCheckWin(workingPlayers, workingDeck, workingDiscard);
      return;
    }

    if (card.code === 'fuel_hike') {
      workingDiscard.push(card);
      const target = workingPlayers.find((p) => p.id === options.targetId);
      if (target && target.hand.length > 0) {
        const shuffled = shuffleArray(target.hand);
        const stolen = shuffled.slice(0, 2);
        const stolenSet = new Set(stolen.map((c) => c.uid));
        target.hand = target.hand.filter((c) => !stolenSet.has(c.uid));
        actor.hand.push(...stolen);
        const targetParty = PARTIES.find((pt) => pt.id === target.partyId)?.name;
        addLog(`⛽ 《油電雙漲》！【${actorParty}】從【${targetParty}】手中抽走 ${stolen.length} 張手牌！`);
      }
      commitStateAndCheckWin(workingPlayers, workingDeck, workingDiscard);
      return;
    }

    // 12. 更換候選人（棄光手牌重抽 7 張）
    if (card.code === 'replace_candidate') {
      workingDiscard.push(...actor.hand, card);
      actor.hand = [];
      const res = drawFromDeckSafe(workingDeck, workingDiscard, 7);
      actor.hand = res.drawn;
      workingDeck = res.nextDeck;
      workingDiscard = res.nextDiscard;
      addLog(`🔄 《更換候選人》！【${actorParty}】陣前換將，棄光手牌重新抽取 ${res.drawn.length} 張牌！`);
      commitStateAndCheckWin(workingPlayers, workingDeck, workingDiscard);
      return;
    }

    // 13. 降低投票年齡（從棄牌堆挑最多 10 張選民卡洗回抽牌堆）
    if (card.code === 'lower_voting_age') {
      workingDiscard.push(card);
      const votersInDiscard = workingDiscard.filter((c) => c.cardType === 'voter');
      if (votersInDiscard.length === 0) {
        addLog(`📭 棄牌堆目前沒有任何選民卡可洗回牌堆。`);
        commitStateAndCheckWin(workingPlayers, workingDeck, workingDiscard);
        return;
      }
      if (actor.isAI || votersInDiscard.length <= 10) {
        const picked = votersInDiscard
          .sort((a, b) => (isVoterValidForPlayer(b, actor) ? 1 : 0) - (isVoterValidForPlayer(a, actor) ? 1 : 0))
          .slice(0, 10);
        const pickedSet = new Set(picked.map((c) => c.uid));
        workingDiscard = workingDiscard.filter((c) => !pickedSet.has(c.uid));
        workingDeck = shuffleArray([...workingDeck, ...picked]);
        addLog(`🎓 《降低投票年齡》！【${actorParty}】將 ${picked.length} 張選民卡重新洗回抽牌堆！`);
        commitStateAndCheckWin(workingPlayers, workingDeck, workingDiscard);
      } else {
        setPlayers(workingPlayers);
        setDeck(workingDeck);
        setDiscard(workingDiscard);
        setPendingPrompt({
          type: 'PICK_DISCARD_VOTERS',
          responderId: actorId,
          maxCount: 10,
          mode: 'to_deck',
          selectedUids: [],
          title: '《降低投票年齡》：請從棄牌堆挑選最多 10 張選民卡洗回抽牌堆',
        });
      }
      return;
    }

    // 14. 黑箱作業（重排牌堆頂 8 張）
    if (card.code === 'black_box') {
      workingDiscard.push(card);
      if (workingDeck.length < 8 && workingDiscard.length > 1) {
        const res = drawFromDeckSafe(workingDeck, workingDiscard, 8);
        workingDeck = [...res.drawn, ...res.nextDeck];
        workingDiscard = res.nextDiscard;
      }
      const top8 = workingDeck.slice(0, 8);
      if (actor.isAI) {
        // AI 將對自己最有利的牌排在最上方
        const sortedTop = [...top8].sort((a, b) => {
          const val = (c) => (isVoterValidForPlayer(c, actor) ? 2 : c.cardType === 'scheme' ? 1 : 0);
          return val(b) - val(a);
        });
        workingDeck = [...sortedTop, ...workingDeck.slice(8)];
        addLog(`🕶️ 《黑箱作業》！【${actorParty}】暗中調整了抽牌堆頂端 8 張卡牌順序！`);
        commitStateAndCheckWin(workingPlayers, workingDeck, workingDiscard);
      } else {
        setPlayers(workingPlayers);
        setDeck(workingDeck);
        setDiscard(workingDiscard);
        setPendingPrompt({
          type: 'BLACK_BOX_SORT',
          responderId: actorId,
          cardsOrder: top8,
        });
      }
      return;
    }

    // 15. 政黨叛變（強制結盟無視限制／強制拆散聯盟）
    if (card.code === 'party_mutiny') {
      workingDiscard.push(card);
      if (options.mode === 'force_ally') {
        const target = workingPlayers.find((p) => p.id === options.targetId);
        if (target && target.id !== actorId) {
          // 清除雙方原有的舊聯盟關係
          workingPlayers.forEach((p) => {
            if (p.allyId === actorId || p.allyId === target.id) p.allyId = null;
          });
          actor.allyId = target.id;
          target.allyId = actorId;
          const targetParty = PARTIES.find((pt) => pt.id === target.partyId)?.name;
          addLog(`🤝⚡ 《政黨叛變》跌破眼鏡！【${actorParty}】無視意識形態限制，強制與【${targetParty}】組成執政聯盟！`);
        }
      } else {
        const target = workingPlayers.find((p) => p.id === options.targetId);
        if (target && target.allyId !== null) {
          const oldAlly = workingPlayers.find((p) => p.id === target.allyId);
          const targetParty = PARTIES.find((pt) => pt.id === target.partyId)?.name;
          const oldAllyParty = oldAlly ? PARTIES.find((pt) => pt.id === oldAlly.partyId)?.name : '';
          if (oldAlly) oldAlly.allyId = null;
          target.allyId = null;
          addLog(`💔 《政黨叛變》拆夥！【${targetParty}】與【${oldAllyParty}】的聯盟正式瓦解！`);
        }
      }
      commitStateAndCheckWin(workingPlayers, workingDeck, workingDiscard);
      return;
    }
  };

  // 處理被攻擊玩家自選交出或棄置選民卡佇列
  const processVictimQueue = (queue, currPlayers, currDeck, currDiscard) => {
    let workingPlayers = currPlayers.map((p) => ({ ...p, ballotBox: [...p.ballotBox] }));
    let workingDiscard = [...currDiscard];

    while (queue.length > 0) {
      const task = queue[0];
      const victim = workingPlayers.find((p) => p.id === task.victimId);
      const attacker = workingPlayers.find((p) => p.id === task.attackerId);
      if (!victim || !attacker || task.count <= 0) {
        queue.shift();
        continue;
      }

      const filterFn = (c) => {
        if (task.filterType === 'ethnic') return c.ethnic === task.filterValue;
        if (task.filterType === 'stance') return c.stance === task.filterValue;
        return true;
      };
      const eligible = getEligibleBallotVoters(victim, filterFn);

      if (eligible.length === 0) {
        queue.shift();
        continue;
      }

      if (eligible.length <= task.count) {
        // 張數不足或剛好：全數轉移，無需挑選
        transferVictimVoters(victim, attacker, eligible, task.destination, workingDiscard);
        queue.shift();
        continue;
      }

      if (victim.isAI) {
        // AI 聰明防禦：優先挑「對攻擊者無效」的選民卡交出，使其作廢進棄牌堆！
        const sorted = [...eligible].sort((a, b) => {
          const aValidForAttacker = isVoterValidForPlayer({ ...a, boughtVote: false }, attacker) ? 1 : 0;
          const bValidForAttacker = isVoterValidForPlayer({ ...b, boughtVote: false }, attacker) ? 1 : 0;
          return aValidForAttacker - bValidForAttacker;
        });
        const chosen = sorted.slice(0, task.count);
        transferVictimVoters(victim, attacker, chosen, task.destination, workingDiscard);
        queue.shift();
        continue;
      }

      // 真人受害者且可選張數大於需求：彈出挑選視窗
      setPlayers(workingPlayers);
      setDeck(currDeck);
      setDiscard(workingDiscard);
      setPendingPrompt({
        type: 'VICTIM_SELECT',
        victimId: victim.id,
        attackerId: attacker.id,
        needCount: task.count,
        eligibleCards: eligible,
        destination: task.destination,
        selectedUids: [],
        remainingQueue: queue.slice(1),
      });
      return;
    }

    commitStateAndCheckWin(workingPlayers, currDeck, workingDiscard);
  };

  const transferVictimVoters = (victim, attacker, chosenCards, destination, workingDiscard) => {
    const chosenSet = new Set(chosenCards.map((c) => c.uid));
    victim.ballotBox = victim.ballotBox.filter((c) => !chosenSet.has(c.uid));

    const victimParty = PARTIES.find((pt) => pt.id === victim.partyId)?.name;
    const attackerParty = PARTIES.find((pt) => pt.id === attacker.partyId)?.name;

    if (destination === 'discard') {
      chosenCards.forEach((c) => {
        const clean = { ...c };
        delete clean.boughtVote;
        workingDiscard.push(clean);
      });
      addLog(`💥 【${victimParty}】被迫將 ${chosenCards.length} 張選民卡丟入棄牌堆！`);
    } else {
      let absorbed = 0;
      let wasted = 0;
      chosenCards.forEach((c) => {
        const clean = { ...c };
        delete clean.boughtVote;
        if (isVoterValidForPlayer(clean, attacker)) {
          attacker.ballotBox.push(clean);
          absorbed += 1;
        } else {
          workingDiscard.push(clean);
          wasted += 1;
        }
      });
      addLog(
        `🎯 【${victimParty}】交出 ${chosenCards.length} 張選民卡：【${attackerParty}】成功吸收 ${absorbed} 張${
          wasted > 0 ? `，${wasted} 張不符結構流入棄牌堆` : ''
        }！`
      );
    }
  };

  const commitStateAndCheckWin = (nextPlayers, nextDeck, nextDiscard) => {
    setPlayers(nextPlayers);
    setDeck(nextDeck);
    setDiscard(nextDiscard);
    const win = checkGameWinners(nextPlayers);
    if (win) finishGame(win, nextPlayers);
  };

  // --------------------------------------------------------------------------
  // 階段五：政黨結盟、盟友換牌、毀約拆夥（皆視同使用 1 次陰謀）
  // --------------------------------------------------------------------------
  const handleProposeAlliance = (proposerId, targetId) => {
    const proposer = players.find((p) => p.id === proposerId);
    const target = players.find((p) => p.id === targetId);
    if (!proposer || !target || turnMode === 'voter' || schemesUsed >= 2 || allianceProposedThisTurn) return;
    if (!canNaturallyAlly(proposer, target)) return;

    // 標記本回合已使用過協商結盟（一回合限對一對象使用，遭拒亦須待下回合才能再次邀請）
    setAllianceProposedThisTurn(true);

    const pParty = PARTIES.find((pt) => pt.id === proposer.partyId)?.name;
    const tParty = PARTIES.find((pt) => pt.id === target.partyId)?.name;

    if (target.isAI) {
      // AI 結盟評估：若雙方合計票數可觀，或場上有其他領先威脅，則同意結盟
      const combined = getPlayerVoteScore(proposer) + getPlayerVoteScore(target);
      const targetSolo = getPlayerVoteScore(target);
      const otherThreat = players.some(
        (x) => x.id !== proposerId && x.id !== targetId && getPlayerVoteScore(x) >= 5
      );
      const aiAgrees = targetSolo < 7 && (combined >= 5 || otherThreat || Math.random() < 0.72);

      if (aiAgrees) {
        const nextPlayers = players.map((p) => {
          if (p.id === proposerId) return { ...p, allyId: targetId };
          if (p.id === targetId) return { ...p, allyId: proposerId };
          return p;
        });
        setTurnMode('scheme');
        setSchemesUsed((s) => s + 1);
        addLog(`🤝 藍綠白合縱連橫！【${pParty}】與【${tParty}】協商結盟成功，正式組成執政聯盟（消耗 1 次陰謀）！`);
        commitStateAndCheckWin(nextPlayers, deck, discard);
      } else {
        addLog(`🙅 【${tParty}】（${target.name}）婉拒了【${pParty}】的協商結盟邀請（須待下回合才能再次提出邀請）。`);
      }
    } else {
      setPendingPrompt({
        type: 'ALLIANCE_INVITE',
        proposerId,
        responderId: targetId,
      });
    }
  };

  const handleBreakAllianceByVotes = (actorId) => {
    const actor = players.find((p) => p.id === actorId);
    if (!actor || actor.allyId === null || turnMode === 'voter' || schemesUsed >= 2) return;
    const eligible = getEligibleBallotVoters(actor);
    if (eligible.length < 2) return;

    const toDiscard = eligible.slice(0, 2);
    const dropSet = new Set(toDiscard.map((c) => c.uid));
    const oldAlly = players.find((p) => p.id === actor.allyId);
    const aParty = PARTIES.find((pt) => pt.id === actor.partyId)?.name;
    const bParty = oldAlly ? PARTIES.find((pt) => pt.id === oldAlly.partyId)?.name : '';

    const nextPlayers = players.map((p) => {
      if (p.id === actorId) {
        return {
          ...p,
          allyId: null,
          ballotBox: p.ballotBox.filter((c) => !dropSet.has(c.uid)),
        };
      }
      if (p.id === actor.allyId) {
        return { ...p, allyId: null };
      }
      return p;
    });

    setTurnMode('scheme');
    setSchemesUsed((s) => s + 1);
    addLog(`💔 【${aParty}】自願棄置 2 張選票，正式撕毀與【${bParty}】的聯盟協議（消耗 1 次陰謀）！`);
    commitStateAndCheckWin(nextPlayers, deck, [...discard, ...toDiscard]);
  };

  const executeAllyTrade = (actorId, giveUids) => {
    const actor = players.find((p) => p.id === actorId);
    if (!actor || actor.allyId === null || giveUids.length === 0) return;
    const ally = players.find((p) => p.id === actor.allyId);
    if (!ally) return;

    const giveSet = new Set(giveUids);
    const actorGiveCards = actor.hand.filter((c) => giveSet.has(c.uid));

    // AI 盟友優先回贈「符合玩家政黨結構、但對 AI 自己無效」的選民卡，實現真正的政治互利！
    const allyCandidates = [...ally.hand].sort((a, b) => {
      const scoreForActor = (c) => {
        const goodForActor = isVoterValidForPlayer(c, actor) ? 3 : 0;
        const badForAlly = !isVoterValidForPlayer(c, ally) && c.cardType === 'voter' ? 2 : 0;
        return goodForActor + badForAlly;
      };
      return scoreForActor(b) - scoreForActor(a);
    });
    const returnCount = Math.min(allyCandidates.length, Math.max(1, giveUids.length));
    const allyGiveCards = allyCandidates.slice(0, returnCount);
    const allyGiveSet = new Set(allyGiveCards.map((c) => c.uid));

    const nextPlayers = players.map((p) => {
      if (p.id === actorId) {
        return {
          ...p,
          hand: [...p.hand.filter((c) => !giveSet.has(c.uid)), ...allyGiveCards],
        };
      }
      if (p.id === ally.id) {
        return {
          ...p,
          hand: [...p.hand.filter((c) => !allyGiveSet.has(c.uid)), ...actorGiveCards],
        };
      }
      return p;
    });

    const aParty = PARTIES.find((pt) => pt.id === actor.partyId)?.name;
    const bParty = PARTIES.find((pt) => pt.id === ally.partyId)?.name;
    setTurnMode('scheme');
    setSchemesUsed((s) => s + 1);
    setPlayers(nextPlayers);
    addLog(`🔄 密室協商換票！【${aParty}】拿出 ${actorGiveCards.length} 張牌與盟友【${bParty}】交換了 ${allyGiveCards.length} 張手牌（消耗 1 次陰謀）！`);
  };

  // 官方多數決特殊規則：立院臨時動議（過半數即 >=3 票同意即生效）
  const handleProposeMajorityMotion = (motionType, targetId) => {
    const proposer = players.find((p) => p.id === turnPlayerId);
    const target = players.find((p) => p.id === targetId);
    if (!proposer || !target || motionUsedThisTurn) return;

    setMotionUsedThisTurn(true);
    let yesVotes = 1; // 提案人自己預設同意
    const voteDetails = [`${proposer.name}(贊成)`];

    players.forEach((p) => {
      if (p.id === proposer.id) return;
      const targetVotes = getPlayerVoteScore(target);
      // 其他玩家若發現目標正在領先，傾向投贊成票一起制衡領頭羊！
      let approve = false;
      if (p.id === targetId) {
        approve = false;
      } else if (p.allyId === proposer.id || targetVotes >= 4 || Math.random() < 0.65) {
        approve = true;
      }
      if (approve) yesVotes += 1;
      voteDetails.push(`${p.name}(${approve ? '贊成' : '反對'})`);
    });

    const tParty = PARTIES.find((pt) => pt.id === target.partyId)?.name;
    if (yesVotes >= 3) {
      if (motionType === 'audit_swap' && target.hand.length > 0 && proposer.hand.length > 0) {
        const pIdx = Math.floor(Math.random() * proposer.hand.length);
        const tIdx = Math.floor(Math.random() * target.hand.length);
        const pCard = proposer.hand[pIdx];
        const tCard = target.hand[tIdx];
        const nextPlayers = players.map((pl) => {
          if (pl.id === proposer.id) {
            const h = [...pl.hand];
            h[pIdx] = tCard;
            return { ...pl, hand: h };
          }
          if (pl.id === targetId) {
            const h = [...pl.hand];
            h[tIdx] = pCard;
            return { ...pl, hand: h };
          }
          return pl;
        });
        setPlayers(nextPlayers);
        addLog(`⚖️ 多數決通過（${yesVotes}: ${4 - yesVotes}｜${voteDetails.join('、')}）！強制與【${tParty}】互換 1 張手牌！`);
      } else {
        const res = drawFromDeckSafe(deck, discard, 1);
        const nextPlayers = players.map((pl) =>
          pl.id === proposer.id ? { ...pl, hand: [...pl.hand, ...res.drawn] } : pl
        );
        setPlayers(nextPlayers);
        setDeck(res.nextDeck);
        setDiscard(res.nextDiscard);
        addLog(`⚖️ 多數決通過（${yesVotes}: ${4 - yesVotes}）！跨黨派決議補助提案政黨額外抽取 1 張牌！`);
      }
    } else {
      addLog(`⚖️ 多數決遭否決（${yesVotes}: ${4 - yesVotes}｜${voteDetails.join('、')}），臨時動議未過半數。`);
    }
  };

  // --------------------------------------------------------------------------
  // 階段六：電腦 AI 決策引擎
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (stage !== 'playing' || pendingPrompt !== null || winnerInfo !== null) return;
    const current = players.find((p) => p.id === turnPlayerId);
    if (!current || !current.isAI) return;

    aiTimerRef.current = setTimeout(() => {
      executeAIStep(current);
    }, 950);

    return () => clearTimeout(aiTimerRef.current);
  }, [stage, pendingPrompt, winnerInfo, turnPlayerId, turnMode, schemesUsed, allianceProposedThisTurn, players]);

  const executeAIStep = (ai) => {
    const validVotersInHand = ai.hand.filter((c) => isVoterValidForPlayer(c, ai));
    const currentVotes = getPlayerVoteScore(ai);
    const ally = ai.allyId !== null ? players.find((p) => p.id === ai.allyId) : null;
    const combinedVotes = currentVotes + (ally ? getPlayerVoteScore(ally) : 0);

    // 找出場上最具威脅的敵方領先者
    const enemies = players
      .filter((p) => p.id !== ai.id && p.id !== ai.allyId)
      .sort((a, b) => getPlayerVoteScore(b) - getPlayerVoteScore(a));
    const topEnemy = enemies[0];

    // 1. 若尚未選擇模式，且打出選民卡可直接獲勝，立刻全部打出！
    if (turnMode === null && !hasAmendLock(ai) && validVotersInHand.length > 0) {
      const winThreshold = ai.allyId === null ? 8 : 15;
      const projected = (ai.allyId === null ? currentVotes : combinedVotes) + validVotersInHand.length;
      if (projected >= winThreshold) {
        handlePlayAllValidVoters(ai.id);
        return;
      }
    }

    // 若已進入選民模式，打完剩餘有效選民即結束回合
    if (turnMode === 'voter') {
      if (validVotersInHand.length > 0 && !hasAmendLock(ai)) {
        handlePlayAllValidVoters(ai.id);
      } else {
        requestEndTurn();
      }
      return;
    }

    // 2. 若在聯盟中但自己單獨已滿 8 票，且手握「政黨叛變」，直接踢開盟友獨贏！
    if (schemesUsed < 2 && ai.allyId !== null && currentVotes >= 8) {
      const mutiny = ai.hand.find((c) => c.code === 'party_mutiny');
      if (mutiny) {
        initiateSchemePlay(ai.id, mutiny.uid, { mode: 'break_ally', targetId: ai.id });
        return;
      }
    }

    // 3. 檢查手牌中是否有高價值陰謀卡可施放
    if (schemesUsed < 2) {
      const schemes = ai.hand.filter((c) => c.cardType === 'scheme' && c.timing !== 'instant');

      // 優先打直接得分牌：作票、買票、政見辯論會、假民調
      const rig = schemes.find((c) => c.code === 'rig_votes');
      if (rig) {
        initiateSchemePlay(ai.id, rig.uid);
        return;
      }
      const buy = schemes.find((c) => c.code === 'buy_votes');
      if (buy) {
        initiateSchemePlay(ai.id, buy.uid);
        return;
      }
      const apache = schemes.find((c) => c.code === 'apache' || c.code === 'fake_poll');
      const hasValidInDiscard = discard.some((c) => isVoterValidForPlayer(c, ai));
      if (apache && hasValidInDiscard) {
        initiateSchemePlay(ai.id, apache.uid);
        return;
      }

      // 若敵方領先者 >= 4 票（或手牌未選選民模式且選民少於 2 張），發動攻擊陰謀！
      const shouldPlaySchemeOverVoter =
        turnMode === 'scheme' ||
        validVotersInHand.length < 2 ||
        hasAmendLock(ai) ||
        (topEnemy && getPlayerVoteScore(topEnemy) >= 5);

      if (shouldPlaySchemeOverVoter) {
        // 小票池政黨前期優先打「修改黨綱」
        const amend = schemes.find((c) => c.code === 'amend_charter');
        const partyPool = PARTIES.find((pt) => pt.id === ai.partyId)?.poolSize || 40;
        if (amend && !ai.partyUnrestricted && !hasAmendLock(ai) && partyPool <= 30 && currentVotes <= 4) {
          initiateSchemePlay(ai.id, amend.uid);
          return;
        }

        // 全場掃票
        const aoe = schemes.find((c) => c.aoeSteal > 0);
        if (aoe && enemies.some((e) => getEligibleBallotVoters(e).length > 0)) {
          initiateSchemePlay(ai.id, aoe.uid);
          return;
        }

        // 單體搶票與罷免
        const singleSteal = schemes.find((c) =>
          ['recall', 'us_beef', 'special_fund', 'ghost_island', 'im_japanese'].includes(c.code)
        );
        if (singleSteal && topEnemy && getEligibleBallotVoters(topEnemy).length > 0) {
          initiateSchemePlay(ai.id, singleSteal.uid, { targetId: topEnemy.id });
          return;
        }

        // 民生二選一卡
        const livelihood = schemes.find((c) => c.code === 'livelihood');
        if (livelihood) {
          if (hasValidInDiscard) {
            initiateSchemePlay(ai.id, livelihood.uid, { mode: 'recover' });
            return;
          } else if (topEnemy && getEligibleBallotVoters(topEnemy).length > 0) {
            initiateSchemePlay(ai.id, livelihood.uid, { mode: 'steal', targetId: topEnemy.id });
            return;
          }
        }

        // 破壞與干擾領先者
        const disrupt = schemes.find((c) =>
          ['mob_protest', 'food_safety', 'curriculum', 'occupy_yuan', 'military_scandal', 'cyber_army', 'fuel_hike', 'media_monopoly'].includes(c.code)
        );
        if (disrupt && topEnemy) {
          if (['mob_protest', 'food_safety'].includes(disrupt.code) && getEligibleBallotVoters(topEnemy).length === 0) {
            // 無票可拆則跳過
          } else {
            initiateSchemePlay(ai.id, disrupt.uid, { targetId: topEnemy.id });
            return;
          }
        }

        // 政黨叛變：阻止 6+ 票單打領先者，或強制找高票隊友合組 15 票聯盟
        const mutiny = schemes.find((c) => c.code === 'party_mutiny');
        if (mutiny && topEnemy) {
          if (topEnemy.allyId !== null && getPlayerVoteScore(topEnemy) + getPlayerVoteScore(players.find((x) => x.id === topEnemy.allyId)) >= 11) {
            initiateSchemePlay(ai.id, mutiny.uid, { mode: 'break_ally', targetId: topEnemy.id });
            return;
          }
          if (ai.allyId === null && currentVotes + getPlayerVoteScore(topEnemy) >= 11) {
            initiateSchemePlay(ai.id, mutiny.uid, { mode: 'force_ally', targetId: topEnemy.id });
            return;
          }
        }

        // 手牌卡死時打出「更換候選人」
        const replace = schemes.find((c) => c.code === 'replace_candidate');
        if (replace && validVotersInHand.length === 0 && ai.hand.length <= 5) {
          initiateSchemePlay(ai.id, replace.uid);
          return;
        }

        // 自然結盟嘗試：一回合限對一對象使用，且被拒絕後須待下回合才能再次提出
        if (ai.allyId === null && !allianceProposedThisTurn) {
          const candidates = players.filter((p) => canNaturallyAlly(ai, p));
          const bestPartner = candidates.sort((a, b) => getPlayerVoteScore(b) - getPlayerVoteScore(a))[0];
          if (bestPartner && currentVotes + getPlayerVoteScore(bestPartner) >= 7 && Math.random() < 0.45) {
            handleProposeAlliance(ai.id, bestPartner.id);
            return;
          }
        }

        // 若有盟友且手上有對自己無效但對盟友有效的選民卡，執行盟友換牌！
        if (ally && schemesUsed < 2) {
          const giftable = ai.hand.filter(
            (c) => c.cardType === 'voter' && !isVoterValidForPlayer(c, ai) && isVoterValidForPlayer(c, ally)
          );
          if (giftable.length > 0 && ally.hand.length > 0) {
            executeAllyTrade(
              ai.id,
              giftable.slice(0, 2).map((c) => c.uid)
            );
            return;
          }
        }
      }
    }

    // 4. 若尚未用過陰謀，且手上有有效選民卡，打出所有有效選民卡！
    if (turnMode === null && !hasAmendLock(ai) && validVotersInHand.length > 0) {
      handlePlayAllValidVoters(ai.id);
      return;
    }

    // 5. 無其他最佳行動，結束回合
    requestEndTurn();
  };

  // --------------------------------------------------------------------------
  // 階段七：真人玩家點擊陰謀卡的目標選擇彈窗觸發
  // --------------------------------------------------------------------------
  const handleHumanClickScheme = (card) => {
    if (!viewingPlayer || viewingPlayer.id !== turnPlayerId) return;
    if (turnMode === 'voter' || schemesUsed >= 2) return;

    // 純即時反制牌不能在平時無目標空打
    if (card.timing === 'instant') return;

    // 無需指定目標即可立即生效的陰謀卡
    const noTargetCodes = ['buy_votes', 'rig_votes', 'amend_charter', 'brawl', 'shooting', 'party_strife', 'apache', 'fake_poll', 'replace_candidate', 'lower_voting_age', 'black_box'];
    if (noTargetCodes.includes(card.code)) {
      initiateSchemePlay(viewingPlayer.id, card.uid);
      return;
    }

    // 需要選擇目標或二選一模式的陰謀卡，開啟設定彈窗
    setPendingPrompt({
      type: 'CONFIGURE_SCHEME',
      actorId: viewingPlayer.id,
      card,
      selectedMode:
        card.code === 'livelihood'
          ? 'steal'
          : card.code === 'one_china'
          ? 'steal_pro'
          : card.code === 'party_mutiny'
          ? 'force_ally'
          : 'default',
      selectedTargetId: players.find((p) => p.id !== viewingPlayer.id)?.id ?? 1,
    });
  };

  // ============================================================================
  // 4. 畫面渲染：設置畫面、選黨畫面、主戰場與各類互動 Modal
  // ============================================================================

  // 設置畫面
  if (stage === 'setup') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="max-w-4xl w-full bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-2">
                <Flame className="w-3.5 h-3.5" /> POLITIKO TAIWAN 四人執政爭奪戰
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-amber-300 via-white to-emerald-300 bg-clip-text text-transparent">
                桌遊《政治風暴》四人對戰系統
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                完整收錄 9 大政黨、80 張人口比例選民卡、68 張新聞時事陰謀卡、聯盟換票與即時反制機制
              </p>
            </div>
            <button
              onClick={() => setShowRulesModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium transition shrink-0"
            >
              <BookOpen className="w-4 h-4 text-amber-400" /> 完整規則與卡牌百科
            </button>
          </div>

          {/* 4 人座位與身價設定 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" /> 四人對戰席次與起始現金設定（逆時針輪流出牌）
              </h2>
              <button
                onClick={randomizeWalletCash}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold transition"
              >
                <Coins className="w-3.5 h-3.5" /> 掏錢包重抽現金
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {seatConfig.map((seat, idx) => {
                const isRichest = seat.cash === Math.max(...seatConfig.map((x) => x.cash));
                const seatPosLabel = ['下方主位', '右側席（逆時針 2）', '對面席（逆時針 3）', '左側席（逆時針 4）'][idx];
                return (
                  <div
                    key={seat.id}
                    className={`p-4 rounded-xl border transition ${
                      isRichest
                        ? 'bg-amber-950/20 border-amber-500/50'
                        : 'bg-slate-800/60 border-slate-700/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-400">{seatPosLabel}</span>
                      {isRichest && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
                          <Crown className="w-3 h-3" /> 現金最多・起始玩家
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={seat.name}
                        onChange={(e) =>
                          setSeatConfig((prev) =>
                            prev.map((s) => (s.id === seat.id ? { ...s, name: e.target.value } : s))
                          )
                        }
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-semibold text-white focus:outline-none focus:border-sky-500"
                      />
                      <button
                        onClick={() =>
                          setSeatConfig((prev) =>
                            prev.map((s) => (s.id === seat.id ? { ...s, isAI: !s.isAI } : s))
                          )
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                          seat.isAI
                            ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                            : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        }`}
                      >
                        {seat.isAI ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                        {seat.isAI ? '電腦 AI' : '真人玩家'}
                      </button>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
                      <span>隨身現金：</span>
                      <span className="font-mono font-bold text-amber-300">
                        NT$ {seat.cash.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 政黨隨機選擇開關 */}
          <div
            onClick={() => setRandomPartyDraft((prev) => !prev)}
            className={`p-4 rounded-xl border cursor-pointer select-none transition flex items-center justify-between gap-4 ${
              randomPartyDraft
                ? 'bg-sky-950/30 border-sky-500/60 shadow-md shadow-sky-950/40'
                : 'bg-slate-800/60 border-slate-700/70 hover:border-slate-600'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3">
              <div
                className={`p-2.5 rounded-xl border shrink-0 transition ${
                  randomPartyDraft
                    ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                <Shuffle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm sm:text-base font-extrabold text-white">
                    政黨隨機選擇模式
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      randomPartyDraft
                        ? 'bg-sky-500/25 text-sky-300 border border-sky-400/40'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {randomPartyDraft ? '已開啟：盲抽分配' : '已關閉：輪流挑選'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {randomPartyDraft
                    ? '開局時將由系統從 9 大政黨中隨機盲抽 4 個政黨分配給所有玩家，並直接發牌開戰！'
                    : '開局後將由現金最多的起始玩家開始，依逆時針順序輪流挑選心儀的政黨。'}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={randomPartyDraft}
              onClick={(e) => {
                e.stopPropagation();
                setRandomPartyDraft((prev) => !prev);
              }}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-200 focus:outline-none ${
                randomPartyDraft
                  ? 'bg-sky-500 border-sky-400'
                  : 'bg-slate-700 border-slate-600'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                  randomPartyDraft ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* 勝利條件速覽 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
              <div className="font-bold text-emerald-400 mb-1">🏆 單獨執政（8 票）</div>
              <p className="text-slate-400">未結盟狀態下，率先於自家選票區集滿 8 張有效選票立即獲勝。</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
              <div className="font-bold text-amber-400 mb-1">🤝 聯合執政（15 票）</div>
              <p className="text-slate-400">兩個結盟政黨選票區合計集滿 15 張有效選票，雙方共同獲勝。</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
              <div className="font-bold text-rose-400 mb-1">⚡ 行動二選一</div>
              <p className="text-slate-400">每回合抽 2 張牌後，只能選擇「打出不限張數有效選民」或「最多 2 次陰謀／結盟行動」。</p>
            </div>
          </div>

          <button
            onClick={startPartyDraft}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-extrabold text-lg shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 transition"
          >
            {randomPartyDraft ? (
              <>
                <Shuffle className="w-5 h-5" /> 隨機分配政黨並直接開戰
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" /> 進入政黨挑選階段
              </>
            )}
          </button>
        </div>

        {showRulesModal && <RulesModal onClose={() => setShowRulesModal(false)} />}
      </div>
    );
  }

  // 挑選政黨畫面
  if (stage === 'draft') {
    const currentDrafter = players.find((p) => p.id === draftTurnId);

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 flex flex-col items-center">
        <div className="max-w-6xl w-full space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-amber-400 font-bold mb-1">STEP 2・逆時針挑選政黨卡（共 9 黨選 4 黨）</div>
              <h2 className="text-2xl font-extrabold">
                目前輪到：<span className="text-sky-400">{currentDrafter?.name}</span>{' '}
                {currentDrafter?.isAI ? '（電腦思考中...）' : '請挑選你要領導的政黨'}
              </h2>
              {!currentDrafter?.isAI && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <button
                    onClick={handleRandomPickForCurrent}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-200 text-xs font-bold transition"
                  >
                    <Shuffle className="w-3.5 h-3.5" /> 隨機幫我選一黨
                  </button>
                  <button
                    onClick={handleRandomAssignRemaining}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-bold transition"
                  >
                    <Zap className="w-3.5 h-3.5" /> 剩餘席次全數隨機並開戰
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {players.map((p) => {
                const chosenPt = PARTIES.find((pt) => pt.id === p.partyId);
                return (
                  <div
                    key={p.id}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                      p.id === draftTurnId
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200 animate-pulse'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    {p.name}：{chosenPt ? chosenPt.name : '待挑選'}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PARTIES.map((pt) => {
              const owner = players.find((p) => p.partyId === pt.id);
              const disabled = Boolean(owner) || currentDrafter?.isAI;
              const blockedNames = pt.blockedIds
                .map((bid) => PARTIES.find((x) => x.id === bid)?.name)
                .join('、');

              return (
                <button
                  key={pt.id}
                  disabled={disabled}
                  onClick={() => handlePickParty(currentDrafter.id, pt.id)}
                  className={`text-left p-4 rounded-2xl border transition flex flex-col justify-between ${
                    owner
                      ? 'bg-slate-900/40 border-slate-800 opacity-50 cursor-not-allowed'
                      : 'bg-slate-900 hover:bg-slate-800/90 border-slate-700 hover:border-sky-400 shadow-lg'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${pt.badgeColor}`}>
                        {pt.camp}
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-300">
                        有效票池 {pt.poolSize} / 80 張
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-white mb-1">{pt.name}</h3>
                    <p className="text-xs text-emerald-300 font-medium mb-3">
                      ✓ 有效選民：{pt.ruleDesc}
                    </p>
                  </div>
                  <div className="pt-2.5 border-t border-slate-800 text-[11px] text-slate-400">
                    {owner ? (
                      <span className="text-amber-400 font-bold">已被 {owner.name} 選用</span>
                    ) : (
                      <span>✕ 無法自然結盟：{blockedNames}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 主對戰畫面與結算畫面
  const activePlayer = players.find((p) => p.id === turnPlayerId);
  const activeParty = PARTIES.find((pt) => pt.id === activePlayer?.partyId);
  const viewingParty = PARTIES.find((pt) => pt.id === viewingPlayer?.partyId);
  const viewingAlly =
    viewingPlayer && viewingPlayer.allyId !== null
      ? players.find((p) => p.id === viewingPlayer.allyId)
      : null;
  const viewingAllyParty = viewingAlly ? PARTIES.find((pt) => pt.id === viewingAlly.partyId) : null;
  const isMyTurn = Boolean(
    viewingPlayer && viewingPlayer.id === turnPlayerId && !viewingPlayer.isAI && !pendingPrompt
  );

  // 以 viewingPlayer 為視角排列相對座位：下(自己)、右(逆時針下一家)、上(對家)、左(上家)
  const baseId = viewingPlayer ? viewingPlayer.id : 0;
  const rightOpponent = players.find((p) => p.id === (baseId + 1) % 4);
  const topOpponent = players.find((p) => p.id === (baseId + 2) % 4);
  const leftOpponent = players.find((p) => p.id === (baseId + 3) % 4);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* 頂部導覽資訊列 */}
      <header className="bg-slate-900/95 border-b border-slate-800 px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-base sm:text-lg bg-gradient-to-r from-amber-300 to-emerald-300 bg-clip-text text-transparent">
            政治風暴
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300">
            第 {turnNumber} 輪・逆時針 ↺
          </span>
          {activeParty && (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${activeParty.badgeColor}`}>
              當前行動：{activeParty.name}（{activePlayer?.name}）
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 font-semibold">
            抽牌堆：<span className="text-sky-400 font-mono">{deck.length}</span>
          </div>
          <button
            onClick={() => setShowDiscardModal(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 font-semibold flex items-center gap-1 transition"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" /> 公開棄牌堆：
            <span className="text-amber-400 font-mono">{discard.length}</span>
          </button>
          <button
            onClick={() => setShowRulesModal(true)}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">規則百科</span>
          </button>
          <button
            onClick={() => setStage('setup')}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/60 text-rose-200 flex items-center gap-1 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">重開新局</span>
          </button>
        </div>
      </header>

      {/* 即時新聞跑馬燈 */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 flex items-center gap-2 text-xs sm:text-sm text-amber-200">
        <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="font-medium truncate">{headline}</span>
      </div>

      {/* 中央四人桌面佈局 */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 flex flex-col gap-3">
        {/* 上方對手（逆時針第 3 席） */}
        {topOpponent && (
          <div className="flex justify-center">
            <div className="w-full max-w-xl">
              <OpponentSeatCard
                player={topOpponent}
                allPlayers={players}
                isTurn={topOpponent.id === turnPlayerId}
                seatLabel="對面席（逆時針 ↑）"
              />
            </div>
          </div>
        )}

        {/* 左席、中央戰況紀錄、右席 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
          <div className="lg:col-span-3">
            {leftOpponent && (
              <OpponentSeatCard
                player={leftOpponent}
                allPlayers={players}
                isTurn={leftOpponent.id === turnPlayerId}
                seatLabel="左側席（逆時針 ←）"
              />
            )}
          </div>

          {/* 中央議場戰報與聯盟狀態 */}
          <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between min-h-[190px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> 立院即時戰況紀錄
              </span>
              <span className="text-[11px] text-slate-400">
                單獨 8 票獲勝 ｜ 聯盟合計 15 票獲勝
              </span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
              {logs.map((item, idx) => (
                <div
                  key={item.id}
                  className={`px-2.5 py-1 rounded-lg ${
                    idx === 0 ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400'
                  }`}
                >
                  {item.text}
                </div>
              ))}
            </div>

            {/* 場上結盟狀態快覽與多數決特殊規則 */}
            <div className="pt-2 mt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                {players.some((p) => p.allyId !== null) ? (
                  players
                    .filter((p) => p.allyId !== null && p.id < p.allyId)
                    .map((p) => {
                      const ally = players.find((x) => x.id === p.allyId);
                      const pt1 = PARTIES.find((x) => x.id === p.partyId);
                      const pt2 = PARTIES.find((x) => x.id === ally?.partyId);
                      const sum = getPlayerVoteScore(p) + (ally ? getPlayerVoteScore(ally) : 0);
                      return (
                        <span
                          key={`${p.id}-${p.allyId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold"
                        >
                          <Handshake className="w-3.5 h-3.5" />
                          {pt1?.name} ＋ {pt2?.name}（{sum}/15 票）
                        </span>
                      );
                    })
                ) : (
                  <span className="text-slate-500">目前場上尚無政黨聯盟</span>
                )}
              </div>

              {viewingPlayer && (
                <button
                  disabled={!isMyTurn || motionUsedThisTurn}
                  onClick={() =>
                    setPendingPrompt({
                      type: 'MAJORITY_MOTION',
                      proposerId: viewingPlayer.id,
                      targetId: players.find((p) => p.id !== viewingPlayer.id)?.id ?? 1,
                    })
                  }
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 disabled:opacity-40 border border-indigo-400/40 text-indigo-200 font-bold transition"
                >
                  ⚖️ 立院多數決動議
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            {rightOpponent && (
              <OpponentSeatCard
                player={rightOpponent}
                allPlayers={players}
                isTurn={rightOpponent.id === turnPlayerId}
                seatLabel="右側席（逆時針 ↓）"
              />
            )}
          </div>
        </div>

        {/* 下方主視角玩家操控面板 */}
        {viewingPlayer && (
          <section
            className={`bg-slate-900/95 border-2 rounded-2xl p-3.5 sm:p-4 space-y-3.5 shadow-xl transition ${
              isMyTurn
                ? 'border-emerald-500/70 shadow-emerald-950/30'
                : viewingParty?.panelBorder || 'border-slate-800'
            }`}
          >
            {/* 玩家政黨資訊與本回合狀態列 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                {viewingParty && (
                  <span className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-extrabold border ${viewingParty.badgeColor}`}>
                    {viewingParty.name}
                  </span>
                )}
                <span className="font-extrabold text-base text-white">{viewingPlayer.name}</span>
                <span className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                  {viewingPlayer.partyUnrestricted ? (
                    <span className="inline-flex items-center gap-1">
                      <Unlock className="w-3 h-3" /> 已修改黨綱：全選民通吃
                    </span>
                  ) : (
                    `有效選民：${viewingParty?.ruleDesc || ''}`
                  )}
                </span>
                {viewingAllyParty && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
                    <Handshake className="w-3.5 h-3.5" /> 盟友：{viewingAllyParty.name}（合計{' '}
                    {getPlayerVoteScore(viewingPlayer) + getPlayerVoteScore(viewingAlly)} / 15 票）
                  </span>
                )}
                {viewingPlayer.activeEffects.map((ef, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-200 text-xs font-bold"
                  >
                    ⏳ {ef.cardObj.name}（剩 {ef.turnsLeft} 回合）
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200">
                  {!isMyTurn
                    ? '等待其他政黨行動...'
                    : turnMode === null
                    ? '行動二選一：可打選民卡 或 施展陰謀(0/2)'
                    : turnMode === 'voter'
                    ? '🗳️ 本回合已選：打出選民卡（張數不限）'
                    : `⚡ 本回合已選：陰謀行動（已用 ${schemesUsed} / 2 次）`}
                </span>
                <span className="px-3.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-mono text-sm font-extrabold">
                  選票區：{getPlayerVoteScore(viewingPlayer)} / {viewingPlayer.allyId === null ? 8 : 15} 票
                </span>
              </div>
            </div>

            {/* 自家公開選票區 */}
            <div className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-2.5">
              <div className="text-[11px] font-bold text-slate-400 mb-1.5">
                🗳️ 本黨公開選票區（共 {getPlayerVoteScore(viewingPlayer)} 張有效選票）：
              </div>
              {viewingPlayer.ballotBox.length === 0 ? (
                <div className="text-xs text-slate-500 py-1">目前選票區尚無選民卡，快爭取選民支持或施展買票／作票！</div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {viewingPlayer.ballotBox.map((c) =>
                    c.cardType === 'scheme' ? (
                      <span
                        key={c.uid}
                        className="px-2.5 py-1 rounded-lg bg-purple-900/60 border border-purple-400/50 text-xs font-extrabold text-purple-200"
                      >
                        📦 作票（+2 有效票）
                      </span>
                    ) : (
                      <span
                        key={c.uid}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${STANCE_LABELS[c.stance].pill}`}
                      >
                        {c.name}・{STANCE_LABELS[c.stance].text}
                        {c.boughtVote ? '（買票）' : ''}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>

            {/* 行動控制按鈕列 */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  disabled={
                    !isMyTurn ||
                    turnMode === 'scheme' ||
                    hasAmendLock(viewingPlayer) ||
                    !viewingPlayer.hand.some((c) => isVoterValidForPlayer(c, viewingPlayer))
                  }
                  onClick={() => handlePlayAllValidVoters(viewingPlayer.id)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition"
                >
                  <Check className="w-4 h-4" /> 一鍵打出所有有效選民
                </button>

                {/* 協商結盟（每回合限對一對象使用，被拒絕後下回合才能再次提出邀請） */}
                {viewingPlayer.allyId === null && (
                  <button
                    disabled={
                      !isMyTurn ||
                      turnMode === 'voter' ||
                      schemesUsed >= 2 ||
                      allianceProposedThisTurn ||
                      !players.some((p) => canNaturallyAlly(viewingPlayer, p))
                    }
                    onClick={() =>
                      setPendingPrompt({
                        type: 'CHOOSE_ALLY_PARTNER',
                        proposerId: viewingPlayer.id,
                      })
                    }
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition"
                  >
                    <Handshake className="w-4 h-4" />{' '}
                    {allianceProposedThisTurn ? '協商結盟（下回合可再邀）' : '協商結盟（耗 1 陰謀）'}
                  </button>
                )}

                {/* 盟友換牌 & 棄票拆夥 */}
                {viewingPlayer.allyId !== null && (
                  <>
                    <button
                      disabled={!isMyTurn || turnMode === 'voter' || schemesUsed >= 2 || viewingPlayer.hand.length === 0}
                      onClick={() =>
                        setPendingPrompt({
                          type: 'ALLY_TRADE_MODAL',
                          actorId: viewingPlayer.id,
                          selectedUids: [],
                        })
                      }
                      className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition"
                    >
                      <Shuffle className="w-4 h-4" /> 盟友換牌（耗 1 陰謀）
                    </button>
                    <button
                      disabled={
                        !isMyTurn ||
                        turnMode === 'voter' ||
                        schemesUsed >= 2 ||
                        getEligibleBallotVoters(viewingPlayer).length < 2
                      }
                      onClick={() => handleBreakAllianceByVotes(viewingPlayer.id)}
                      className="px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition"
                    >
                      <Ban className="w-4 h-4" /> 棄 2 票解除聯盟
                    </button>
                  </>
                )}
              </div>

              <button
                disabled={!isMyTurn}
                onClick={() => requestEndTurn()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition"
              >
                結束回合 <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* 手牌區 */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-bold text-slate-200">
                  🃏 手牌區（{viewingPlayer.hand.length} 張，回合結束上限 7 張）
                </span>
                <span>點擊有效選民卡直接入匭，或點擊陰謀卡發動政治攻勢</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                {viewingPlayer.hand.map((card) => {
                  if (card.cardType === 'voter') {
                    const valid = isVoterValidForPlayer(card, viewingPlayer);
                    const canClick = isMyTurn && valid && turnMode !== 'scheme' && !hasAmendLock(viewingPlayer);
                    const st = STANCE_LABELS[card.stance];

                    return (
                      <button
                        key={card.uid}
                        disabled={!canClick}
                        onClick={() => handlePlayVoterCard(viewingPlayer.id, card.uid)}
                        className={`text-left rounded-xl border p-2.5 flex flex-col justify-between transition min-h-[138px] ${
                          valid
                            ? canClick
                              ? 'bg-slate-800/95 border-emerald-500/70 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-950/60 cursor-pointer'
                              : 'bg-slate-800/70 border-emerald-500/40 opacity-80'
                            : 'bg-slate-900/60 border-slate-800 opacity-55 cursor-not-allowed'
                        }`}
                      >
                        <div>
                          <div className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-gradient-to-r ${st.color} text-white inline-block mb-1.5`}>
                            選民・{st.text}
                          </div>
                          <div className="font-extrabold text-sm text-white leading-snug">{card.name}</div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            {REGION_LABELS[card.region]} ／ {ETHNIC_LABELS[card.ethnic]}
                          </div>
                        </div>
                        <div className="pt-2 mt-2 border-t border-slate-700/60 text-[11px] font-bold">
                          {valid ? (
                            <span className="text-emerald-400">✓ 有效選民</span>
                          ) : (
                            <span className="text-slate-500">✕ 不符本黨結構</span>
                          )}
                        </div>
                      </button>
                    );
                  }

                  // 陰謀卡渲染
                  const isPureInstant = card.timing === 'instant';
                  const canPlayNow = isMyTurn && !isPureInstant && turnMode !== 'voter' && schemesUsed < 2;

                  return (
                    <button
                      key={card.uid}
                      disabled={!canPlayNow}
                      onClick={() => handleHumanClickScheme(card)}
                      className={`text-left rounded-xl border p-2.5 flex flex-col justify-between transition min-h-[138px] ${
                        canPlayNow
                          ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-rose-500/60 hover:-translate-y-1 hover:border-rose-400 hover:shadow-lg hover:shadow-rose-950/50 cursor-pointer'
                          : isPureInstant
                          ? 'bg-slate-900/90 border-sky-500/50 opacity-90 cursor-default'
                          : 'bg-slate-900/70 border-slate-800 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                              card.timing.includes('instant')
                                ? 'bg-sky-500/20 text-sky-300'
                                : card.timing === 'continuous'
                                ? 'bg-purple-500/25 text-purple-300'
                                : 'bg-rose-500/25 text-rose-300'
                            }`}
                          >
                            {card.timing === 'instant'
                              ? '⚡即時反制'
                              : card.timing === 'instant_or_once'
                              ? '⚡反制/主動'
                              : card.timing === 'continuous'
                              ? '⏳連續效能'
                              : '🔥陰謀'}
                          </span>
                          <span className="text-[10px] text-slate-400">{card.category}</span>
                        </div>
                        <div className="font-extrabold text-sm text-amber-200 leading-snug mb-1">
                          {card.name}
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-4">
                          {card.desc}
                        </p>
                      </div>
                      <div className="pt-1.5 mt-1.5 border-t border-slate-800 text-[10px] font-semibold text-slate-400">
                        {isPureInstant ? '對手施展陰謀時自動詢問' : canPlayNow ? '點擊發動（耗 1 陰謀）' : '等待陰謀階段'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ==================================================================== */}
      {/* 互動式彈窗群（完全不使用 alert / confirm）                            */}
      {/* ==================================================================== */}

      {/* 多人同機熱座隱私遮罩 */}
      {privacyShieldForId !== null && humanCount > 1 && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 text-center space-y-4">
            <Lock className="w-10 h-10 text-amber-400 mx-auto" />
            <h3 className="text-xl font-extrabold">請將裝置交給下一位玩家</h3>
            <p className="text-slate-300 text-sm">
              即將進入【
              {PARTIES.find((pt) => pt.id === players.find((p) => p.id === privacyShieldForId)?.partyId)?.name}
              】（{players.find((p) => p.id === privacyShieldForId)?.name}）的回合，手牌已隱藏保護。
            </p>
            <button
              onClick={() => setPrivacyShieldForId(null)}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-extrabold text-white transition"
            >
              確認身分，展開手牌
            </button>
          </div>
        </div>
      )}

      {/* 1. 陰謀目標與模式設定視窗 */}
      {pendingPrompt?.type === 'CONFIGURE_SCHEME' && (
        <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-amber-300">
                發動陰謀：《{pendingPrompt.card.name}》
              </h3>
              <button
                onClick={() => setPendingPrompt(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-300 bg-slate-800/80 p-3 rounded-xl">{pendingPrompt.card.desc}</p>

            {/* 二選一模式切換 */}
            {pendingPrompt.card.code === 'livelihood' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPendingPrompt({ ...pendingPrompt, selectedMode: 'steal' })}
                  className={`p-3 rounded-xl border text-xs font-bold ${
                    pendingPrompt.selectedMode === 'steal'
                      ? 'bg-rose-600/25 border-rose-400 text-rose-200'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  選項 A：搶奪任一政黨 1 張選票
                </button>
                <button
                  onClick={() => setPendingPrompt({ ...pendingPrompt, selectedMode: 'recover' })}
                  className={`p-3 rounded-xl border text-xs font-bold ${
                    pendingPrompt.selectedMode === 'recover'
                      ? 'bg-emerald-600/25 border-emerald-400 text-emerald-200'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  選項 B：從棄牌堆挑 1 張有效選票
                </button>
              </div>
            )}

            {pendingPrompt.card.code === 'one_china' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPendingPrompt({ ...pendingPrompt, selectedMode: 'steal_pro' })}
                  className={`p-3 rounded-xl border text-xs font-bold ${
                    pendingPrompt.selectedMode === 'steal_pro'
                      ? 'bg-rose-600/25 border-rose-400 text-rose-200'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  全場各交給自家 3 張「親中」選票
                </button>
                <button
                  onClick={() => setPendingPrompt({ ...pendingPrompt, selectedMode: 'purge_anti' })}
                  className={`p-3 rounded-xl border text-xs font-bold ${
                    pendingPrompt.selectedMode === 'purge_anti'
                      ? 'bg-amber-600/25 border-amber-400 text-amber-200'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  棄置自家或聯盟所有「反中」選票
                </button>
              </div>
            )}

            {pendingPrompt.card.code === 'party_mutiny' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPendingPrompt({ ...pendingPrompt, selectedMode: 'force_ally' })}
                  className={`p-3 rounded-xl border text-xs font-bold ${
                    pendingPrompt.selectedMode === 'force_ally'
                      ? 'bg-amber-600/25 border-amber-400 text-amber-200'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  強制與指定政黨組成聯盟（無視限制）
                </button>
                <button
                  onClick={() =>
                    setPendingPrompt({
                      ...pendingPrompt,
                      selectedMode: 'break_ally',
                      selectedTargetId:
                        players.find((p) => p.allyId !== null)?.id ?? pendingPrompt.actorId,
                    })
                  }
                  className={`p-3 rounded-xl border text-xs font-bold ${
                    pendingPrompt.selectedMode === 'break_ally'
                      ? 'bg-rose-600/25 border-rose-400 text-rose-200'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  強制解除指定政黨的聯盟
                </button>
              </div>
            )}

            {/* 選擇目標政黨 */}
            {!(pendingPrompt.card.code === 'livelihood' && pendingPrompt.selectedMode === 'recover') &&
              pendingPrompt.card.code !== 'one_china' && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-400">請選擇目標政黨：</div>
                  <div className="space-y-2">
                    {players
                      .filter((p) =>
                        pendingPrompt.card.code === 'party_mutiny' &&
                        pendingPrompt.selectedMode === 'break_ally'
                          ? p.allyId !== null
                          : p.id !== pendingPrompt.actorId
                      )
                      .map((p) => {
                        const pt = PARTIES.find((x) => x.id === p.partyId);
                        return (
                          <button
                            key={p.id}
                            onClick={() => setPendingPrompt({ ...pendingPrompt, selectedTargetId: p.id })}
                            className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition ${
                              pendingPrompt.selectedTargetId === p.id
                                ? 'bg-sky-600/20 border-sky-400 text-white'
                                : 'bg-slate-800/70 border-slate-700 text-slate-300'
                            }`}
                          >
                            <div>
                              <span className="font-bold">{pt?.name}</span>（{p.name}）
                            </div>
                            <div className="text-xs text-slate-400">
                              選票 {getPlayerVoteScore(p)} 張 ｜ 手牌 {p.hand.length} 張
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPendingPrompt(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
              >
                取消
              </button>
              <button
                onClick={() => {
                  const { actorId, card, selectedMode, selectedTargetId } = pendingPrompt;
                  setPendingPrompt(null);
                  initiateSchemePlay(actorId, card.uid, {
                    mode: selectedMode,
                    targetId: selectedTargetId,
                  });
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-extrabold text-white"
              >
                確認施展陰謀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 即時反制詢問視窗 */}
      {pendingPrompt?.type === 'COUNTER_PROMPT' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border-2 border-sky-500 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-extrabold">
              <Shield className="w-4 h-4" /> 即時反制時機！
            </div>
            <h3 className="text-lg font-extrabold text-white">
              【{PARTIES.find((pt) => pt.id === players.find((p) => p.id === pendingPrompt.actorId)?.partyId)?.name}】
              正在施展《{pendingPrompt.payload.card.name}》！
            </h3>
            <p className="text-xs text-slate-300 bg-slate-800 p-3 rounded-xl">
              效果：{pendingPrompt.payload.card.desc}
            </p>
            <div className="space-y-2">
              <div className="text-xs font-bold text-sky-300">你手上有反制牌，是否立即打出抵銷？</div>
              {pendingPrompt.counterCards.map((cc) => (
                <button
                  key={cc.uid}
                  onClick={() => handleHumanCounterDecision(cc.uid)}
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-sm flex items-center justify-between transition"
                >
                  <span>⚡ 打出《{cc.name}》取消該陰謀</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ))}
              <button
                onClick={() => handleHumanCounterDecision(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                保留實力，不發動反制
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. 被攻擊玩家自行挑選要交出／棄置的選民卡視窗 */}
      {pendingPrompt?.type === 'VICTIM_SELECT' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-slate-900 border-2 border-rose-500/70 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-extrabold text-rose-300">
              ⚠️ 選票遭襲！請挑選 {pendingPrompt.needCount} 張選民卡
              {pendingPrompt.destination === 'discard' ? '丟入棄牌堆' : '交給對手'}
            </h3>
            <p className="text-xs text-slate-400">
              戰術提示：若交出「對手政黨無法吸收（標示對手無效）」的選民卡，對手搶走後將強制丟入棄牌堆而無法得分！
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
              {pendingPrompt.eligibleCards.map((c) => {
                const selected = pendingPrompt.selectedUids.includes(c.uid);
                const attacker = players.find((p) => p.id === pendingPrompt.attackerId);
                const validForAttacker = isVoterValidForPlayer({ ...c, boughtVote: false }, attacker);

                return (
                  <button
                    key={c.uid}
                    onClick={() => {
                      const exists = pendingPrompt.selectedUids.includes(c.uid);
                      let nextSel = exists
                        ? pendingPrompt.selectedUids.filter((id) => id !== c.uid)
                        : [...pendingPrompt.selectedUids, c.uid];
                      if (nextSel.length > pendingPrompt.needCount) {
                        nextSel = nextSel.slice(1);
                      }
                      setPendingPrompt({ ...pendingPrompt, selectedUids: nextSel });
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition ${
                      selected
                        ? 'bg-rose-600/30 border-rose-400 text-white ring-2 ring-rose-400'
                        : 'bg-slate-800 border-slate-700 text-slate-200'
                    }`}
                  >
                    <div className="font-bold">{c.name}</div>
                    <div className="text-[11px] text-slate-400">{STANCE_LABELS[c.stance].text}</div>
                    {pendingPrompt.destination === 'steal' && (
                      <div className={`mt-1 text-[10px] font-bold ${validForAttacker ? 'text-rose-300' : 'text-emerald-400'}`}>
                        {validForAttacker ? '⚠️ 對手可計分' : '✓ 對手無效將作廢'}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <button
              disabled={pendingPrompt.selectedUids.length !== pendingPrompt.needCount}
              onClick={() => {
                const { victimId, attackerId, eligibleCards, selectedUids, destination, remainingQueue } =
                  pendingPrompt;
                const workingPlayers = players.map((p) => ({ ...p, ballotBox: [...p.ballotBox] }));
                const workingDiscard = [...discard];
                const victim = workingPlayers.find((p) => p.id === victimId);
                const attacker = workingPlayers.find((p) => p.id === attackerId);
                const chosen = eligibleCards.filter((c) => selectedUids.includes(c.uid));
                transferVictimVoters(victim, attacker, chosen, destination, workingDiscard);
                setPendingPrompt(null);
                processVictimQueue(remainingQueue, workingPlayers, deck, workingDiscard);
              }}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-extrabold text-sm transition"
            >
              確認交出（已選 {pendingPrompt.selectedUids.length} / {pendingPrompt.needCount}）
            </button>
          </div>
        </div>
      )}

      {/* 4. 從棄牌堆挑選選民卡視窗（政見辯論會／22K／降低投票年齡） */}
      {pendingPrompt?.type === 'PICK_DISCARD_VOTERS' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-slate-900 border border-emerald-500/60 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-extrabold text-emerald-300">{pendingPrompt.title}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto p-1">
              {discard
                .filter((c) =>
                  pendingPrompt.mode === 'to_ballot'
                    ? isVoterValidForPlayer(c, players.find((p) => p.id === pendingPrompt.responderId))
                    : c.cardType === 'voter'
                )
                .map((c) => {
                  const selected = pendingPrompt.selectedUids.includes(c.uid);
                  return (
                    <button
                      key={c.uid}
                      onClick={() => {
                        const exists = pendingPrompt.selectedUids.includes(c.uid);
                        let nextSel = exists
                          ? pendingPrompt.selectedUids.filter((id) => id !== c.uid)
                          : [...pendingPrompt.selectedUids, c.uid];
                        if (nextSel.length > pendingPrompt.maxCount) nextSel = nextSel.slice(1);
                        setPendingPrompt({ ...pendingPrompt, selectedUids: nextSel });
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs transition ${
                        selected
                          ? 'bg-emerald-600/30 border-emerald-400 text-white ring-2 ring-emerald-400'
                          : 'bg-slate-800 border-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="font-bold">{c.name}</div>
                      <div className="text-[11px] text-amber-300">{STANCE_LABELS[c.stance].text}</div>
                    </button>
                  );
                })}
            </div>
            <button
              disabled={pendingPrompt.selectedUids.length === 0}
              onClick={() => {
                const { responderId, selectedUids, mode } = pendingPrompt;
                const selSet = new Set(selectedUids);
                const chosen = discard.filter((c) => selSet.has(c.uid));
                const nextDiscard = discard.filter((c) => !selSet.has(c.uid));
                setPendingPrompt(null);

                if (mode === 'to_ballot') {
                  const nextPlayers = players.map((p) =>
                    p.id === responderId ? { ...p, ballotBox: [...p.ballotBox, ...chosen] } : p
                  );
                  addLog(`♻️ 成功從棄牌堆吸收 ${chosen.length} 張有效選民卡放入選票區！`);
                  commitStateAndCheckWin(nextPlayers, deck, nextDiscard);
                } else {
                  const nextDeck = shuffleArray([...deck, ...chosen]);
                  addLog(`🎓 成功將 ${chosen.length} 張選民卡洗回抽牌堆！`);
                  commitStateAndCheckWin(players, nextDeck, nextDiscard);
                }
              }}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-extrabold text-sm transition"
            >
              確認挑選（已選 {pendingPrompt.selectedUids.length} / 最多 {pendingPrompt.maxCount} 張）
            </button>
          </div>
        </div>
      )}

      {/* 5. 黑箱作業：重排牌堆頂 8 張 */}
      {pendingPrompt?.type === 'BLACK_BOX_SORT' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-slate-900 border border-purple-500/60 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-extrabold text-purple-300">
              🕶️ 《黑箱作業》：調整抽牌堆最上方卡牌順序
            </h3>
            <p className="text-xs text-slate-400">排在第 1 張的牌將會最先被抽出（可上下微調順序）：</p>
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {pendingPrompt.cardsOrder.map((c, idx) => (
                <div
                  key={c.uid}
                  className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-white">{c.name}</span>
                    <span className="text-slate-400">
                      {c.cardType === 'voter' ? `選民・${STANCE_LABELS[c.stance].text}` : `陰謀・${c.category}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={idx === 0}
                      onClick={() => {
                        const arr = [...pendingPrompt.cardsOrder];
                        [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                        setPendingPrompt({ ...pendingPrompt, cardsOrder: arr });
                      }}
                      className="p-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      disabled={idx === pendingPrompt.cardsOrder.length - 1}
                      onClick={() => {
                        const arr = [...pendingPrompt.cardsOrder];
                        [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
                        setPendingPrompt({ ...pendingPrompt, cardsOrder: arr });
                      }}
                      className="p-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                const { cardsOrder } = pendingPrompt;
                const nextDeck = [...cardsOrder, ...deck.slice(cardsOrder.length)];
                setPendingPrompt(null);
                addLog(`🕶️ 《黑箱作業》完成！牌堆頂端順序已重新安排！`);
                commitStateAndCheckWin(players, nextDeck, discard);
              }}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-sm"
            >
              完成黑箱控頂
            </button>
          </div>
        </div>
      )}

      {/* 6. 選擇結盟對象與結盟邀請視窗 */}
      {pendingPrompt?.type === 'CHOOSE_ALLY_PARTNER' && (
        <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-amber-500/60 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-extrabold text-amber-300">🤝 協商結盟（一回合限對一對象使用）</h3>
            <p className="text-xs text-slate-400">
              僅列出雙方政黨卡未禁止結盟且目前單身的政黨。每回合只能對單一政黨提出邀請；結盟成功將消耗 1 次陰謀，若遭拒絕須待下回合才能再次提出邀請！
            </p>
            <div className="space-y-2">
              {players
                .filter((p) => canNaturallyAlly(players.find((x) => x.id === pendingPrompt.proposerId), p))
                .map((p) => {
                  const pt = PARTIES.find((x) => x.id === p.partyId);
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        const propId = pendingPrompt.proposerId;
                        setPendingPrompt(null);
                        handleProposeAlliance(propId, p.id);
                      }}
                      className="w-full p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-between text-left transition"
                    >
                      <div>
                        <div className="font-bold text-white">{pt?.name}（{p.name}）</div>
                        <div className="text-xs text-slate-400">{pt?.ruleDesc}</div>
                      </div>
                      <span className="text-xs font-bold text-amber-300">目前 {getPlayerVoteScore(p)} 票</span>
                    </button>
                  );
                })}
            </div>
            <button
              onClick={() => setPendingPrompt(null)}
              className="w-full py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-400"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {pendingPrompt?.type === 'ALLIANCE_INVITE' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border-2 border-amber-500 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-extrabold text-amber-300">🤝 收到政黨結盟邀請！</h3>
            <p className="text-sm text-slate-200">
              【{PARTIES.find((pt) => pt.id === players.find((p) => p.id === pendingPrompt.proposerId)?.partyId)?.name}】
              向你的政黨提出結盟協議，是否同意組成聯合陣線（共同衝刺 15 票）？
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const { proposerId, responderId } = pendingPrompt;
                  setPendingPrompt(null);
                  const nextPlayers = players.map((p) => {
                    if (p.id === proposerId) return { ...p, allyId: responderId };
                    if (p.id === responderId) return { ...p, allyId: proposerId };
                    return p;
                  });
                  setTurnMode('scheme');
                  setSchemesUsed((s) => s + 1);
                  addLog(`🤝 政黨結盟成立！雙方正式展開聯合競選！`);
                  commitStateAndCheckWin(nextPlayers, deck, discard);
                }}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-sm"
              >
                同意結盟
              </button>
              <button
                onClick={() => {
                  const propParty = PARTIES.find(
                    (pt) => pt.id === players.find((p) => p.id === pendingPrompt.proposerId)?.partyId
                  )?.name;
                  const respParty = PARTIES.find(
                    (pt) => pt.id === players.find((p) => p.id === pendingPrompt.responderId)?.partyId
                  )?.name;
                  setPendingPrompt(null);
                  addLog(`🙅 【${respParty}】拒絕了【${propParty}】的協商結盟邀請（須待下回合才能再次提出邀請）。`);
                }}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-slate-300 text-sm"
              >
                拒絕邀請
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. 盟友換牌視窗 */}
      {pendingPrompt?.type === 'ALLY_TRADE_MODAL' && (
        <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-slate-900 border border-sky-500/60 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-extrabold text-sky-300">🔄 盟友密室換牌（消耗 1 次陰謀）</h3>
            <p className="text-xs text-slate-400">
              請挑選你要交給盟友的手牌（建議把你不適用、但符合盟友政黨結構的選民卡交給盟友！盟友也會回贈適合你的牌）：
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
              {players
                .find((p) => p.id === pendingPrompt.actorId)
                ?.hand.map((c) => {
                  const selected = pendingPrompt.selectedUids.includes(c.uid);
                  const actor = players.find((p) => p.id === pendingPrompt.actorId);
                  const ally = players.find((p) => p.id === actor?.allyId);
                  const goodForAlly = c.cardType === 'voter' && ally && isVoterValidForPlayer(c, ally);

                  return (
                    <button
                      key={c.uid}
                      onClick={() => {
                        const exists = pendingPrompt.selectedUids.includes(c.uid);
                        const nextSel = exists
                          ? pendingPrompt.selectedUids.filter((id) => id !== c.uid)
                          : [...pendingPrompt.selectedUids, c.uid];
                        setPendingPrompt({ ...pendingPrompt, selectedUids: nextSel });
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs transition ${
                        selected
                          ? 'bg-sky-600/30 border-sky-400 text-white ring-2 ring-sky-400'
                          : 'bg-slate-800 border-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="font-bold">{c.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {c.cardType === 'voter' ? STANCE_LABELS[c.stance].text : '陰謀卡'}
                      </div>
                      {goodForAlly && <div className="text-[10px] text-amber-300 font-bold mt-1">★ 盟友有效票</div>}
                    </button>
                  );
                })}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPendingPrompt(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-400"
              >
                取消
              </button>
              <button
                disabled={pendingPrompt.selectedUids.length === 0}
                onClick={() => {
                  const { actorId, selectedUids } = pendingPrompt;
                  setPendingPrompt(null);
                  executeAllyTrade(actorId, selectedUids);
                }}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-xs font-extrabold text-white"
              >
                確認交換（交出 {pendingPrompt.selectedUids.length} 張）
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. 回合結束超額棄牌視窗（上限 7 張） */}
      {pendingPrompt?.type === 'DISCARD_EXCESS' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-slate-900 border border-amber-500/70 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-extrabold text-amber-300">
              🗑️ 手牌超過 7 張上限！請挑選 {pendingPrompt.needCount} 張手牌棄置
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-1">
              {players
                .find((p) => p.id === pendingPrompt.responderId)
                ?.hand.map((c) => {
                  const selected = pendingPrompt.selectedUids.includes(c.uid);
                  return (
                    <button
                      key={c.uid}
                      onClick={() => {
                        const exists = pendingPrompt.selectedUids.includes(c.uid);
                        let nextSel = exists
                          ? pendingPrompt.selectedUids.filter((id) => id !== c.uid)
                          : [...pendingPrompt.selectedUids, c.uid];
                        if (nextSel.length > pendingPrompt.needCount) nextSel = nextSel.slice(1);
                        setPendingPrompt({ ...pendingPrompt, selectedUids: nextSel });
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs transition ${
                        selected
                          ? 'bg-rose-600/30 border-rose-400 text-white ring-2 ring-rose-400'
                          : 'bg-slate-800 border-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="font-bold">{c.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {c.cardType === 'voter' ? STANCE_LABELS[c.stance].text : '陰謀卡'}
                      </div>
                    </button>
                  );
                })}
            </div>
            <button
              disabled={pendingPrompt.selectedUids.length !== pendingPrompt.needCount}
              onClick={() => {
                const { responderId, selectedUids } = pendingPrompt;
                const dropSet = new Set(selectedUids);
                const resp = players.find((p) => p.id === responderId);
                const dropped = resp.hand.filter((c) => dropSet.has(c.uid));
                const nextPlayers = players.map((p) =>
                  p.id === responderId ? { ...p, hand: p.hand.filter((c) => !dropSet.has(c.uid)) } : p
                );
                setPendingPrompt(null);
                finalizeEndTurn(nextPlayers, deck, [...discard, ...dropped]);
              }}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-extrabold text-sm transition"
            >
              確認棄牌並結束回合（{pendingPrompt.selectedUids.length} / {pendingPrompt.needCount}）
            </button>
          </div>
        </div>
      )}

      {/* 9. 多數決特殊規則提案視窗 */}
      {pendingPrompt?.type === 'MAJORITY_MOTION' && (
        <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-indigo-500/60 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-extrabold text-indigo-300">⚖️ 官方特殊規則：立院多數決動議</h3>
            <p className="text-xs text-slate-400">
              依《政治風暴》嘴砲多數決規則：提出跨黨派協議交付全場 4 黨表決，只要獲得過半數（3 票以上）贊成即刻生效！
            </p>
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300">選擇針對與協商的政黨：</div>
              {players
                .filter((p) => p.id !== pendingPrompt.proposerId)
                .map((p) => {
                  const pt = PARTIES.find((x) => x.id === p.partyId);
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPendingPrompt({ ...pendingPrompt, targetId: p.id })}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold ${
                        pendingPrompt.targetId === p.id
                          ? 'bg-indigo-600/30 border-indigo-400 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {pt?.name}（{p.name}・目前 {getPlayerVoteScore(p)} 票）
                    </button>
                  );
                })}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  const tid = pendingPrompt.targetId;
                  setPendingPrompt(null);
                  handleProposeMajorityMotion('audit_swap', tid);
                }}
                className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white"
              >
                表決：強制互換 1 張手牌
              </button>
              <button
                onClick={() => {
                  const tid = pendingPrompt.targetId;
                  setPendingPrompt(null);
                  handleProposeMajorityMotion('subsidy_draw', tid);
                }}
                className="py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-bold text-white"
              >
                表決：補助本黨多抽 1 張牌
              </button>
            </div>
            <button
              onClick={() => setPendingPrompt(null)}
              className="w-full py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-400"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 10. 公開棄牌堆檢視視窗 */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-3xl w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-amber-300">
                公開棄牌堆檢視（共 {discard.length} 張）
              </h3>
              <button onClick={() => setShowDiscardModal(false)} className="p-1 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            {discard.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">目前棄牌堆為空。</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-80 overflow-y-auto p-1">
                {[...discard].reverse().map((c) => (
                  <div key={c.uid} className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs">
                    <div className="font-bold text-white">{c.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {c.cardType === 'voter' ? `選民・${STANCE_LABELS[c.stance].text}` : `陰謀・${c.category}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 11. 規則與卡牌百科視窗 */}
      {showRulesModal && <RulesModal onClose={() => setShowRulesModal(false)} />}

      {/* 12. 終局執政勝利結算與《風暴日報》政治新聞特刊畫面 */}
      {stage === 'gameover' && winnerInfo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="max-w-4xl w-full max-h-[92vh] overflow-y-auto bg-slate-900 border-2 border-amber-400 rounded-3xl p-4 sm:p-7 space-y-5 shadow-2xl">
            {/* 頂部勝選橫幅與四黨計票總覽 */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-4 text-center md:text-left">
                <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-400/40 shrink-0 hidden sm:flex">
                  <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-extrabold mb-1">
                    {winnerInfo.mode === 'solo'
                      ? '🏆 單獨執政勝利（滿 8 票）'
                      : '🤝 聯合執政勝利（滿 15 票）'}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                    {winnerInfo.winners
                      .map((w) => `${PARTIES.find((pt) => pt.id === w.partyId)?.name}（${w.name}）`)
                      .join(' ＆ ')}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                    歷經 <span className="text-sky-300 font-bold">{turnNumber}</span> 輪議場攻防，以{' '}
                    <span className="text-amber-300 font-extrabold text-base">{winnerInfo.totalVotes}</span>{' '}
                    張有效選票正式組閣執政！
                  </p>
                </div>
              </div>

              {/* 四黨得票速覽條 */}
              <div className="grid grid-cols-2 gap-2 w-full md:w-auto shrink-0 text-xs">
                {players.map((p) => {
                  const pt = PARTIES.find((x) => x.id === p.partyId);
                  const isWin = winnerInfo.winners.some((w) => w.id === p.id);
                  return (
                    <div
                      key={p.id}
                      className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-3 ${
                        isWin
                          ? 'bg-amber-500/15 border-amber-400/60 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="font-bold truncate">
                        {isWin ? '👑 ' : ''}
                        {pt?.name}
                      </span>
                      <span className="font-mono font-extrabold text-emerald-400 shrink-0">
                        {getPlayerVoteScore(p)} 票
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 媒體報導視角切換與複製工具列 */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                  <NewspaperIcon className="w-3.5 h-3.5 text-amber-400" /> 切換新聞視角：
                </span>
                {NEWS_STYLES.map((st) => (
                  <button
                    key={st.id}
                    disabled={newsLoading}
                    onClick={() => triggerNewsGeneration(winnerInfo, players, st.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      newsStyle === st.id
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 disabled:opacity-50'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <button
                disabled={newsLoading || !newsArticle}
                onClick={handleCopyNews}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-xs font-bold text-emerald-300 transition"
              >
                {copiedNews ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> 已複製新聞全文！
                  </>
                ) : (
                  <>
                    <CopyIcon className="w-3.5 h-3.5" /> 複製新聞全文
                  </>
                )}
              </button>
            </div>

            {/* 《風暴日報》實體報紙頭版排版區塊 */}
            <article className="bg-stone-100 text-stone-900 rounded-2xl p-5 sm:p-7 shadow-inner border-4 border-stone-300">
              {/* 報頭 Masthead */}
              <div className="border-b-4 border-double border-stone-900 pb-3 mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-red-700 text-white text-xs font-black tracking-widest rounded-sm uppercase">
                    號外 EXTRA
                  </span>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black tracking-wider text-stone-950 leading-none">
                      風暴日報
                    </div>
                    <div className="text-[10px] font-bold tracking-widest text-stone-600 uppercase mt-0.5">
                      POLITIKO TAIWAN DAILY・大選特別報導
                    </div>
                  </div>
                </div>
                <div className="text-xs font-bold text-stone-600 flex items-center gap-3">
                  <span>{NEWS_STYLES.find((s) => s.id === newsStyle)?.tag}</span>
                  <span>｜</span>
                  <span>第 {turnNumber} 輪終局特刊</span>
                </div>
              </div>

              {/* 載入中狀態 vs 完稿新聞內容 */}
              {newsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-red-700 animate-spin" />
                  <div className="font-extrabold text-base text-stone-800">
                    政治線特派記者正在根據本局戰況趕稿中...
                  </div>
                  <p className="text-xs text-stone-600 max-w-md">
                    正在調閱全場 {fullHistoryRef.current.length} 筆議場攻防紀錄、選票流向與政黨結盟內幕，即將印製頭版號外！
                  </p>
                </div>
              ) : newsArticle ? (
                <div className="space-y-4 text-left">
                  {/* 主標題與副標題 */}
                  <div className="space-y-2">
                    <h3 className="text-xl sm:text-3xl font-black text-stone-950 leading-snug">
                      {newsArticle.headline}
                    </h3>
                    {newsArticle.subheadline && (
                      <p className="text-xs sm:text-sm font-bold text-red-800 border-l-4 border-red-700 pl-3 py-0.5">
                        {newsArticle.subheadline}
                      </p>
                    )}
                  </div>

                  {/* 導言 */}
                  <p className="text-sm sm:text-base font-bold text-stone-900 leading-relaxed bg-stone-200/70 p-3.5 rounded-xl border border-stone-300">
                    {newsArticle.lead}
                  </p>

                  {/* 正文段落 */}
                  <div className="space-y-3 text-sm sm:text-[15px] text-stone-800 leading-relaxed">
                    {newsArticle.bodyParagraphs?.map((para, idx) => (
                      <p key={idx} className="indent-8">
                        {para}
                      </p>
                    ))}
                  </div>

                  {/* 政論名嘴／學者點評框 */}
                  {newsArticle.punditQuote && (
                    <div className="mt-4 pt-3 border-t-2 border-stone-300">
                      <div className="bg-amber-950/10 border-l-4 border-amber-700 p-3.5 rounded-r-xl">
                        <div className="text-xs font-black text-amber-900 mb-1">
                          🎙️ 政壇觀察與名嘴點評
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-stone-800 italic leading-relaxed">
                          {newsArticle.punditQuote}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </article>

            {/* 可展開檢視的完整對戰大事記 */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowTimelineInModal((prev) => !prev)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-300 hover:bg-slate-800/60 transition"
              >
                <span>📜 檢視本局完整議場攻防大事記（共 {fullHistoryRef.current.length} 筆紀錄）</span>
                {showTimelineInModal ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>
              {showTimelineInModal && (
                <div className="px-4 pb-4 max-h-48 overflow-y-auto space-y-1 text-xs border-t border-slate-800 pt-3">
                  {fullHistoryRef.current.map((item, idx) => (
                    <div key={item.id} className="text-slate-400 flex items-start gap-2">
                      <span className="font-mono text-slate-500 shrink-0">
                        #{idx + 1} [第{item.round}輪]
                      </span>
                      <span className="text-slate-200">{item.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 底部再玩一局按鈕 */}
            <button
              onClick={() => setStage('setup')}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-extrabold text-base transition shadow-lg"
            >
              再來一局《政治風暴》
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
// ============================================================================
// 子組件：對手座位資訊卡 & 規則百科視窗
// ============================================================================

function OpponentSeatCard({ player, allPlayers, isTurn, seatLabel }) {
  const party = PARTIES.find((pt) => pt.id === player.partyId);
  const votes = getPlayerVoteScore(player);
  const ally = player.allyId !== null ? allPlayers.find((x) => x.id === player.allyId) : null;
  const allyParty = ally ? PARTIES.find((pt) => pt.id === ally.partyId) : null;

  return (
    <div
      className={`rounded-2xl border p-3.5 h-full flex flex-col justify-between transition ${
        isTurn
          ? 'bg-slate-900 border-amber-400 shadow-lg shadow-amber-950/40'
          : 'bg-slate-900/75 border-slate-800'
      }`}
    >
      <div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
          <span>{seatLabel}</span>
          <span className="inline-flex items-center gap-1">
            {player.isAI ? <Bot className="w-3 h-3 text-purple-400" /> : <User className="w-3 h-3 text-emerald-400" />}
            手牌 <strong className="text-white">{player.hand.length}</strong>
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5">
            {party && (
              <span className={`px-2 py-0.5 rounded-md text-xs font-extrabold border ${party.badgeColor}`}>
                {party.name}
              </span>
            )}
            <span className="font-bold text-sm text-white truncate">{player.name}</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-extrabold">
            {votes} 票
          </span>
        </div>

        <div className="text-[11px] text-slate-400 mb-2">
          {player.partyUnrestricted ? '🔓 全選民通吃（已修改黨綱）' : party?.ruleDesc}
        </div>

        {allyParty && (
          <div className="mb-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
            <Handshake className="w-3 h-3" /> 與 {allyParty.name} 結盟（共 {votes + getPlayerVoteScore(ally)}/15）
          </div>
        )}

        {player.activeEffects.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {player.activeEffects.map((ef, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-200 text-[10px] font-semibold"
              >
                ⏳ {ef.cardObj.name}({ef.turnsLeft})
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 對手公開選票區縮覽 */}
      <div className="pt-2 border-t border-slate-800/90">
        {player.ballotBox.length === 0 ? (
          <div className="text-[11px] text-slate-500">選票區：尚無選票</div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {player.ballotBox.map((c) =>
              c.cardType === 'scheme' ? (
                <span
                  key={c.uid}
                  className="px-1.5 py-0.5 rounded bg-purple-900/60 border border-purple-400/40 text-[10px] font-bold text-purple-200"
                >
                  作票+2
                </span>
              ) : (
                <span
                  key={c.uid}
                  className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${STANCE_LABELS[c.stance].pill}`}
                >
                  {ETHNIC_LABELS[c.ethnic].slice(0, 2)}・{STANCE_LABELS[c.stance].text.slice(0, 2)}
                </span>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RulesModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 max-h-[85vh] overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-300">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-extrabold text-amber-300">📖 《政治風暴》四人對戰完整規則速查</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-white">1. 獲勝條件</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>單獨獲勝</strong>：未結盟政黨率先在選票區集滿 <strong>8 張有效選票</strong> 立即獲勝。</li>
            <li><strong>聯合獲勝</strong>：兩個結盟政黨的選票區合計集滿 <strong>15 張有效選票</strong> 共同獲勝（結盟期間不適用 8 票獨贏，除非先拆夥或打出《政黨叛變》踢開盟友！）。</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-white">2. 回合三階段（逆時針進行）</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>抽牌階段</strong>：從抽牌堆抽 2 張牌（受《AI造假影片》或《網軍》影響時減少）。</li>
            <li><strong>行動階段（嚴格二選一）</strong>：
              <br />・<strong>打出選民卡（張數不限）</strong>：將符合自家政黨結構的選民卡放入選票區。
              <br />・<strong>執行陰謀行動（上限 2 次）</strong>：打出陰謀卡、協商結盟（一回合限對一對象使用，遭拒後須待下回合才能再次提出邀請）、與盟友換牌、或棄 2 張選票解除聯盟。
            </li>
            <li><strong>棄牌階段</strong>：手牌上限為 7 張，超額手牌須正面朝上棄入公開棄牌堆。</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-white">3. 搶票與即時反制關鍵判例</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>被攻擊者自選選票</strong>：遭搶票或棄票攻擊時，由受害政黨自行挑選要交出的選民卡；若交出的選民卡不符合攻擊者的有效選民結構，將直接作廢進棄牌堆！</li>
            <li><strong>即時反制牌（全牌庫僅 5 張）</strong>：《總統特赦》x1、《恐龍法官》x2、《名嘴治國》x2 可在任何對手施展陰謀時即時攔截抵銷。</li>
          </ul>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
        >
          了解，返回議場
        </button>
      </div>
    </div>
  );
}
// End of PolitikoGame