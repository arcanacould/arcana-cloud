const STYLE_ID = 'landing-animations'

const styles = `
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  33% { transform: translateY(-18px) rotate(3deg); }
  66% { transform: translateY(-8px) rotate(-2deg); }
}
@keyframes float-slow {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-24px) rotate(5deg); }
}
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.3); }
  50% { box-shadow: 0 0 40px rgba(99,102,241,0.6), 0 0 80px rgba(99,102,241,0.2); }
}
@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}
@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
.animate-float { animation: float 6s ease-in-out infinite; }
.animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
.animate-float-delayed { animation: float 6s ease-in-out 2s infinite; }
.animate-float-slower { animation: float 9s ease-in-out 1s infinite; }
.animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
.animate-twinkle { animation: twinkle 3s ease-in-out infinite; }
.animate-twinkle-delayed { animation: twinkle 3s ease-in-out 1.5s infinite; }
.animate-twinkle-slow { animation: twinkle 4s ease-in-out 0.7s infinite; }
.animate-gradient { background-size: 200% 200%; animation: gradient-shift 12s ease infinite; }
.animate-shimmer { background-size: 200% 100%; animation: shimmer 3s linear infinite; }
.reveal-up { opacity: 0; transform: translateY(40px); transition: opacity 0.8s ease-out, transform 0.8s ease-out; }
.reveal-up.revealed { opacity: 1; transform: translateY(0); }
.reveal-up:nth-child(2) { transition-delay: 0.15s; }
.reveal-up:nth-child(3) { transition-delay: 0.3s; }
.card-hover { transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease, border-color 0.35s ease; }
.card-hover:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 20px 60px rgba(99,102,241,0.25); border-color: rgba(99,102,241,0.4); }
.btn-shine { position: relative; overflow: hidden; }
.btn-shine::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent); background-size: 200% 100%; animation: shimmer 2.5s linear infinite; }
@media (prefers-reduced-motion: reduce) {
  .animate-float, .animate-float-slow, .animate-float-delayed, .animate-float-slower,
  .animate-twinkle, .animate-twinkle-delayed, .animate-twinkle-slow,
  .animate-pulse-glow, .animate-gradient, .animate-shimmer { animation: none !important; }
  .reveal-up { opacity: 1 !important; transform: none !important; }
  .card-hover:hover { transform: none !important; }
}
`

export function LandingAnimations() {
  if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
    const sheet = document.createElement('style')
    sheet.id = STYLE_ID
    sheet.textContent = styles
    document.head.appendChild(sheet)
  }
  return null
}
