import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'motion/react'
import { ArrowRight, Crosshair, ScanFace } from 'lucide-react'
import { ScreenFrame, SAFE_BOTTOM, SAFE_TOP } from '../shell/ScreenFrame'
import { useScreen } from '../shell/screenContext'
import { useFacet, type GlassesId } from '../store'
import { FaceView } from '../three/FaceView'
import { Button } from '../ui/Button'
import { PageDots } from '../ui/PageDots'
import { usePointerDrag } from '../lib/usePointerDrag'
import { springs } from '../lib/utils'
import { Brackets, GlassChip, PrivacyLine } from './parts1/Decor'
import { FrameGlyph } from './parts1/FrameGlyph'

const SLIDES = [
  {
    title: 'Your face,\nprecisely measured',
    body: 'A 30-second scan maps 468 points in 3D: shape, proportions and symmetry.',
  },
  {
    title: 'Proportions that\nguide every choice',
    body: 'Thirds, ratios and the golden section become advice you can actually use.',
  },
  {
    title: 'Try it on\nbefore you change',
    body: 'Preview frames, brows and hair on your own 3D face, then keep what works.',
  },
] as const

const CYCLE: GlassesId[] = ['wayfarer', 'round', 'aviator', 'cateye']

/** Slide visuals. Only the visible slide mounts a 3D view. */
function Visual({ index }: { index: number }) {
  const look = useFacet((s) => s.look)
  const [scan, setScan] = useState(0)
  const [frame, setFrame] = useState(0)

  // slide a: looping scan sweep
  useEffect(() => {
    if (index !== 0) return
    const c = animate(0, 100, { duration: 3.2, repeat: Infinity, repeatDelay: 0.8, ease: 'linear', onUpdate: (v) => setScan(Math.round(v)) })
    return () => c.stop()
  }, [index])

  // slide c: frames swap every 1.6 s
  useEffect(() => {
    if (index !== 2) return
    const t = window.setInterval(() => setFrame((f) => (f + 1) % CYCLE.length), 1600)
    return () => window.clearInterval(t)
  }, [index])

  if (index === 0)
    return (
      <div className="absolute inset-0">
        <FaceView subject="face" material="thermal" landmarks scan={scan} autoRotate framing="head" className="absolute inset-x-6 inset-y-2" />
        <Brackets className="inset-x-[72px] inset-y-[40px]" size={20} />
        <GlassChip icon={<ScanFace size={13} />} className="absolute left-0 top-1">
          468 landmarks
        </GlassChip>
        <GlassChip icon={<Crosshair size={13} />} className="absolute bottom-1 right-0">
          ±0.4 mm
        </GlassChip>
      </div>
    )

  if (index === 1)
    return (
      <div className="absolute inset-0">
        <FaceView subject="face" material="skin" overlays={{ thirds: true, golden: true }} framing="head" className="absolute inset-x-6 inset-y-2" />
        <motion.div
          className="glass glass-frost absolute bottom-5 left-5 w-[150px] rounded-[20px] p-3"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, ...springs.soft }}
        >
          <span className="label relative z-[3] block">Facial thirds</span>
          <span className="display tabular relative z-[3] mt-1 block text-[20px] leading-none">32 · 34 · 34</span>
          <span className="relative z-[3] mt-2.5 flex h-1.5 gap-1">
            {[32, 34, 34].map((v, i) => (
              <motion.span
                key={i}
                className="rounded-full"
                style={{ background: i === 1 ? 'var(--lilac)' : 'rgb(244 239 234 / 0.35)' }}
                initial={{ flexGrow: 0.001 }}
                animate={{ flexGrow: v }}
                transition={{ delay: 0.5 + i * 0.1, ...springs.soft }}
              />
            ))}
          </span>
        </motion.div>
        <GlassChip className="absolute right-5 top-6">φ 1.618</GlassChip>
      </div>
    )

  return (
    <div className="absolute inset-0">
      <FaceView subject="face" material="skin" accessories look={{ ...look, glasses: CYCLE[frame] }} framing="face" className="absolute inset-x-6 inset-y-2" />
      <div className="glass glass-pill absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-1 rounded-full p-1">
        {CYCLE.map((g, i) => (
          <span key={g} className="relative z-[3] grid h-9 w-11 place-items-center rounded-full">
            {i === frame && <motion.span layoutId="ob-frame" className="absolute inset-0 rounded-full bg-white/14" transition={springs.snappy} />}
            <FrameGlyph id={g} className={i === frame ? 'relative text-[var(--text)]' : 'relative text-[var(--text-3)]'} />
          </span>
        ))}
      </div>
    </div>
  )
}

/** 02 — Onboarding: three swipeable value slides, privacy promise, single pinned CTA. */
export function OnboardingScreen() {
  const { go } = useScreen()
  const index = useFacet((s) => s.onboardingSlide)
  const setSlide = useFacet((s) => s.setSlide)
  const [dir, setDir] = useState<1 | -1>(1)

  const select = (i: number) => {
    const n = Math.max(0, Math.min(SLIDES.length - 1, i))
    if (n === index) return
    setDir(n > index ? 1 : -1)
    setSlide(n)
  }

  /* swipe: content follows the finger (rubber-banded at the ends), then snaps */
  const dx = useMotionValue(0)
  const start = useRef(0)
  const tilt = useTransform(dx, [-200, 0, 200], [-4, 0, 4])
  const drag = usePointerDrag<HTMLDivElement>((p) => {
    const x = p.event.clientX
    if (p.phase === 'start') start.current = x
    const d = x - start.current
    const edge = (index === 0 && d > 0) || (index === SLIDES.length - 1 && d < 0)
    if (p.phase === 'move') dx.set(edge ? d * 0.25 : d * 0.6)
    if (p.phase === 'end') {
      if (d < -48) select(index + 1)
      else if (d > 48) select(index - 1)
      animate(dx, 0, springs.soft)
    }
  })

  const slide = SLIDES[index]
  const last = index === SLIDES.length - 1

  return (
    <ScreenFrame>
      {/* top bar */}
      <div className="absolute inset-x-5 flex h-11 items-center justify-between" style={{ top: SAFE_TOP }}>
        <span className="display text-[20px] italic">
          facet<span className="not-italic text-[var(--lilac)]">.</span>
        </span>
        <button type="button" onClick={() => go('goals')} className="-mr-3 h-11 cursor-pointer rounded-full px-3 text-[14px] font-semibold text-[var(--text-2)] outline-none hover:text-[var(--text)]">
          Skip
        </button>
      </div>

      {/* carousel */}
      <div
        ref={drag.ref}
        onPointerDown={(e) => {
          // pager dots handle their own taps (pointer capture would swallow the click)
          if ((e.target as HTMLElement).closest('button')) return
          drag.onPointerDown(e)
        }}
        role="region"
        aria-roledescription="carousel"
        aria-label={`Slide ${index + 1} of ${SLIDES.length}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') select(index + 1)
          if (e.key === 'ArrowLeft') select(index - 1)
        }}
        className="absolute inset-x-0 cursor-grab touch-pan-y outline-none active:cursor-grabbing"
        style={{ top: SAFE_TOP + 48, height: 404 }}
      >
        <motion.div className="absolute inset-x-5 top-0 h-[360px]" style={{ x: dx, rotateY: tilt }}>
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.div
              key={index}
              custom={dir}
              className="absolute inset-0"
              initial={{ x: dir * 120, opacity: 0, filter: 'blur(6px)' }}
              animate={{ x: 0, opacity: 1, filter: 'blur(0px)' }}
              exit={{ x: dir * -120, opacity: 0, filter: 'blur(6px)' }}
              transition={springs.soft}
            >
              <Visual index={index} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
        <div className="absolute inset-x-0 bottom-0 flex justify-center">
          <PageDots count={SLIDES.length} index={index} onSelect={select} labels={SLIDES.map((s) => s.title.replace('\n', ' '))} />
        </div>
      </div>

      {/* copy */}
      <div className="absolute inset-x-5" style={{ top: SAFE_TOP + 460 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            aria-live="polite"
          >
            <h2 className="display whitespace-pre-line text-[32px] font-normal leading-[1.08]">{slide.title}</h2>
            <p className="mt-3 max-w-[330px] text-[16px] leading-[1.5] text-[var(--text-2)]">{slide.body}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* actions */}
      <div className="absolute inset-x-5 flex flex-col items-stretch" style={{ bottom: SAFE_BOTTOM + 4 }}>
        <PrivacyLine className="mb-4 px-2" />
        <Button onClick={() => (last ? go('goals') : select(index + 1))} icon={<ArrowRight size={18} />}>
          {last ? 'Get started' : 'Continue'}
        </Button>
        <Button variant="ghost" size="md" className="mt-0.5" onClick={() => useFacet.getState().toast({ title: 'Sign in', detail: 'Accounts arrive in the next build' })}>
          I already have an account
        </Button>
      </div>
    </ScreenFrame>
  )
}
