const sparkles = [
  { t: '5%', l: '15%', d: '0s' }, { t: '10%', l: '80%', d: '0.5s' }, { t: '22%', l: '45%', d: '1s' },
  { t: '35%', l: '92%', d: '0.3s' }, { t: '48%', l: '8%', d: '1.5s' }, { t: '55%', l: '70%', d: '0.8s' },
  { t: '68%', l: '25%', d: '1.2s' }, { t: '78%', l: '55%', d: '0.2s' }, { t: '85%', l: '85%', d: '0.9s' },
  { t: '15%', l: '60%', d: '1.8s' }, { t: '60%', l: '40%', d: '0.6s' }, { t: '92%', l: '30%', d: '1.3s' },
]

const largeSparkles = [
  { t: '18%', l: '75%', d: '0s', s: 6 }, { t: '45%', l: '20%', d: '1s', s: 5 },
  { t: '72%', l: '60%', d: '0.7s', s: 4 }, { t: '90%', l: '10%', d: '1.5s', s: 5 },
]

const emojis = [
  { className: 'animate-float-slow', t: '12%', l: '6%', emoji: '🌙', size: 'text-2xl', o: 30 },
  { className: 'animate-float', t: '8%', l: '10%', emoji: '✨', size: 'text-xl', o: 25 },
  { className: 'animate-float-delayed', t: '25%', l: '4%', emoji: '🌟', size: 'text-lg', o: 20 },
  { className: 'animate-float-slower', t: '40%', l: '3%', emoji: '🔮', size: 'text-3xl', o: 15 },
  { className: 'animate-float', t: '30%', l: '5%', emoji: '🕯️', size: 'text-2xl', o: 20 },
  { className: 'animate-float-slow', t: '15%', l: '8%', emoji: '🦋', size: 'text-xl', o: 25 },
  { className: 'animate-float-delayed', t: '60%', l: '12%', emoji: '🌿', size: 'text-lg', o: 15 },
]

export function AnimatedBackground() {
  return (
    <>
      <div className="fixed inset-0 animate-gradient bg-gradient-to-br from-indigo-950 via-purple-950 via-40% to-indigo-950 -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15),transparent_70%)] -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.1),transparent_60%)] -z-10" />

      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-5" aria-hidden>
        {emojis.map((e, i) => (
          <span
            key={i}
            className={`absolute ${e.className} ${e.size}`}
            style={{ top: e.t, left: e.l, opacity: e.o / 100 }}
          >{e.emoji}</span>
        ))}
      </div>

      <div className="fixed inset-0 pointer-events-none -z-5" aria-hidden>
        {sparkles.map((s, i) => (
          <span
            key={i}
            className="absolute w-1 h-1 rounded-full bg-purple-300 animate-twinkle"
            style={{ top: s.t, left: s.l, animationDelay: s.d, opacity: 0.4 }}
          />
        ))}
        {largeSparkles.map((s, i) => (
          <span
            key={i + 12}
            className="absolute rounded-full bg-purple-400 animate-twinkle"
            style={{ top: s.t, left: s.l, width: s.s, height: s.s, animationDelay: s.d, boxShadow: '0 0 6px #a78bfa' }}
          />
        ))}
      </div>
    </>
  )
}
