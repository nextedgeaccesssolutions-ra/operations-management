import { useMemo } from 'react';
import { agents, type Agent } from '../neas/agentRegistry';

/**
 * The floor, drawn.
 *
 * A single inline SVG scene rather than a list of assets: the window wall with
 * the view, the sala with its sofas and wall-mounted TVs, shared tables where
 * colleagues sit facing each other, the walkway between the two, and the desk
 * where a person signs off what the agents produce.
 *
 * Everything with a number on it is passed in from real application state. The
 * TVs show live counts; the seats carry real agent names from the registry. No
 * figure here is invented for decoration — if a count is unavailable the tile
 * says so rather than showing a plausible number.
 *
 * Motion is CSS (see the `of-*` rules in index.css) and is switched off
 * entirely under prefers-reduced-motion.
 */

export type FloorTile = { label: string; value: string };

type Look = {
  skin: string;
  hair: string;
  top: string;
  style: 'bun' | 'short' | 'long' | 'afro' | 'bob' | 'hijab' | 'glasses';
};

const LOOKS: Look[] = [
  { skin: '#E9B48C', hair: '#2F2A25', top: '#CA9332', style: 'bun' },
  { skin: '#C2865A', hair: '#1E1B18', top: '#2F6F86', style: 'afro' },
  { skin: '#F0C9A8', hair: '#8C4A2F', top: '#EBC07E', style: 'long' },
  { skin: '#89593A', hair: '#171513', top: '#3E7F63', style: 'glasses' },
  { skin: '#D59C70', hair: '#36302A', top: '#B5543C', style: 'hijab' },
  { skin: '#EBC3A0', hair: '#A9A39A', top: '#8FA3AD', style: 'grey' as 'short' },
  { skin: '#C2865A', hair: '#241F1B', top: '#CA9332', style: 'bob' },
  { skin: '#F0C9A8', hair: '#3B3129', top: '#2F6F86', style: 'short' },
];

/* ── people ─────────────────────────────────────────────────────── */

function Head({ cx, cy, v, r = 17 }: { cx: number; cy: number; v: Look; r?: number }) {
  return (
    <g>
      {v.style === 'afro' && <circle cx={cx} cy={cy - 3} r={r + 6} fill={v.hair} />}
      {v.style === 'long' && (
        <rect x={cx - r - 3} y={cy - 12} width={2 * r + 6} height={42} rx={15} fill={v.hair} />
      )}
      {v.style === 'bob' && (
        <rect x={cx - r - 2} y={cy - 11} width={2 * r + 4} height={30} rx={13} fill={v.hair} />
      )}
      {v.style === 'hijab' && (
        <rect x={cx - r - 6} y={cy - 16} width={2 * r + 12} height={48} rx={21} fill={v.hair} />
      )}
      {v.style === 'bun' && <circle cx={cx} cy={cy - 21} r={7} fill={v.hair} />}

      <circle cx={cx} cy={cy} r={r} fill={v.skin} />

      {v.style !== 'hijab' && (
        <ellipse cx={cx} cy={cy - 9.5} rx={r + 0.5} ry={9.5} fill={v.hair} />
      )}

      <circle cx={cx - 5.8} cy={cy + 2} r={1.7} fill="#1B1714" />
      <circle cx={cx + 5.8} cy={cy + 2} r={1.7} fill="#1B1714" />
      <path
        d={`M ${cx - 4.4} ${cy + 7.5} q 4.4 4 8.8 0`}
        fill="none"
        stroke="#1B1714"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {v.style === 'glasses' && (
        <g fill="none" stroke="#1B1714" strokeWidth={1.3}>
          <circle cx={cx - 5.8} cy={cy + 2} r={4.4} />
          <circle cx={cx + 5.8} cy={cy + 2} r={4.4} />
          <line x1={cx - 1.4} y1={cy + 2} x2={cx + 1.4} y2={cy + 2} />
        </g>
      )}
    </g>
  );
}

/** Seen from the front — sitting behind a table, or on a sofa. */
function PersonFront({
  cx,
  cy,
  v,
  busy,
  delay,
}: {
  cx: number;
  cy: number;
  v: Look;
  busy?: boolean;
  delay?: string;
}) {
  return (
    <g className={busy ? 'of-bob' : undefined} style={{ animationDelay: delay }}>
      <Head cx={cx} cy={cy} v={v} />
      <rect x={cx - 26} y={cy + 14} width={52} height={40} rx={16} fill={v.top} />
      <rect x={cx - 26} y={cy + 30} width={13} height={24} rx={6.5} fill={v.top} />
      <rect x={cx + 13} y={cy + 30} width={13} height={24} rx={6.5} fill={v.top} />
    </g>
  );
}

/** Seen from behind — sitting on the near side of a table, facing away. */
function PersonBack({
  cx,
  cy,
  v,
  busy,
  delay,
}: {
  cx: number;
  cy: number;
  v: Look;
  busy?: boolean;
  delay?: string;
}) {
  return (
    <g className={busy ? 'of-bob' : undefined} style={{ animationDelay: delay }}>
      {/* back of the head: hair all the way round, no face */}
      <circle cx={cx} cy={cy} r={17} fill={v.hair} />
      {v.style === 'bun' && <circle cx={cx} cy={cy - 20} r={7} fill={v.hair} />}
      {v.style === 'afro' && <circle cx={cx} cy={cy - 3} r={23} fill={v.hair} />}
      <ellipse cx={cx} cy={cy + 13} rx={13} ry={5} fill={v.skin} opacity={0.75} />
      <rect x={cx - 27} y={cy + 15} width={54} height={38} rx={16} fill={v.top} />
      <rect x={cx - 27} y={cy + 30} width={13} height={23} rx={6.5} fill={v.top} />
      <rect x={cx + 14} y={cy + 30} width={13} height={23} rx={6.5} fill={v.top} />
    </g>
  );
}

/**
 * A conversation turn. Two bubbles sharing a cycle with opposite delays read as
 * one person speaking, then the other — which is what makes the pair look like
 * colleagues talking rather than two people sitting near each other.
 */
function Bubble({
  x,
  y,
  flip,
  delay,
  lines = 2,
}: {
  x: number;
  y: number;
  flip?: boolean;
  delay: string;
  lines?: number;
}) {
  const w = 54;
  const h = lines === 1 ? 20 : 28;
  return (
    <g className="of-say" style={{ animationDelay: delay }}>
      <rect x={x} y={y} width={w} height={h} rx={9} fill="#F4EEE2" />
      <polygon
        points={
          flip
            ? `${x + 12},${y + h} ${x + 26},${y + h} ${x + 11},${y + h + 9}`
            : `${x + w - 26},${y + h} ${x + w - 12},${y + h} ${x + w - 11},${y + h + 9}`
        }
        fill="#F4EEE2"
      />
      <rect x={x + 10} y={y + 7} width={34} height={3} rx={1.5} fill="#B9AE98" />
      {lines > 1 && (
        <rect x={x + 10} y={y + 15} width={22} height={3} rx={1.5} fill="#CFC5B1" />
      )}
    </g>
  );
}

function Laptop({
  cx,
  top,
  lit,
  delay,
  back,
}: {
  cx: number;
  top: number;
  lit?: boolean;
  delay?: string;
  /** Seen from behind — the closed back of the lid, no screen. */
  back?: boolean;
}) {
  if (back) {
    return (
      <g>
        <rect x={cx - 25} y={top + 26} width={50} height={6} rx={2.5} fill="#CA9332" />
        <rect x={cx - 22} y={top} width={44} height={26} rx={4} fill="#123B4E" stroke="#CA9332" strokeWidth={1.8} />
        <circle cx={cx} cy={top + 13} r={5} fill="#CA9332" opacity={0.5} />
      </g>
    );
  }
  return (
    <g>
      <rect x={cx - 25} y={top + 26} width={50} height={6} rx={2.5} fill="#CA9332" />
      <rect
        x={cx - 22}
        y={top}
        width={44}
        height={26}
        rx={4}
        fill="#0D2A38"
        stroke="#CA9332"
        strokeWidth={1.8}
      />
      <rect x={cx - 17} y={top + 5} width={12} height={8} rx={1.5} fill="#B5543C" />
      <rect x={cx - 3} y={top + 6} width={16} height={2.4} rx={1.2} fill="#2F5668" />
      <rect x={cx - 3} y={top + 11} width={11} height={2.4} rx={1.2} fill="#2F5668" />
      <rect
        x={cx - 17}
        y={top + 18}
        width={26}
        height={2.6}
        rx={1.3}
        fill={lit ? '#EBC07E' : '#2F5668'}
        className={lit ? 'of-line' : undefined}
        style={{ animationDelay: delay }}
      />
    </g>
  );
}

/* ── room furniture ─────────────────────────────────────────────── */

/** A window with the view: golden-hour sky, the skyline, and drifting cloud. */
function Window({ x, y, w, h, i }: { x: number; y: number; w: number; h: number; i: number }) {
  const clip = `of-win-${i}`;
  const sky = `of-sky-${i}`;
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <rect x={x} y={y} width={w} height={h} rx={7} />
        </clipPath>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4C5E8E" />
          <stop offset="38%" stopColor="#C98A6B" />
          <stop offset="68%" stopColor="#E9A961" />
          <stop offset="100%" stopColor="#F6CE86" />
        </linearGradient>
      </defs>

      <g clipPath={`url(#${clip})`}>
        <rect x={x} y={y} width={w} height={h} fill={`url(#${sky})`} />

        {/* sun, low and warm */}
        <circle cx={x + w * 0.68} cy={y + h * 0.62} r={16} fill="#FFF0C9" className="of-sun" />
        <circle cx={x + w * 0.68} cy={y + h * 0.62} r={27} fill="#FFE7A8" opacity={0.28} className="of-sun" />

        {/* far skyline, then near skyline — the towers NEAS works on */}
        <g fill="#0A2C3C" opacity={0.55}>
          <rect x={x + 10} y={y + h - 54} width={26} height={54} />
          <rect x={x + 42} y={y + h - 72} width={20} height={72} />
          <rect x={x + 68} y={y + h - 46} width={30} height={46} />
          <rect x={x + 104} y={y + h - 64} width={22} height={64} />
          <rect x={x + 132} y={y + h - 40} width={28} height={40} />
          <rect x={x + 192} y={y + h - 58} width={24} height={58} />
          <rect x={x + 222} y={y + h - 44} width={30} height={44} />
          <rect x={x + 258} y={y + h - 68} width={20} height={68} />
        </g>
        <g fill="#04171F">
          <rect x={x + 22} y={y + h - 38} width={34} height={38} />
          <rect x={x + 62} y={y + h - 58} width={26} height={58} />
          <rect x={x + 94} y={y + h - 30} width={40} height={30} />
          <rect x={x + 150} y={y + h - 48} width={28} height={48} />
          <rect x={x + 184} y={y + h - 34} width={36} height={34} />
          <rect x={x + 226} y={y + h - 52} width={24} height={52} />
          <rect x={x + 256} y={y + h - 28} width={38} height={28} />
          {/* a mast on the tallest, with a working light */}
          <rect x={x + 73} y={y + h - 70} width={3} height={13} />
        </g>
        <circle cx={x + 74.5} cy={y + h - 72} r={2.4} fill="#E86A5A" className="of-beacon" />

        {/* lit windows in the near towers */}
        <g fill="#F3C87D" opacity={0.8}>
          {[0, 1, 2, 3].map((r) =>
            [0, 1].map((c) => (
              <rect
                key={`a${r}${c}`}
                x={x + 67 + c * 9}
                y={y + h - 52 + r * 11}
                width={5}
                height={6}
                opacity={(r + c) % 3 === 0 ? 0.35 : 0.9}
              />
            ))
          )}
          {[0, 1, 2].map((r) => (
            <rect key={`b${r}`} x={x + 232} y={y + h - 45 + r * 12} width={5} height={6} />
          ))}
        </g>

        {/* cloud, drifting */}
        <g className="of-cloud" opacity={0.5}>
          <ellipse cx={x - 30} cy={y + 34} rx={30} ry={11} fill="#FBE4C4" />
          <ellipse cx={x - 8} cy={y + 30} rx={20} ry={9} fill="#FBE4C4" />
        </g>
        <g className="of-cloud-slow" opacity={0.34}>
          <ellipse cx={x - 90} cy={y + 62} rx={38} ry={10} fill="#FFF2DD" />
        </g>

        {/* a bird or two, because the view is the point */}
        <g className="of-bird" fill="none" stroke="#2A3B4A" strokeWidth={1.6} strokeLinecap="round">
          <path d={`M ${x + 60} ${y + 48} q 5 -5 10 0`} />
          <path d={`M ${x + 76} ${y + 42} q 4 -4 8 0`} />
        </g>
      </g>

      {/* frame and mullions */}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={7}
        fill="none"
        stroke="#CA9332"
        strokeWidth={3}
        opacity={0.75}
      />
      <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke="#CA9332" strokeWidth={2.4} opacity={0.6} />
      <line x1={x} y1={y + h * 0.55} x2={x + w} y2={y + h * 0.55} stroke="#CA9332" strokeWidth={2} opacity={0.45} />
      {/* sill */}
      <rect x={x - 6} y={y + h} width={w + 12} height={7} rx={3} fill="#123141" />
    </g>
  );
}

/** A wall-mounted screen in the sala, showing one live figure. */
function Tv({ x, y, w, h, tile }: { x: number; y: number; w: number; h: number; tile: FloorTile }) {
  return (
    <g>
      <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} rx={9} fill="#04171F" />
      <rect x={x} y={y} width={w} height={h} rx={6} fill="#0C2634" stroke="#CA9332" strokeWidth={1.4} opacity={0.98} />
      <rect x={x} y={y} width={w} height={h} rx={6} fill="#EBC07E" opacity={0.05} className="of-screen" />

      <text x={x + w / 2} y={y + 30} className="of-tv-label">
        {tile.label.toUpperCase()}
      </text>
      <text x={x + w / 2} y={y + 72} className="of-tv-value">
        {tile.value}
      </text>

      <rect x={x + 22} y={y + h - 18} width={w - 44} height={3} rx={1.5} fill="#CA9332" opacity={0.3} />
      {/* mount */}
      <rect x={x + w / 2 - 9} y={y + h + 3} width={18} height={9} rx={2} fill="#0A2030" />
      <rect x={x + w / 2 - 22} y={y + h + 12} width={44} height={4} rx={2} fill="#0A2030" />
    </g>
  );
}

function Sofa({ x, y, w, seats }: { x: number; y: number; w: number; seats: number }) {
  return (
    <g>
      {/* backrest */}
      <rect x={x} y={y} width={w} height={34} rx={13} fill="#2F6F86" />
      <rect x={x + 6} y={y + 6} width={w - 12} height={22} rx={10} fill="#3A7F97" />
      {/* seat */}
      <rect x={x - 4} y={y + 30} width={w + 8} height={30} rx={11} fill="#28607A" />
      {/* cushions */}
      {Array.from({ length: seats }).map((_, i) => (
        <rect
          key={i}
          x={x + 6 + i * ((w - 12) / seats)}
          y={y + 33}
          width={(w - 12) / seats - 6}
          height={22}
          rx={8}
          fill="#357A93"
        />
      ))}
      {/* arms */}
      <rect x={x - 14} y={y + 14} width={16} height={48} rx={8} fill="#28607A" />
      <rect x={x + w - 2} y={y + 14} width={16} height={48} rx={8} fill="#28607A" />
      {/* feet */}
      <rect x={x + 6} y={y + 60} width={8} height={9} rx={2} fill="#17313F" />
      <rect x={x + w - 14} y={y + 60} width={8} height={9} rx={2} fill="#17313F" />
    </g>
  );
}

function Plant({ x, y }: { x: number; y: number }) {
  return (
    <g className="of-sway">
      <path d={`M ${x} ${y} q -22 -20 -12 -44`} fill="none" stroke="#3E7F63" strokeWidth={7} strokeLinecap="round" />
      <path d={`M ${x} ${y} q 20 -18 10 -40`} fill="none" stroke="#49916F" strokeWidth={7} strokeLinecap="round" />
      <path d={`M ${x} ${y} q -4 -26 2 -50`} fill="none" stroke="#3E7F63" strokeWidth={7} strokeLinecap="round" />
      <ellipse cx={x - 13} cy={y - 46} rx={11} ry={7} fill="#49916F" />
      <ellipse cx={x + 11} cy={y - 42} rx={10} ry={6.5} fill="#3E7F63" />
      <ellipse cx={x + 2} cy={y - 52} rx={10} ry={6.5} fill="#55A07C" />
      <path d={`M ${x - 17} ${y} h 34 l -4 26 h -26 z`} fill="#B5543C" />
      <rect x={x - 19} y={y - 4} width={38} height={8} rx={3} fill="#C76044" />
    </g>
  );
}

/* ── the scene ──────────────────────────────────────────────────── */

export default function OfficeFloor({
  tiles,
  signOffLabel = 'HUMAN SIGN-OFF',
}: {
  tiles: FloorTile[];
  signOffLabel?: string;
}) {
  /** Real names for the seats, picked one per department so they differ. */
  const seated = useMemo(() => {
    const byDept = new Map<string, Agent>();
    for (const a of agents) if (!byDept.has(a.department)) byDept.set(a.department, a);
    return Array.from(byDept.values());
  }, []);

  const seat = (i: number) => seated[i % Math.max(1, seated.length)] ?? null;
  const look = (i: number) => LOOKS[i % LOOKS.length];
  const firstName = (a: Agent | null) => (a ? a.name.split(' ')[0] : 'Open seat');
  const roleOf = (a: Agent | null) =>
    a ? a.title.replace(/\s*(Agent|& Executive Intelligence)\s*/gi, '').trim().slice(0, 26) : 'unassigned';

  const tvTiles: FloorTile[] = [
    tiles[0] ?? { label: 'On duty', value: '—' },
    tiles[1] ?? { label: 'Awaiting sign-off', value: '—' },
  ];

  return (
    <div className="of-wrap">
      <svg
        className="of-floor"
        viewBox="0 0 1200 700"
        role="img"
        aria-label={
          'Illustrated floor of the NEAS virtual office. Along the top wall, two screens above the ' +
          'lounge show live counts and two tall windows look out over a city skyline at golden hour. ' +
          'On the left, a lounge with two sofas, a coffee table and a plant, where colleagues sit ' +
          'talking. On the right, shared tables where colleagues sit facing each other at laptops, ' +
          'with a walkway between the two areas and a desk where a person signs off the agents\' work.'
        }
      >
        <defs>
          <linearGradient id="of-room" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0A2130" />
            <stop offset="100%" stopColor="#071D29" />
          </linearGradient>
          <linearGradient id="of-rug" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#CA9332" stopOpacity={0.16} />
            <stop offset="100%" stopColor="#CA9332" stopOpacity={0.05} />
          </linearGradient>
        </defs>

        {/* room */}
        <rect x={0} y={0} width={1200} height={700} rx={16} fill="url(#of-room)" />

        {/* the wall the screens and windows are set into */}
        <rect x={0} y={0} width={1200} height={206} rx={16} fill="#0B2432" />
        <rect x={0} y={198} width={1200} height={10} fill="#133A4C" />

        {/* two screens above the lounge */}
        <Tv x={46} y={40} w={172} h={104} tile={tvTiles[0]} />
        <Tv x={238} y={40} w={172} h={104} tile={tvTiles[1]} />
        <text x={228} y={192} className="of-zone">
          SALA — LOUNGE
        </text>

        {/* the view */}
        <Window x={470} y={24} w={320} h={140} i={1} />
        <Window x={830} y={24} w={320} h={140} i={2} />

        {/* ── sala ───────────────────────────────────────────── */}
        <rect x={34} y={296} width={386} height={258} rx={18} fill="#0E2C3C" stroke="#CA9332" strokeOpacity={0.22} />
        <ellipse cx={210} cy={468} rx={168} ry={66} fill="url(#of-rug)" />

        {/* long sofa with two colleagues in conversation */}
        <Sofa x={66} y={372} w={230} seats={3} />
        <PersonFront cx={126} cy={352} v={look(0)} busy delay="0ms" />
        <PersonFront cx={236} cy={352} v={look(2)} busy delay="900ms" />
        <Bubble x={60} y={286} delay="0s" />
        <Bubble x={236} y={292} flip delay="2.1s" />

        {/* coffee table */}
        <g>
          <rect x={120} y={462} width={160} height={16} rx={7} fill="#8A5A3B" />
          <rect x={120} y={462} width={160} height={6} rx={3} fill="#A66F4A" />
          <rect x={132} y={478} width={8} height={20} rx={3} fill="#6E4730" />
          <rect x={260} y={478} width={8} height={20} rx={3} fill="#6E4730" />
          {/* two mugs and a folder, because two people are sitting here */}
          <rect x={146} y={450} width={13} height={14} rx={3} fill="#EBC07E" />
          <path d="M 159 454 q 7 3 0 7" fill="none" stroke="#EBC07E" strokeWidth={2.4} />
          <rect x={240} y={452} width={12} height={12} rx={3} fill="#F4EEE2" />
          <rect x={178} y={452} width={44} height={12} rx={2} fill="#F4EEE2" opacity={0.9} />
          <rect x={184} y={456} width={26} height={2.4} rx={1.2} fill="#B9AE98" />
        </g>

        {/* armchair, side-on, with a third colleague listening */}
        <Sofa x={320} y={392} w={80} seats={1} />
        <PersonFront cx={360} cy={372} v={look(4)} />

        <Plant x={398} y={330} />

        <text x={227} y={574} className="of-cap">
          {firstName(seat(0))} and {firstName(seat(2))} are working through a hand-off
        </text>

        {/* ── shared tables, colleagues facing each other ───── */}
        {[
          { x: 470, y: 330, a: 1, b: 3 },
          { x: 850, y: 330, a: 5, b: 7 },
        ].map((t, k) => {
          const far = seat(t.a);
          const near = seat(t.b);
          return (
            <g key={k}>
              {/* the colleague on the far side, facing us */}
              <PersonFront cx={t.x + 160} cy={t.y} v={look(t.a)} busy delay={`${k * 300}ms`} />

              {/* the table */}
              <rect x={t.x + 30} y={t.y + 66} width={260} height={15} rx={7} fill="#8A5A3B" />
              <rect x={t.x + 30} y={t.y + 66} width={260} height={5} rx={2.5} fill="#A66F4A" />
              <rect x={t.x + 48} y={t.y + 81} width={9} height={26} rx={3} fill="#6E4730" />
              <rect x={t.x + 263} y={t.y + 81} width={9} height={26} rx={3} fill="#6E4730" />

              {/* their laptop, and hands on the table */}
              <Laptop cx={t.x + 160} top={t.y + 38} lit delay={`${k * 400}ms`} />
              <rect
                x={t.x + 126}
                y={t.y + 58}
                width={15}
                height={8}
                rx={4}
                fill={look(t.a).skin}
                className="of-type-l"
                style={{ animationDelay: `${k * 120}ms` }}
              />
              <rect
                x={t.x + 180}
                y={t.y + 58}
                width={15}
                height={8}
                rx={4}
                fill={look(t.a).skin}
                className="of-type-r"
                style={{ animationDelay: `${k * 120}ms` }}
              />

              {/* a shared document in the middle of the table */}
              <g className="of-nudge" style={{ animationDelay: `${k * 700}ms` }}>
                <rect x={t.x + 56} y={t.y + 56} width={34} height={11} rx={2} fill="#F4EEE2" />
                <rect x={t.x + 61} y={t.y + 60} width={20} height={2.4} rx={1.2} fill="#B9AE98" />
              </g>

              {/* the colleague on our side of the table, seen from behind,
                  with their own laptop on the table in front of them */}
              <PersonBack cx={t.x + 92} cy={t.y + 104} v={look(t.b)} busy delay={`${k * 500}ms`} />
              <Laptop cx={t.x + 92} top={t.y + 38} back />

              {/* the two of them talking across it */}
              <Bubble x={t.x + 206} y={t.y - 44} delay={`${k * 1.1}s`} />
              <Bubble x={t.x + 18} y={t.y + 34} flip delay={`${k * 1.1 + 2.1}s`} lines={1} />

              <text x={t.x + 160} y={t.y + 176} className="of-name">
                {firstName(far)} &amp; {firstName(near)}
              </text>
              <text x={t.x + 160} y={t.y + 192} className="of-role">
                {roleOf(far)}
              </text>
            </g>
          );
        })}

        <text x={810} y={192} className="of-zone">
          WORKING FLOOR — SHARED TABLES
        </text>

        {/* pendant lights over each shared table */}
        {[630, 1010].map((cx) => (
          <g key={cx}>
            <line x1={cx} y1={208} x2={cx} y2={250} stroke="#CA9332" strokeOpacity={0.35} strokeWidth={2} />
            <path d={`M ${cx - 26} 272 q 26 -30 52 0 z`} fill="#CA9332" opacity={0.85} />
            <ellipse cx={cx} cy={272} rx={26} ry={5} fill="#EBC07E" />
            <ellipse cx={cx} cy={292} rx={40} ry={16} fill="#EBC07E" opacity={0.1} />
          </g>
        ))}

        {/* ── walkway ────────────────────────────────────────── */}
        <rect x={34} y={596} width={1132} height={74} rx={16} fill="#0D2A38" />
        <line
          x1={60}
          y1={633}
          x2={1140}
          y2={633}
          stroke="#CA9332"
          strokeOpacity={0.22}
          strokeWidth={2}
          strokeDasharray="12 14"
        />

        {/* a document travelling between the two areas */}
        <g className="of-doc">
          <rect x={150} y={624} width={20} height={14} rx={3} fill="#F4EEE2" stroke="#CA9332" strokeWidth={1.6} />
        </g>

        {/* someone walking the floor with a folder */}
        <g className="of-walk">
          <PersonFront cx={470} cy={612} v={look(6)} />
          <rect x={496} y={642} width={24} height={17} rx={3} fill="#EBC07E" />
          <rect x={500} y={647} width={15} height={2.6} rx={1.3} fill="#B5873C" />
        </g>

        {/* the desk where a person signs the work off */}
        <g>
          <ellipse cx={940} cy={636} rx={54} ry={16} fill="#CA9332" opacity={0.12} />
          <PersonFront cx={940} cy={602} v={{ skin: '#E9B48C', hair: '#2F2A25', top: '#CA9332', style: 'short' }} />
          <rect x={886} y={648} width={108} height={12} rx={5} fill="#8A5A3B" />
          <rect x={886} y={648} width={108} height={4} rx={2} fill="#A66F4A" />
          <text x={940} y={588} className="of-signoff">
            {signOffLabel}
          </text>
        </g>

        {/* `.of-cap` sets text-anchor in CSS, and CSS beats the presentation
            attribute — so an end-anchored caption needs its own class. */}
        <text x={1142} y={690} className="of-cap-end">
          nothing leaves this floor unapproved
        </text>
      </svg>
    </div>
  );
}
