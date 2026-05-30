interface Props {
  width: number
  height: number
  complexity?: number
  opacity?: number
}

export function GuillochePattern({ width, height, complexity = 3, opacity = 0.6 }: Props) {
  const paths = []
  for (let i = 0; i < complexity * 4; i++) {
    const phase = (i / (complexity * 4)) * Math.PI * 2
    const amplitude = 3 + (i % 3)
    const frequency = 0.05 + (i % 5) * 0.01
    let d = `M 0 ${height / 2}`
    for (let x = 0; x <= width; x += 2) {
      const y =
        height / 2 +
        amplitude * Math.sin(frequency * x + phase) +
        amplitude * 0.5 * Math.sin(frequency * 2.3 * x + phase * 1.7)
      d += ` L ${x} ${y}`
    }
    paths.push(
      <path key={i} d={d} stroke="#0a0a0a" strokeWidth="0.4" fill="none" opacity={opacity} />
    )
  }
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {paths}
    </svg>
  )
}

export function CornerOrnament({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M0 0 L24 0 L24 4 L4 4 L4 24 L0 24 Z" fill="#0a0a0a" />
      <path d="M0 0 L8 0 L8 2 L2 2 L2 8 L0 8 Z" fill="#0a0a0a" />
      <circle cx="6" cy="6" r="2" fill="none" stroke="#0a0a0a" strokeWidth="0.8" />
      <circle cx="6" cy="6" r="0.8" fill="#0a0a0a" />
    </svg>
  )
}

export function PageNumberFrame({ page }: { page?: number }) {
  const w = 80
  const h = 28
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 4 }}>
      <svg width={w} height={h}>
        <rect x="1" y="1" width={w - 2} height={h - 2} fill="none" stroke="#0a0a0a" strokeWidth="0.8" />
        <GuillochePattern width={w} height={h} complexity={2} opacity={0.4} />
        <text
          x={w / 2}
          y={h / 2 + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="'PT Mono', monospace"
          fontSize="11"
          fill="#0a0a0a"
        >
          ❮ {page ?? 1} ❯
        </text>
      </svg>
    </div>
  )
}
