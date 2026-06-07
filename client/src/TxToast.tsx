import { useState, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface TxToastItem { id: string; hash: string }

// ── Helpers ───────────────────────────────────────────────────────────────────
function randomTxHash(): string {
  const hex = '0123456789abcdef'
  return '0x' + Array.from({ length: 64 }, () => hex[Math.floor(Math.random() * 16)]).join('')
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useTxToast() {
  const [toasts, setToasts] = useState<TxToastItem[]>([])

  const fire = useCallback(() => {
    const id   = Math.random().toString(36).slice(2)
    const hash = randomTxHash()
    setToasts(prev => [...prev, { id, hash }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  return { toasts, fire }
}

// ── Styles ────────────────────────────────────────────────────────────────────
export const TX_TOAST_STYLES = `
@keyframes tx-slide-in {
  from { transform: translateX(120%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
@keyframes tx-fade-out {
  0%   { opacity: 1; }
  80%  { opacity: 1; }
  100% { opacity: 0; }
}
.tx-toast-item {
  animation: tx-slide-in 0.35s cubic-bezier(0.22,1,0.36,1) both,
             tx-fade-out 3.5s linear both;
  pointer-events: none;
}
`

// ── Container ─────────────────────────────────────────────────────────────────
export function TxToastContainer({ toasts }: { toasts: TxToastItem[] }) {
  if (toasts.length === 0) return null
  return (
    <div style={{
      position: 'fixed', top: 80, right: 20, zIndex: 99999,
      display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} className="tx-toast-item" style={{
          background: 'linear-gradient(135deg, #0d3d1a 0%, #0a2e14 100%)',
          border: '1.5px solid #22c55e',
          borderRadius: 10,
          padding: '10px 14px',
          minWidth: 240,
          boxShadow: '0 4px 24px rgba(34,197,94,0.25), 0 2px 8px rgba(0,0,0,0.5)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>✓</div>
            <span style={{ color: '#4ade80', fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>
              TX SUCCESS
            </span>
          </div>
          <div style={{
            fontFamily: 'monospace', fontSize: 9, color: '#6ee7b7',
            opacity: 0.8, wordBreak: 'break-all', lineHeight: 1.4,
          }}>
            {t.hash.slice(0, 22)}...{t.hash.slice(-8)}
          </div>
        </div>
      ))}
    </div>
  )
}
