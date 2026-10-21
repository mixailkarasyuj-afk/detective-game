// Комиссар Громов — ведущий дела: зачитывает сводки и ворчит на решения команды.

export function CommissarAvatar({ size = 72 }: { size?: number }) {
  return (
    <svg className="commissar-avatar" width={size} height={size} viewBox="0 0 80 80" aria-hidden="true">
      <circle cx={40} cy={40} r={40} className="portrait-bg" />
      <path d="M12 80c3-16 13-24 28-24s25 8 28 24z" fill="#2c3a55" />
      <path d="M32 56l8 10 8-10" fill="#e9e2cf" />
      <circle cx={40} cy={38} r={14} fill="#e4b48c" />
      <path d="M24 30c0-10 7-15 16-15s16 5 16 15z" fill="#22304a" />
      <path d="M22 30h36l-3 4H25z" fill="#16203a" />
      <circle cx={40} cy={22} r={2.4} fill="#d9a441" />
      <path d="M28 46c4-4 8-4 12-1 4-3 8-3 12 1-4 1-8 1-12-1-4 2-8 2-12 1z" fill="#6b4a2f" />
      <circle cx={35} cy={38} r={1.3} fill="#1d1f24" />
      <circle cx={45} cy={38} r={1.3} fill="#1d1f24" />
      <path d="M33 34h5M42 34h5" stroke="#4a3626" strokeWidth={1.6} strokeLinecap="round" />
      <g transform="translate(58 58)">
        <path d="M0 0h12l-1.5 10H1.5z" fill="#efe8d8" />
        <path d="M12 3a3 3 0 0 1 0 5" fill="none" stroke="#efe8d8" strokeWidth={1.6} />
        <path className="steam" d="M4 -3q-2 -3 0 -6M8 -3q-2 -3 0 -6" fill="none" stroke="#c8c2b4" strokeWidth={1} />
      </g>
    </svg>
  )
}

export function CommissarSays({ text }: { text: string }) {
  return (
    <div className="commissar">
      <CommissarAvatar />
      <div className="speech" key={text}>
        <span className="speaker">Комиссар Громов</span>
        <p>{text}</p>
      </div>
    </div>
  )
}
