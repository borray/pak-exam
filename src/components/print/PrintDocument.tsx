import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'
import { QRCodeSVG } from 'qrcode.react'
import { GuillochePattern, CornerOrnament, PageNumberFrame } from '../GuillochePattern'
import type { Exam, Participant, Question } from '../../types'
import { formatDate } from '../../utils'

interface Props {
  exam: Exam
  participant?: Participant
  showAnswers?: boolean
}

const LETTERS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З']

function Barcode({ value }: { value: string }) {
  const ref = useRef<SVGSVGElement>(null)
  useEffect(() => {
    if (ref.current) {
      JsBarcode(ref.current, value, {
        format: 'CODE128',
        width: 1.2,
        height: 32,
        displayValue: false,
        margin: 0,
      })
    }
  }, [value])
  return <svg ref={ref} />
}

function QuestionBlock({ q, index }: { q: Question; index: number }) {
  return (
    <div style={{ marginBottom: 14, pageBreakInside: 'avoid' }}>
      <div style={{ fontFamily: "'PT Serif', serif", fontSize: 11, marginBottom: 4 }}>
        <strong>{index + 1}.</strong>{' '}
        {q.text || <em style={{ color: '#999' }}>Текст вопроса...</em>}
        {' '}
        <span style={{ fontFamily: "'PT Mono', monospace", fontSize: 9, color: '#6b6b6b' }}>
          [{q.points} б.]
        </span>
      </div>
      {q.image && (
        <img src={q.image} alt="" style={{ maxWidth: 200, maxHeight: 120, marginBottom: 4, display: 'block' }} />
      )}
      {q.type === 'single' || q.type === 'multi' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 16px', paddingLeft: 12 }}>
          {q.options.map((opt, i) => (
            <div key={i} style={{ fontFamily: "'PT Serif', serif", fontSize: 10, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
              <span style={{ border: '1px solid #0a0a0a', width: 10, height: 10, display: 'inline-block', flexShrink: 0, marginTop: 1 }} />
              <span>{LETTERS[i]}) {opt || '...'}</span>
            </div>
          ))}
        </div>
      ) : q.type === 'open' ? (
        <div style={{ paddingLeft: 12 }}>
          <div style={{ borderBottom: '0.5px solid #0a0a0a', marginBottom: 3, height: 16 }} />
          <div style={{ borderBottom: '0.5px solid #0a0a0a', height: 16 }} />
        </div>
      ) : q.type === 'match' ? (
        <div style={{ paddingLeft: 12, fontSize: 10, fontFamily: "'PT Serif', serif" }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <div style={{ fontWeight: 'bold', fontSize: 9, marginBottom: 2 }}>Левый столбец</div>
            <div style={{ fontWeight: 'bold', fontSize: 9, marginBottom: 2 }}>Правый столбец</div>
            {q.pairs.map((p, i) => (
              <>
                <div key={`l${i}`} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span style={{ fontFamily: "'PT Mono', monospace", fontSize: 9 }}>{i + 1}.</span>
                  <span>{p.left || '...'}</span>
                </div>
                <div key={`r${i}`} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span style={{ fontFamily: "'PT Mono', monospace", fontSize: 9 }}>{LETTERS[i]}.</span>
                  <span>{p.right || '...'}</span>
                </div>
              </>
            ))}
          </div>
          <div style={{ marginTop: 4, display: 'flex', gap: 8 }}>
            {q.pairs.map((_, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontFamily: "'PT Mono', monospace", fontSize: 9 }}>{i + 1}</span>
                <div style={{ border: '0.5px solid #0a0a0a', width: 20, height: 14 }} />
              </div>
            ))}
          </div>
        </div>
      ) : q.type === 'fillblank' ? (
        <div style={{ paddingLeft: 12, fontFamily: "'PT Serif', serif", fontSize: 10 }}>
          <div>
            {q.template.split('___').map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span style={{ borderBottom: '0.5px solid #0a0a0a', display: 'inline-block', width: 60 }}>&nbsp;</span>
                )}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function PrintDocument({ exam, participant, showAnswers = false }: Props) {
  const qrData = participant
    ? JSON.stringify({
        participant: participant.id,
        exam: exam.id,
        issued: participant.issuedAt,
      })
    : JSON.stringify({ exam: exam.id })

  const barcodeValue = participant?.id ?? exam.id
  const dateStr = participant ? formatDate(participant.issuedAt) : formatDate(exam.createdAt)

  // A4: 210mm × 297mm at 96dpi → ~794px × 1123px
  const A4_W = 794
  const A4_H = 1123
  const MARGIN = 56 // ~15mm
  const INNER_W = A4_W - MARGIN * 2

  return (
    <div
      id="print-document"
      style={{
        width: A4_W,
        minHeight: A4_H,
        background: '#fafaf8',
        position: 'relative',
        fontFamily: "'PT Serif', serif",
        overflow: 'hidden',
      }}
    >
      {/* Watermark */}
      <svg
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        viewBox={`0 0 ${A4_W} ${A4_H}`}
      >
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="'Playfair Display', serif"
          fontSize="72"
          fill="#0a0a0a"
          opacity="0.05"
          transform={`rotate(-35, ${A4_W / 2}, ${A4_H / 2})`}
        >
          {exam.institution}
        </text>
      </svg>

      {/* Outer double border */}
      <div style={{
        position: 'absolute', inset: 8,
        border: '2px solid #0a0a0a',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 13,
        border: '0.5px solid #0a0a0a',
        pointerEvents: 'none',
      }} />

      {/* Corner ornaments */}
      <div style={{ position: 'absolute', top: 8, left: 8 }}><CornerOrnament size={28} /></div>
      <div style={{ position: 'absolute', top: 8, right: 8, transform: 'scaleX(-1)' }}><CornerOrnament size={28} /></div>
      <div style={{ position: 'absolute', bottom: 8, left: 8, transform: 'scaleY(-1)' }}><CornerOrnament size={28} /></div>
      <div style={{ position: 'absolute', bottom: 8, right: 8, transform: 'scale(-1)' }}><CornerOrnament size={28} /></div>

      {/* Content area */}
      <div style={{ padding: `${MARGIN}px`, position: 'relative' }}>

        {/* Header guilloche top */}
        <div style={{ marginBottom: 8, marginLeft: -8, marginRight: -8 }}>
          <GuillochePattern width={INNER_W + 16} height={18} complexity={4} />
        </div>

        {/* Institution header */}
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#0a0a0a',
          }}>
            {exam.institution}
          </div>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginTop: 4,
            color: '#0a0a0a',
          }}>
            Экзаменационный билет
          </div>
          <div style={{ fontFamily: "'PT Serif', serif", fontSize: 11, marginTop: 4, color: '#3a3a3a' }}>
            Предмет: <strong>{exam.subject}</strong>
            &nbsp;&nbsp;|&nbsp;&nbsp;
            Вариант: <strong>{exam.variant}</strong>
            &nbsp;&nbsp;|&nbsp;&nbsp;
            <span style={{ fontFamily: "'PT Mono', monospace" }}>Код: {exam.id}</span>
          </div>
          {exam.author && (
            <div style={{ fontFamily: "'PT Serif', serif", fontSize: 10, color: '#6b6b6b', marginTop: 2 }}>
              Составитель: {exam.author}
            </div>
          )}
        </div>

        {/* Header guilloche divider */}
        <div style={{ marginBottom: 8, marginLeft: -8, marginRight: -8 }}>
          <GuillochePattern width={INNER_W + 16} height={14} complexity={3} />
        </div>

        {/* Participant block */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 8, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            {/* Barcode */}
            <div style={{ marginBottom: 4 }}>
              <Barcode value={barcodeValue} />
            </div>
            <div style={{ fontFamily: "'PT Mono', monospace", fontSize: 10, marginBottom: 6, color: '#0a0a0a' }}>
              {barcodeValue}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, fontFamily: "'PT Serif', serif", fontSize: 10 }}>
                <span style={{ whiteSpace: 'nowrap' }}>ФИО:</span>
                <div style={{ flex: 1, borderBottom: '0.5px solid #0a0a0a', paddingBottom: 1 }}>
                  {participant?.fullName ?? ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, fontFamily: "'PT Serif', serif", fontSize: 10, flex: 1 }}>
                  <span style={{ whiteSpace: 'nowrap' }}>Группа/Класс:</span>
                  <div style={{ flex: 1, borderBottom: '0.5px solid #0a0a0a', paddingBottom: 1 }}>
                    {participant?.groupClass ?? ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, fontFamily: "'PT Serif', serif", fontSize: 10 }}>
                  <span style={{ whiteSpace: 'nowrap' }}>Дата:</span>
                  <div style={{ minWidth: 70, borderBottom: '0.5px solid #0a0a0a', paddingBottom: 1 }}>
                    {dateStr}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* QR code */}
          <div style={{ border: '1px solid #0a0a0a', padding: 4, flexShrink: 0 }}>
            <QRCodeSVG value={qrData} size={72} level="M" />
          </div>
        </div>

        {/* Separator */}
        <div style={{ borderTop: '1px solid #0a0a0a', marginBottom: 10 }} />

        {/* Questions */}
        {(showAnswers ? exam.questions : exam.questions).map((q, i) => (
          <QuestionBlock key={q.id} q={q} index={i} />
        ))}

        {/* Bottom guilloche */}
        <div style={{ marginTop: 12, marginLeft: -8, marginRight: -8 }}>
          <GuillochePattern width={INNER_W + 16} height={14} complexity={3} />
        </div>

        {/* Page number */}
        <PageNumberFrame page={1} />
      </div>
    </div>
  )
}
