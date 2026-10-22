import { useCallback, useEffect, useRef, useState } from 'react'

/* Minimal Web Speech API typings (not in lib.dom for every TS target). */
interface SpeechResultLike {
  isFinal: boolean
  0: { transcript: string }
}
interface SpeechEventLike {
  resultIndex: number
  results: ArrayLike<SpeechResultLike>
}
interface RecognitionLike {
  lang: string
  interimResults: boolean
  continuous: boolean
  maxAlternatives: number
  onresult: ((e: SpeechEventLike) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}
type RecognitionCtor = new () => RecognitionLike

const getCtor = (): RecognitionCtor | undefined => {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export const speechSupported = () => !!getCtor()

const pickLang = () => {
  const n = (typeof navigator !== 'undefined' && navigator.language) || 'en-US'
  if (n.startsWith('pt')) return 'pt-BR'
  if (n.startsWith('es')) return 'es-ES'
  return n
}

export interface SpeechApi {
  supported: boolean
  listening: boolean
  interim: string
  /** Live mic level 0..1, updated every frame while listening (read in rAF). */
  level: React.MutableRefObject<number>
  start: () => void
  stop: () => void
  error: string | null
}

/**
 * Voice input: Web Speech recognition + a microphone analyser for a live waveform.
 * `onFinal` receives the final transcript.
 */
export function useSpeech(onFinal: (text: string) => void): SpeechApi {
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)
  const level = useRef(0)
  const rec = useRef<RecognitionLike | null>(null)
  const audio = useRef<{ ctx: AudioContext; stream: MediaStream; raf: number } | null>(null)
  const final = useRef(onFinal)
  final.current = onFinal

  const stopAudio = () => {
    const a = audio.current
    if (!a) return
    cancelAnimationFrame(a.raf)
    a.stream.getTracks().forEach((t) => t.stop())
    a.ctx.close().catch(() => {})
    audio.current = null
    level.current = 0
  }

  const startAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const ctx = new AudioContext()
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      src.connect(analyser)
      const buf = new Uint8Array(analyser.fftSize)
      const loop = () => {
        analyser.getByteTimeDomainData(buf)
        let sum = 0
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128
          sum += v * v
        }
        const rms = Math.sqrt(sum / buf.length)
        level.current = level.current * 0.6 + Math.min(1, rms * 4) * 0.4
        if (audio.current) audio.current.raf = requestAnimationFrame(loop)
      }
      audio.current = { ctx, stream, raf: requestAnimationFrame(loop) }
    } catch {
      // Recognition can still work without the analyser — waveform falls back to a synthetic idle wave.
    }
  }

  const stop = useCallback(() => {
    rec.current?.stop()
  }, [])

  const start = useCallback(() => {
    const Ctor = getCtor()
    if (!Ctor) {
      setError('unsupported')
      return
    }
    if (rec.current) return
    setError(null)
    setInterim('')
    const r = new Ctor()
    r.lang = pickLang()
    r.interimResults = true
    r.continuous = false
    r.maxAlternatives = 1
    let finalText = ''
    r.onresult = (e) => {
      let live = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i]
        if (res.isFinal) finalText += res[0].transcript
        else live += res[0].transcript
      }
      setInterim((finalText + ' ' + live).trim())
    }
    r.onerror = (e) => setError(e.error === 'not-allowed' ? 'denied' : e.error)
    r.onend = () => {
      rec.current = null
      setListening(false)
      setInterim('')
      stopAudio()
      if (finalText.trim()) final.current(finalText.trim())
    }
    rec.current = r
    try {
      r.start()
      setListening(true)
      void startAudio()
    } catch {
      rec.current = null
      setError('unavailable')
    }
  }, [])

  useEffect(
    () => () => {
      rec.current?.abort()
      stopAudio()
    },
    [],
  )

  return { supported: speechSupported(), listening, interim, level, start, stop, error }
}
