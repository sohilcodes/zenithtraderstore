import { useEffect, useRef } from 'react';
import Head from 'next/head';

/* ─── CANDLE BACKGROUND ─────────────────────────────────────── */
function CandleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const CANDLE_W = 14;
    const GAP = 6;
    const STEP = CANDLE_W + GAP;

    let candles = [];
    let offset = 0;
    let rafId;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initCandles();
    }

    function randBetween(a, b) {
      return a + Math.random() * (b - a);
    }

    function makeCandle(x) {
      const isGreen = Math.random() < 0.55;
      const bodyH = randBetween(18, canvas.height * 0.22);
      const bodyY = randBetween(canvas.height * 0.1, canvas.height * 0.75);
      const wickTop = randBetween(4, 18);
      const wickBot = randBetween(4, 18);
      return { x, isGreen, bodyH, bodyY, wickTop, wickBot };
    }

    function initCandles() {
      candles = [];
      const count = Math.ceil(canvas.width / STEP) + 4;
      for (let i = 0; i < count; i++) {
        candles.push(makeCandle(i * STEP));
      }
    }

    function drawGrid() {
      ctx.strokeStyle = 'rgba(0,255,100,0.04)';
      ctx.lineWidth = 1;
      const cols = Math.ceil(canvas.width / 80);
      const rows = Math.ceil(canvas.height / 60);
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * 80, 0);
        ctx.lineTo(c * 80, canvas.height);
        ctx.stroke();
      }
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * 60);
        ctx.lineTo(canvas.width, r * 60);
        ctx.stroke();
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGrid();

      offset += 0.4;

      candles.forEach((c, i) => {
        const x = c.x - offset;

        // Recycle candles that scroll off left
        if (x + CANDLE_W < -10) {
          const lastX = candles.reduce((max, cc) => Math.max(max, cc.x), -Infinity);
          candles[i] = makeCandle(lastX + STEP);
          return;
        }

        const color = c.isGreen ? 'rgba(0,220,100,0.55)' : 'rgba(255,60,80,0.45)';
        const glowColor = c.isGreen ? 'rgba(0,255,100,0.4)' : 'rgba(255,60,80,0.3)';

        ctx.save();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 8;

        // Wick
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + CANDLE_W / 2, c.bodyY - c.wickTop);
        ctx.lineTo(x + CANDLE_W / 2, c.bodyY + c.bodyH + c.wickBot);
        ctx.stroke();

        // Body
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect
          ? ctx.roundRect(x, c.bodyY, CANDLE_W, c.bodyH, 2)
          : ctx.rect(x, c.bodyY, CANDLE_W, c.bodyH);
        ctx.fill();

        ctx.restore();
      });

      rafId = requestAnimationFrame(draw);
    }

    resize();
    draw();

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        zIndex: 0,
        display: 'block',
      }}
    />
  );
}

/* ─── WAVE LINE ─────────────────────────────────────────────── */
function WaveLine() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let t = 0;
    let rafId;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const baseY = canvas.height * 0.65;
      const amp1 = 28, amp2 = 14;
      const freq1 = 0.012, freq2 = 0.025;

      ctx.save();
      ctx.strokeStyle = 'rgba(0,220,100,0.35)';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(0,255,120,0.5)';
      ctx.shadowBlur = 12;
      ctx.beginPath();

      for (let x = 0; x <= canvas.width; x += 2) {
        const y = baseY
          + Math.sin(x * freq1 + t) * amp1
          + Math.sin(x * freq2 + t * 1.3) * amp2;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      t += 0.008;
      rafId = requestAnimationFrame(draw);
    }

    resize();
    draw();

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        zIndex: 1,
        display: 'block',
        pointerEvents: 'none',
      }}
    />
  );
}

/* ─── TICKER BAR ─────────────────────────────────────────────── */
const TICKERS = [
  { label: 'BTC/USD', dir: 'up', price: '67,420' },
  { label: 'ETH/USD', dir: 'down', price: '3,512' },
  { label: 'EUR/USD', dir: 'up', price: '1.0842' },
  { label: 'GOLD', dir: 'up', price: '2,341' },
  { label: 'OIL', dir: 'down', price: '78.34' },
  { label: 'GBP/USD', dir: 'up', price: '1.2671' },
  { label: 'XRP/USD', dir: 'down', price: '0.612' },
];

function TickerBar() {
  const items = [...TICKERS, ...TICKERS];

  return (
    <div style={{
      height: '44px',
      borderRadius: '12px',
      background: 'rgba(13,31,20,0.85)',
      border: '1px solid #00ff8820',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      marginBottom: '20px',
      position: 'relative',
    }}>
      {/* LIVE badge */}
      <div style={{
        flexShrink: 0,
        margin: '0 10px',
        background: '#00e87a',
        color: '#001a0a',
        fontFamily: 'Orbitron, sans-serif',
        fontWeight: 900,
        fontSize: '9px',
        letterSpacing: '1px',
        padding: '3px 8px',
        borderRadius: '6px',
        zIndex: 2,
      }}>LIVE</div>

      {/* Fade left edge */}
      <div style={{
        position: 'absolute',
        left: '56px',
        top: 0, bottom: 0,
        width: '24px',
        background: 'linear-gradient(90deg, rgba(13,31,20,0.95), transparent)',
        zIndex: 2,
        pointerEvents: 'none',
      }} />

      {/* Scrolling row */}
      <div style={{ overflow: 'hidden', flex: 1, position: 'relative' }}>
        <div style={{
          display: 'flex',
          gap: '0',
          animation: 'scroll 22s linear infinite',
          whiteSpace: 'nowrap',
          willChange: 'transform',
        }}>
          {items.map((t, i) => (
            <span key={i} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '0 18px',
              fontSize: '12px',
              fontWeight: 600,
            }}>
              <span style={{ color: '#3a7a52' }}>{t.label}</span>
              <span style={{ color: t.dir === 'up' ? '#00e87a' : '#ff4466', fontSize: '10px' }}>
                {t.dir === 'up' ? '▲' : '▼'}
              </span>
              <span style={{ color: t.dir === 'up' ? '#00e87a' : '#ff4466', fontWeight: 700 }}>
                {t.price}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Fade right edge */}
      <div style={{
        position: 'absolute',
        right: 0,
        top: 0, bottom: 0,
        width: '24px',
        background: 'linear-gradient(270deg, rgba(13,31,20,0.95), transparent)',
        zIndex: 2,
        pointerEvents: 'none',
      }} />
    </div>
  );
}

/* ─── STATS ROW ─────────────────────────────────────────────── */
function StatsRow() {
  const stats = [
    { value: '10K+', label: 'MEMBERS' },
    { value: '97%', label: 'ACCURACY' },
    { value: '24/7', label: 'SIGNALS' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '10px',
      marginBottom: '26px',
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          background: 'rgba(13,31,20,0.80)',
          border: '1px solid #00ff8820',
          borderRadius: '16px',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          padding: '14px 8px',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: 'Orbitron, sans-serif',
            fontWeight: 900,
            fontSize: '22px',
            color: '#00e87a',
            textShadow: '0 0 10px #00ff8844',
            lineHeight: 1.1,
          }}>{s.value}</div>
          <div style={{
            fontSize: '9px',
            letterSpacing: '2px',
            color: '#3a7a52',
            marginTop: '5px',
            textTransform: 'uppercase',
          }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── SECTION HEADER ─────────────────────────────────────────── */
function SectionHeader({ icon, title }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '10px',
    }}>
      <span style={{ fontSize: '15px' }}>{icon}</span>
      <span style={{
        fontFamily: 'Orbitron, sans-serif',
        fontWeight: 700,
        fontSize: '12px',
        color: '#00e87a',
        letterSpacing: '3px',
        textTransform: 'uppercase',
        flexShrink: 0,
      }}>{title}</span>
      <div style={{
        flex: 1,
        height: '1px',
        background: 'linear-gradient(90deg, #00ff8820, transparent)',
      }} />
    </div>
  );
}

/* ─── ITEM CARD ─────────────────────────────────────────────── */
function ItemCard({ emoji, name, sub, live }) {
  const TG_URL = 'https://t.me/+acQi9-pYh4c1OTE1';

  return (
    <div
      onClick={() => window.open(TG_URL, '_blank')}
      style={{
        background: 'rgba(13,31,20,0.82)',
        border: '1px solid #00ff8815',
        borderRadius: '16px',
        padding: '13px 14px',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '13px',
        transition: 'border-color 0.18s, background 0.18s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#00ff8835';
        e.currentTarget.style.background = 'rgba(13,40,25,0.90)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#00ff8815';
        e.currentTarget.style.background = 'rgba(13,31,20,0.82)';
      }}
    >
      {/* Emoji box */}
      <div style={{
        width: '50px',
        height: '50px',
        borderRadius: '13px',
        background: '#1a3325',
        border: '1px solid #00ff8822',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        flexShrink: 0,
      }}>{emoji}</div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '15px',
          fontWeight: 700,
          color: '#e0ffe8',
          lineHeight: 1.2,
        }}>{name}</div>
        <div style={{
          fontSize: '10px',
          fontWeight: 600,
          color: '#00a854',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginTop: '3px',
        }}>{sub}</div>
      </div>

      {/* Live dot */}
      {live && (
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: '#00e87a',
          boxShadow: '0 0 6px #00ff88',
          animation: 'blink 1.2s ease-in-out infinite',
          flexShrink: 0,
        }} />
      )}

      {/* Arrow */}
      <div style={{
        width: '32px',
        height: '32px',
        background: '#1a3325',
        border: '1px solid #00ff8822',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#00e87a',
        fontSize: '18px',
        flexShrink: 0,
        lineHeight: 1,
      }}>›</div>
    </div>
  );
}

/* ─── SECTION ─────────────────────────────────────────────── */
function Section({ icon, title, items }) {
  return (
    <div style={{ marginBottom: '26px' }}>
      <SectionHeader icon={icon} title={title} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
        {items.map((item, i) => (
          <ItemCard key={i} {...item} />
        ))}
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ─────────────────────────────────────────────── */
export default function Home() {
  const sections = [
    {
      icon: '📊', title: 'TRADING TOOLS',
      items: [
        { emoji: '📡', name: 'Join Channel', sub: 'SIGNAL UPDATES', live: true },
      ],
    },
    {
      icon: '🌐', title: 'COMMUNITY',
      items: [
        { emoji: '💬', name: 'Join Chat', sub: 'TRADERS COMMUNITY' },
      ],
    },
    {
      icon: '🤖', title: 'QUOTEX BOTS',
      items: [
        { emoji: '🔥', name: 'Quotex Superbot', sub: 'BOT 1' },
        { emoji: '👑', name: 'Binary Bosss', sub: 'BOT 2' },
        { emoji: '🕵️', name: 'Secret Quotex', sub: 'BOT 3' },
        { emoji: '⚡', name: 'MegaBot', sub: 'BOT 4' },
      ],
    },
    {
      icon: '🤖', title: 'BINOLLA BOTS',
      items: [
        { emoji: '📶', name: 'Signal BOT', sub: 'BOT 5' },
        { emoji: '🇧🇩', name: 'BD BOT', sub: 'BOT 6' },
      ],
    },
    {
      icon: '📡', title: 'LIVE SIGNAL',
      items: [
        { emoji: '🔴', name: 'NON MTG Signals', sub: 'BOT 7 · LIVE', live: true },
      ],
    },
    {
      icon: '📈', title: 'FUTURE SIGNALS',
      items: [
        { emoji: '🔮', name: 'Future Signal', sub: 'PREMIUM SIGNALS' },
        { emoji: '🧠', name: 'Secret Solution', sub: 'EXCLUSIVE' },
      ],
    },
    {
      icon: '🎓', title: 'COURSES',
      items: [
        { emoji: '💎', name: 'Paid Course', sub: 'PREMIUM LEARNING' },
        { emoji: '🎁', name: 'Free Course', sub: 'FREE ACCESS' },
      ],
    },
    {
      icon: '🚀', title: 'AIRDROP',
      items: [
        { emoji: '🚀', name: 'Airdrop Channel', sub: 'UPDATES' },
        { emoji: '🌐', name: 'Airdrop Community', sub: 'JOIN GROUP' },
      ],
    },
  ];

  return (
    <>
      <Head>
        <title>ZenithTraderQX — Trading Tools &amp; Signal Hub</title>
        <meta name="description" content="All trading tools, signals, bots, and community for serious traders." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><text y='28' font-size='28'>⚡</text></svg>" />
      </Head>

      <style>{`
        @keyframes scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.3; transform: scale(0.8); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Canvas layers ── */}
      <CandleBackground />
      <WaveLine />

      {/* ── Dark overlay ── */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2,
        background: 'linear-gradient(180deg, rgba(6,15,24,0.82) 0%, rgba(6,15,24,0.60) 50%, rgba(6,15,24,0.75) 100%)',
        pointerEvents: 'none',
      }} />

      {/* ── Page content ── */}
      <div style={{
        position: 'relative',
        zIndex: 3,
        maxWidth: '480px',
        margin: '0 auto',
        padding: '20px 16px 36px',
        animation: 'fadeIn 0.6s ease both',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px', paddingTop: '10px' }}>
          <div style={{
            fontFamily: 'Orbitron, sans-serif',
            fontWeight: 900,
            fontSize: '30px',
            color: '#00e87a',
            textShadow: '0 0 24px #00ff8866, 0 0 48px #00ff8822',
            letterSpacing: '1px',
            lineHeight: 1.1,
          }}>⚡ ZENITHTRADERQX</div>
          <div style={{
            fontSize: '11px',
            letterSpacing: '4px',
            color: '#00a854',
            textTransform: 'uppercase',
            marginTop: '8px',
          }}>ALL TRADING TOOLS &amp; SIGNAL HUB</div>
        </div>

        {/* Ticker */}
        <TickerBar />

        {/* Stats */}
        <StatsRow />

        {/* Sections */}
        {sections.map((sec, i) => (
          <Section key={i} icon={sec.icon} title={sec.title} items={sec.items} />
        ))}

        {/* Footer */}
        <div style={{
          borderTop: '1px solid #00ff8810',
          paddingTop: '18px',
          textAlign: 'center',
          fontSize: '10px',
          letterSpacing: '2px',
          color: '#2a5a3a',
          textTransform: 'uppercase',
        }}>
          ⚡ POWERED BY{' '}
          <span style={{ color: '#00a854' }}>ZENITH TRADER</span>
          {' · ALL RIGHTS RESERVED'}
        </div>
      </div>
    </>
  );
            }
          
