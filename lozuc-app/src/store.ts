import { create } from 'zustand'

/* ──────────────────────────────────────────────────────────────
   lozuc — one store for the whole journey (Mapa de Entregas v1).
   Six stages, eight deliveries (LZ-01…LZ-08). Every screen reads and
   writes here, so the board, the prototype, the phone and the web app
   stay in sync. Sample client content is illustrative.

   Product rules encoded below (do not break in the UI):
   - no beauty score, ranking or percentile;
   - every observation says whether it was OBSERVED in the photo,
     INFORMED by the client, or is UNCERTAIN (capture can't support it);
   - simulations only change hair, beard, brows and their tones;
   - skincare is cosmetic education, never diagnosis or prescription.
   ────────────────────────────────────────────────────────────── */

/* ── screens & journey ─────────────────────────────────────── */

export type ScreenId =
  | 'welcome'
  | 'profile'
  | 'consent'
  | 'capture'
  | 'processing'
  | 'reading'
  | 'paywall'
  | 'directions'
  | 'simulation'
  | 'guide'
  | 'routine'
  | 'plan'
  | 'home'
  | 'personal'
  | 'evolution'
  | 'settings'

export interface Stage {
  n: number
  id: string
  title: string
  screens: ScreenId[]
}

/** The six stages of the journey (Mapa de Entregas, p. 8). */
export const STAGES: Stage[] = [
  { n: 1, id: 'conhecer', title: 'Conhecer o homem', screens: ['welcome', 'profile'] },
  { n: 2, id: 'imagens', title: 'Receber boas imagens', screens: ['consent', 'capture', 'processing'] },
  { n: 3, id: 'ler', title: 'Ler e priorizar', screens: ['reading', 'paywall'] },
  { n: 4, id: 'escolher', title: 'Escolher e visualizar', screens: ['directions', 'simulation'] },
  { n: 5, id: 'executar', title: 'Executar e cuidar', screens: ['guide', 'routine', 'plan'] },
  { n: 6, id: 'acompanhar', title: 'Acompanhar e ajustar', screens: ['home', 'personal', 'evolution', 'settings'] },
]

export const SCREENS: { id: ScreenId; title: string; lz?: string; note: string }[] = [
  { id: 'welcome', title: 'Boas-vindas', note: 'Marca + promessa em 3 passos' },
  { id: 'profile', title: 'Seu perfil', note: 'Preferências declaradas, não inferidas' },
  { id: 'consent', title: 'Privacidade e câmera', note: 'Consentimento biométrico + primer' },
  { id: 'capture', title: 'Captura guiada', note: 'Frente, perfil e ¾ com checagens' },
  { id: 'processing', title: 'Lendo seu rosto', note: 'Etapas reais, sem relógio falso' },
  { id: 'reading', title: 'Leitura do rosto', lz: 'LZ-01', note: 'Mapa por região e prioridades' },
  { id: 'paywall', title: 'Plano lozuc', note: 'Depois de entregar valor' },
  { id: 'directions', title: 'Direções', lz: 'LZ-02', note: 'Até 3 alternativas viáveis' },
  { id: 'simulation', title: 'Simulação', lz: 'LZ-03', note: 'Original × simulação, no seu rosto' },
  { id: 'guide', title: 'Guia de execução', lz: 'LZ-04', note: 'Para você e para o barbeiro' },
  { id: 'routine', title: 'Rotina de pele', lz: 'LZ-05', note: 'Manhã e noite, com finalidade' },
  { id: 'plan', title: 'Prioridades', lz: 'LZ-06', note: 'Agora · depende · reavaliar' },
  { id: 'home', title: 'Hoje', note: 'Próxima ação e rotina do dia' },
  { id: 'personal', title: 'Personal', lz: 'LZ-07', note: 'Conversa com memória do plano' },
  { id: 'evolution', title: 'Evolução', lz: 'LZ-08', note: 'Linha do tempo comparável' },
  { id: 'settings', title: 'Perfil e privacidade', note: 'Memória, dados e conta' },
]

export const ORDER: ScreenId[] = SCREENS.map((s) => s.id)

/** Bottom tabs once the plan exists (stage 5–6). Scan is a Home action, never a tab. */
export type TabId = 'home' | 'plan' | 'personal' | 'evolution' | 'settings'
export const TAB_OF: Partial<Record<ScreenId, TabId>> = {
  home: 'home',
  guide: 'plan',
  routine: 'plan',
  plan: 'plan',
  personal: 'personal',
  evolution: 'evolution',
  settings: 'settings',
}

/* ── 3D style vocabulary (rendered by the face model) ──────── */

/** Head morph used by the 3D model (0..1, 0.5 = neutral). */
export interface FaceForm {
  width: number
  eyes: number
  roundness: number
  lips: number
}

export type HairId = 'current' | 'buzz' | 'textured-crop' | 'side-part' | 'slick-back' | 'medium-flow'
export type BeardId = 'clean' | 'stubble' | 'short-boxed' | 'full' | 'goatee'
export type BrowGroomId = 'natural' | 'clean-up' | 'defined'

export interface StyleSpec {
  hair: HairId
  hairTone: string
  beard: BeardId
  beardTone: string
  brows: BrowGroomId
}

export const TONES = {
  espresso: '#2a1d17',
  castanho: '#4a3324',
  avela: '#6d4c35',
  grafite: '#3a3a38',
  natural: '#3b2a20',
}

/** What the client has today (the "Original" in every comparison). */
export const CURRENT_STYLE: StyleSpec = { hair: 'current', hairTone: TONES.natural, beard: 'stubble', beardTone: TONES.natural, brows: 'natural' }

/* ── stage 1: profile (declared, never inferred) ───────────── */

export interface Profile {
  name: string
  goal: 'profissional' | 'versatil' | 'evento' | 'renovar' | null
  groomingTime: '5' | '10' | '20' | null // minutes per day
  budget: 'enxuto' | 'equilibrado' | 'investir' | null
  hairNow: 'curto' | 'medio' | 'longo' | null
  beardNow: 'sem' | 'por-fazer' | 'curta' | 'cheia' | null
  skin: { oleosidade: 0 | 1 | 2; ressecamento: 0 | 1 | 2; sensibilidade: 0 | 1 | 2 } // relatado: 0 nada · 1 às vezes · 2 frequente
  products: string[] // em uso
  references: string[] // estilos que admira (texto livre/chips)
}

export const PRODUCT_OPTIONS = ['Sabonete facial', 'Hidratante', 'Protetor solar', 'Pós-barba', 'Óleo de barba', 'Pomada/cera', 'Shampoo anticaspa', 'Nenhum']

/* ── stage 2: capture ──────────────────────────────────────── */

export type ShotId = 'frente' | 'perfil' | 'tresQuartos'
export type CheckId = 'luz' | 'pose' | 'foco' | 'filtro' | 'distancia'
export interface Shot {
  status: 'pendente' | 'ok' | 'refazer'
  checks: Record<CheckId, boolean>
  issue?: string
}
export const SHOT_LABEL: Record<ShotId, string> = { frente: 'Frente', perfil: 'Perfil', tresQuartos: '¾' }
export const CHECK_LABEL: Record<CheckId, string> = { luz: 'Luz uniforme', pose: 'Pose', foco: 'Foco', filtro: 'Sem filtro', distancia: 'Distância (braço esticado)' }

/* ── LZ-01: integrated reading ─────────────────────────────── */

export type RegionId = 'composition' | 'hair' | 'beard' | 'brows' | 'contrast' | 'eyes' | 'noseEars' | 'lips' | 'jaw' | 'neck' | 'skin'
export type Source = 'observado' | 'informado' | 'incerto'

export interface RegionReading {
  id: RegionId
  name: string
  /** what the analysis says, in plain Portuguese */
  note: string
  source: Source
  /** a quality worth valuing, if any */
  value?: string
  priority: 'alta' | 'media' | 'baixa' | null
  /** the rule/preference that supports the priority (traceability) */
  because?: string
}

export const READING: RegionReading[] = [
  { id: 'composition', name: 'Conjunto', note: 'Rosto de proporções equilibradas; a moldura inferior pode ganhar definição.', source: 'observado', value: 'Boa base para estilos curtos e médios', priority: 'alta', because: 'Objetivo declarado: imagem profissional' },
  { id: 'hair', name: 'Cabelo', note: 'Volume concentrado nas laterais; topo com ondulação leve.', source: 'observado', value: 'Textura natural aproveitável', priority: 'alta', because: 'Laterais volumosas alargam a leitura do rosto' },
  { id: 'beard', name: 'Barba e bigode', note: 'Barba por fazer com preenchimento regular na mandíbula.', source: 'observado', value: 'Densidade suficiente para barba curta desenhada', priority: 'alta', because: 'Barba curta reforça a moldura inferior' },
  { id: 'brows', name: 'Sobrancelhas', note: 'Fios alinhados; alguns fios soltos entre as sobrancelhas.', source: 'observado', value: 'Desenho natural a preservar', priority: 'media', because: 'Limpeza leve, sem redesenhar' },
  { id: 'contrast', name: 'Cores e contraste', note: 'Contraste médio entre cabelo, barba e pele.', source: 'incerto', priority: 'baixa', because: 'Luz da foto lateral não sustenta conclusão de tom' },
  { id: 'eyes', name: 'Olhos e região infraorbital', note: 'Você relatou cansaço aparente pela manhã.', source: 'informado', priority: 'baixa', because: 'Cuidado cosmético compatível na rotina' },
  { id: 'noseEars', name: 'Nariz e orelhas', note: 'Composição equilibrada; nenhuma ação necessária.', source: 'observado', priority: null },
  { id: 'lips', name: 'Lábios e sorriso', note: 'Lábios com leve ressecamento visível.', source: 'observado', priority: 'baixa', because: 'Hidratante labial na rotina' },
  { id: 'jaw', name: 'Bochechas, mandíbula e queixo', note: 'Leitura da mandíbula suavizada pela barba irregular.', source: 'observado', value: 'Ângulo de mandíbula bem marcado', priority: 'media', because: 'Desenho de barba pode valorizar' },
  { id: 'neck', name: 'Pescoço', note: 'Linha da barba no pescoço indefinida.', source: 'observado', priority: 'media', because: 'Acabamento da barba' },
  { id: 'skin', name: 'Pele', note: 'Você relatou oleosidade na zona T e ardor ao barbear.', source: 'informado', priority: 'alta', because: 'Conecta à rotina de skincare (LZ-05)' },
]

/* ── LZ-02: directions ─────────────────────────────────────── */

export interface Direction {
  id: string
  name: string
  summary: string
  effect: string // efeito visual pretendido
  style: StyleSpec
  maintenance: 1 | 2 | 3 // visitas/cuidado
  effort: 1 | 2 | 3 // tempo diário
  cost: 1 | 2 | 3
  recommended?: boolean
  why?: string
}

export const DIRECTIONS: Direction[] = [
  {
    id: 'executivo',
    name: 'Executivo moderno',
    summary: 'Laterais baixas, topo com textura e barba curta desenhada.',
    effect: 'Estreita a leitura lateral e marca a mandíbula.',
    style: { hair: 'textured-crop', hairTone: TONES.natural, beard: 'short-boxed', beardTone: TONES.natural, brows: 'clean-up' },
    maintenance: 2,
    effort: 1,
    cost: 2,
    recommended: true,
    why: 'Atende ao objetivo profissional com 5 min de arrumação, como você pediu.',
  },
  {
    id: 'classico',
    name: 'Clássico de risca',
    summary: 'Risca lateral, comprimento médio no topo e barba rente.',
    effect: 'Visual formal e previsível, ótimo para reuniões e eventos.',
    style: { hair: 'side-part', hairTone: TONES.natural, beard: 'stubble', beardTone: TONES.natural, brows: 'clean-up' },
    maintenance: 2,
    effort: 2,
    cost: 2,
  },
  {
    id: 'textura',
    name: 'Textura livre',
    summary: 'Topo médio com movimento e barba cheia aparada.',
    effect: 'Mais personalidade; exige crescimento de 6–8 semanas.',
    style: { hair: 'medium-flow', hairTone: TONES.natural, beard: 'full', beardTone: TONES.natural, brows: 'natural' },
    maintenance: 3,
    effort: 2,
    cost: 1,
  },
]

/* ── LZ-04: execution guide ────────────────────────────────── */

export interface GuideItem {
  area: 'Cabelo' | 'Barba' | 'Sobrancelha' | 'Cor' | 'Manutenção'
  forYou: string
  forPro: string
  supportedBy: 'dados' | 'referência' // ranges only when data support them
}

export const GUIDE: Record<string, GuideItem[]> = {
  executivo: [
    { area: 'Cabelo', forYou: 'Laterais curtas, topo com 4–6 cm para textura.', forPro: 'Laterais e nuca em degradê baixo (pente 1→2), topo tesoura 4–6 cm, textura com navalha; sem marcar risca.', supportedBy: 'dados' },
    { area: 'Barba', forYou: 'Barba curta e bem desenhada.', forPro: 'Comprimento 6–8 mm uniforme; linha da bochecha natural levemente baixada; contorno do pescoço dois dedos acima do pomo.', supportedBy: 'dados' },
    { area: 'Sobrancelha', forYou: 'Só limpar entre as sobrancelhas.', forPro: 'Remover fios da glabela; não afinar nem redesenhar o arco.', supportedBy: 'dados' },
    { area: 'Cor', forYou: 'Manter o tom natural.', forPro: 'Sem coloração nesta direção.', supportedBy: 'referência' },
    { area: 'Manutenção', forYou: 'Barbeiro a cada 3–4 semanas; aparar a barba 2× por semana.', forPro: 'Retoque de laterais a cada 3–4 semanas.', supportedBy: 'referência' },
  ],
}

/* ── LZ-05: skincare routine ───────────────────────────────── */

export type Budget = 'enxuto' | 'equilibrado' | 'investir'
export interface RoutineStep {
  id: string
  when: 'manha' | 'noite'
  order: number
  category: string
  purpose: string
  how: string
  options: Record<Budget, string>
  alreadyHave?: boolean
}

export const ROUTINE: RoutineStep[] = [
  { id: 'm1', when: 'manha', order: 1, category: 'Limpeza suave', purpose: 'Remove a oleosidade da noite sem ressecar.', how: 'Água morna, 30 s de massagem, enxágue.', options: { enxuto: 'Gel de limpeza para pele oleosa', equilibrado: 'Gel de limpeza com niacinamida', investir: 'Gel de limpeza dermatológico' }, alreadyHave: true },
  { id: 'm2', when: 'manha', order: 2, category: 'Hidratante leve', purpose: 'Equilibra a zona T e acalma depois de barbear.', how: 'Uma noz de produto no rosto e pescoço.', options: { enxuto: 'Gel-creme oil-free', equilibrado: 'Gel-creme com ácido hialurônico', investir: 'Hidratante pós-barba calmante' } },
  { id: 'm3', when: 'manha', order: 3, category: 'Protetor solar', purpose: 'Proteção diária, inclusive em dias nublados.', how: 'Dois dedos de produto; reaplicar se ficar ao sol.', options: { enxuto: 'FPS 30 toque seco', equilibrado: 'FPS 50 toque seco', investir: 'FPS 50 com cor' } },
  { id: 'n1', when: 'noite', order: 1, category: 'Limpeza suave', purpose: 'Remove protetor e poluição do dia.', how: 'Mesmo gel da manhã.', options: { enxuto: 'Gel de limpeza para pele oleosa', equilibrado: 'Gel de limpeza com niacinamida', investir: 'Gel de limpeza dermatológico' }, alreadyHave: true },
  { id: 'n2', when: 'noite', order: 2, category: 'Hidratante', purpose: 'Recupera a barreira da pele durante a noite.', how: 'Camada fina; evitar a área dos olhos.', options: { enxuto: 'Gel-creme oil-free', equilibrado: 'Creme leve com ceramidas', investir: 'Creme reparador com ceramidas' } },
  { id: 'n3', when: 'noite', order: 3, category: 'Óleo de barba', purpose: 'Amacia os fios e reduz coceira no crescimento.', how: '3 gotas, espalhar no sentido dos fios.', options: { enxuto: 'Óleo de barba simples', equilibrado: 'Óleo de barba com jojoba', investir: 'Óleo de barba premium' } },
]

/* ── LZ-06: priorities ─────────────────────────────────────── */

export interface Priority {
  id: string
  bucket: 'agora' | 'depende' | 'reavaliar'
  action: string
  purpose: string
  who: 'Você' | 'Barbeiro' | 'Você + barbeiro'
  review: string // condição/marco de revisão — não promessa biológica
}

export const PRIORITIES: Priority[] = [
  { id: 'p1', bucket: 'agora', action: 'Corte executivo moderno', purpose: 'Reduzir volume lateral', who: 'Barbeiro', review: 'Revisar com foto 7 dias depois' },
  { id: 'p2', bucket: 'agora', action: 'Começar a rotina de manhã', purpose: 'Oleosidade e ardor ao barbear', who: 'Você', review: 'Revisar adesão em 14 dias' },
  { id: 'p3', bucket: 'depende', action: 'Desenho da barba curta', purpose: 'Marcar a mandíbula', who: 'Você + barbeiro', review: 'Quando a barba tiver ~6 mm (≈ 2 semanas)' },
  { id: 'p4', bucket: 'depende', action: 'Limpeza das sobrancelhas', purpose: 'Acabamento do conjunto', who: 'Barbeiro', review: 'Junto ao próximo corte' },
  { id: 'p5', bucket: 'reavaliar', action: 'Contraste de tons', purpose: 'Leitura incerta pela luz da foto', who: 'Você', review: 'Nova foto com luz natural de frente' },
]

/* ── LZ-07: personal + memory ──────────────────────────────── */

export interface ChatMessage {
  id: number
  role: 'user' | 'personal'
  text: string
  /** contextual action card the personal attaches (manter/adaptar/pedir info/adiar/avaliação presencial) */
  card?: { kind: 'manter' | 'adaptar' | 'pedir-foto' | 'adiar' | 'presencial'; title: string; detail: string }
  /** memory entries this message wrote */
  remembered?: string[]
}

export interface Memory {
  preferencias: string[]
  condicoes: string[]
  decisoes: string[]
  execucoes: string[]
  retornos: string[]
}

/* ── LZ-08: history ────────────────────────────────────────── */

export interface HistoryEntry {
  id: string
  date: string // ISO
  kind: 'foto' | 'decisao' | 'rotina' | 'retorno' | 'versao'
  title: string
  detail: string
  style?: StyleSpec
}

export const HISTORY: HistoryEntry[] = [
  { id: 'h1', date: '2026-10-02', kind: 'foto', title: 'Primeira leitura', detail: 'Fotos padronizadas: frente, perfil e ¾.', style: CURRENT_STYLE },
  { id: 'h2', date: '2026-10-02', kind: 'decisao', title: 'Direção escolhida', detail: 'Executivo moderno (recomendada).' },
  { id: 'h3', date: '2026-10-05', kind: 'retorno', title: 'Corte feito', detail: '“Gostei das laterais; topo ficou curto demais.” Guia ajustado: topo 5–6 cm.', style: { ...DIRECTIONS[0].style, beard: 'stubble' } },
  { id: 'h4', date: '2026-10-19', kind: 'rotina', title: 'Rotina: 12 de 14 dias', detail: 'Ardor ao barbear diminuiu, segundo você.' },
  { id: 'h5', date: '2026-10-20', kind: 'versao', title: 'Plano v2', detail: 'Barba curta liberada: comprimento ~6 mm atingido.' },
  { id: 'h6', date: '2026-11-03', kind: 'foto', title: 'Revisão de 30 dias', detail: 'Mesma luz e distância da primeira foto.', style: DIRECTIONS[0].style },
]

/* ── store ─────────────────────────────────────────────────── */

export interface Toast {
  id: number
  title: string
  detail?: string
}

interface LozucState {
  screen: ScreenId
  direction: 1 | -1
  spotlight: ScreenId | null

  welcomeSlide: number
  profileStep: number
  profile: Profile

  consent: { biometric: boolean; camera: 'unknown' | 'granted' | 'denied' }
  activeShot: ShotId
  shots: Record<ShotId, Shot>
  processing: { step: number; done: boolean } // 0..4 real stages

  activeRegion: RegionId | null
  subscribed: boolean
  plan: 'mensal' | 'anual'

  chosenDirection: string
  simulation: { mode: 'combinada' | 'isolada'; part: 'cabelo' | 'barba' | 'sobrancelha'; split: number }
  guideView: 'voce' | 'barbeiro'
  routineWhen: 'manha' | 'noite'
  budget: Budget
  routineDone: Record<string, boolean> // today

  messages: ChatMessage[]
  memory: Memory
  typing: boolean

  compare: [string, string] // two history ids
  toasts: Toast[]

  go: (id: ScreenId) => void
  next: () => void
  back: () => void
  setSpotlight: (id: ScreenId | null) => void
  setWelcomeSlide: (i: number) => void
  setProfileStep: (i: number) => void
  setProfile: (patch: Partial<Profile>) => void
  toggleProduct: (p: string) => void
  setConsent: (patch: Partial<LozucState['consent']>) => void
  setActiveShot: (s: ShotId) => void
  setShot: (s: ShotId, patch: Partial<Shot>) => void
  advanceProcessing: () => void
  resetProcessing: () => void
  setActiveRegion: (r: RegionId | null) => void
  subscribe: () => void
  setPlan: (p: 'mensal' | 'anual') => void
  chooseDirection: (id: string) => void
  setSimulation: (patch: Partial<LozucState['simulation']>) => void
  setGuideView: (v: 'voce' | 'barbeiro') => void
  setRoutineWhen: (w: 'manha' | 'noite') => void
  setBudget: (b: Budget) => void
  toggleRoutineDone: (id: string) => void
  send: (text: string) => void
  forget: (key: keyof Memory, item: string) => void
  setCompare: (pair: [string, string]) => void
  toast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void
}

let uid = 1
const okChecks = (): Record<CheckId, boolean> => ({ luz: true, pose: true, foco: true, filtro: true, distancia: true })

/** Simple, rule-based personal (offline) — replies with context from memory and the plan. */
function personalReply(text: string, s: LozucState): Omit<ChatMessage, 'id' | 'role'> {
  const t = text.toLowerCase()
  if (/(cortei|cortou|fiz o corte|barbeiro)/.test(t))
    return {
      text: 'Ótimo. Para comparar com a primeira leitura, me manda uma foto de frente com a mesma luz e distância. Enquanto isso: o topo ficou na faixa de 4–6 cm do guia?',
      card: { kind: 'pedir-foto', title: 'Foto comparável', detail: 'Frente · luz natural · braço esticado' },
      remembered: ['Execução: corte executivo moderno'],
    }
  if (/(ard|irrit|coç|vermelh)/.test(t))
    return {
      text: 'Vamos simplificar: pause o hidratante novo por 3 dias e mantenha só limpeza suave e protetor. Se a irritação continuar ou piorar, procure um dermatologista — não vou adicionar ativos para compensar.',
      card: { kind: 'presencial', title: 'Se persistir', detail: 'Avaliação com dermatologista' },
      remembered: ['Retorno: irritação relatada'],
    }
  if (/(evento|casamento|entrevista|formatura)/.test(t))
    return {
      text: 'Para o evento, mantenha a direção que você já escolheu. Faça o retoque das laterais 3–5 dias antes e apare a barba na véspera. Nada de testar produto novo nessa semana.',
      card: { kind: 'manter', title: 'Plano do evento', detail: 'Retoque D-4 · barba D-1 · sem novidades' },
      remembered: ['Preferência: preparar para evento'],
    }
  if (/(cresc|deixar crescer|barba cheia|comprid)/.test(t))
    return {
      text: 'Na fase de crescimento, a barba costuma parecer irregular. Mantenha o contorno do pescoço limpo e use o óleo à noite. Revisamos o desenho quando atingir ~6 mm.',
      card: { kind: 'adiar', title: 'Revisar o desenho', detail: 'Quando a barba tiver ~6 mm' },
    }
  return {
    text: `Anotado. Pelo seu plano (${DIRECTIONS.find((d) => d.id === s.chosenDirection)?.name}), o próximo passo é o desenho da barba quando ela atingir ~6 mm. Quer que eu ajuste algo na rotina ou no guia?`,
    card: { kind: 'adaptar', title: 'Próximo passo', detail: 'Desenho da barba · ~6 mm' },
  }
}

export const useLozuc = create<LozucState>()((set, get) => ({
  screen: 'welcome',
  direction: 1,
  spotlight: null,

  welcomeSlide: 0,
  profileStep: 0,
  profile: {
    name: 'Rafael',
    goal: 'profissional',
    groomingTime: '5',
    budget: 'equilibrado',
    hairNow: 'medio',
    beardNow: 'por-fazer',
    skin: { oleosidade: 2, ressecamento: 0, sensibilidade: 1 },
    products: ['Sabonete facial', 'Pós-barba'],
    references: ['Barba curta', 'Visual de escritório'],
  },

  consent: { biometric: false, camera: 'unknown' },
  activeShot: 'frente',
  shots: {
    frente: { status: 'ok', checks: okChecks() },
    perfil: { status: 'ok', checks: okChecks() },
    tresQuartos: { status: 'refazer', checks: { ...okChecks(), luz: false }, issue: 'Sombra forte no lado esquerdo — vire-se para a janela.' },
  },
  processing: { step: 0, done: false },

  activeRegion: 'hair',
  subscribed: false,
  plan: 'anual',

  chosenDirection: 'executivo',
  simulation: { mode: 'combinada', part: 'cabelo', split: 0.5 },
  guideView: 'voce',
  routineWhen: 'manha',
  budget: 'equilibrado',
  routineDone: { m1: true },

  messages: [
    { id: uid++, role: 'personal', text: 'Oi, Rafael. Seu plano está pronto: corte executivo moderno primeiro, rotina de manhã desde hoje. Me conta quando cortar — eu ajusto o guia com o que você achar.' },
    { id: uid++, role: 'user', text: 'Cortei ontem. Gostei das laterais, mas o topo ficou curto.' },
    {
      id: uid++,
      role: 'personal',
      text: 'Anotei. No próximo corte, peça topo com 5–6 cm (atualizei o guia para o barbeiro). Me manda uma foto de frente na mesma luz da primeira leitura para eu comparar.',
      card: { kind: 'adaptar', title: 'Guia atualizado', detail: 'Topo 5–6 cm · laterais iguais' },
      remembered: ['Preferência: topo um pouco mais longo'],
    },
  ],
  memory: {
    preferencias: ['Visual de escritório', 'Barba curta', 'Topo um pouco mais longo'],
    condicoes: ['Arrumação: 5 min/dia', 'Orçamento equilibrado', 'Usa sabonete facial e pós-barba'],
    decisoes: ['Direção: Executivo moderno', 'Rotina: manhã e noite (v1)'],
    execucoes: ['Corte em 05/10', 'Rotina 12 de 14 dias'],
    retornos: ['Topo ficou curto', 'Ardor ao barbear diminuiu'],
  },
  typing: false,

  compare: ['h1', 'h6'],
  toasts: [],

  go: (id) => set((s) => ({ screen: id, direction: ORDER.indexOf(id) >= ORDER.indexOf(s.screen) ? 1 : -1 })),
  next: () => {
    const i = ORDER.indexOf(get().screen)
    if (i < ORDER.length - 1) set({ screen: ORDER[i + 1], direction: 1 })
  },
  back: () => {
    const i = ORDER.indexOf(get().screen)
    if (i > 0) set({ screen: ORDER[i - 1], direction: -1 })
  },
  setSpotlight: (spotlight) => set({ spotlight }),
  setWelcomeSlide: (welcomeSlide) => set({ welcomeSlide }),
  setProfileStep: (profileStep) => set({ profileStep }),
  setProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
  toggleProduct: (p) =>
    set((s) => {
      const has = s.profile.products.includes(p)
      let products = has ? s.profile.products.filter((x) => x !== p) : [...s.profile.products, p]
      if (p === 'Nenhum' && !has) products = ['Nenhum']
      else products = products.filter((x) => x !== 'Nenhum' || p === 'Nenhum')
      return { profile: { ...s.profile, products } }
    }),
  setConsent: (patch) => set((s) => ({ consent: { ...s.consent, ...patch } })),
  setActiveShot: (activeShot) => set({ activeShot }),
  setShot: (id, patch) => set((s) => ({ shots: { ...s.shots, [id]: { ...s.shots[id], ...patch } } })),
  advanceProcessing: () =>
    set((s) => {
      const step = Math.min(4, s.processing.step + 1)
      return { processing: { step, done: step >= 4 } }
    }),
  resetProcessing: () => set({ processing: { step: 0, done: false } }),
  setActiveRegion: (activeRegion) => set({ activeRegion }),
  subscribe: () => {
    set({ subscribed: true })
    get().toast({ title: 'Plano ativado', detail: 'Direções, simulações e acompanhamento liberados' })
  },
  setPlan: (plan) => set({ plan }),
  chooseDirection: (chosenDirection) => set({ chosenDirection }),
  setSimulation: (patch) => set((s) => ({ simulation: { ...s.simulation, ...patch } })),
  setGuideView: (guideView) => set({ guideView }),
  setRoutineWhen: (routineWhen) => set({ routineWhen }),
  setBudget: (budget) => set({ budget }),
  toggleRoutineDone: (id) => set((s) => ({ routineDone: { ...s.routineDone, [id]: !s.routineDone[id] } })),
  send: (text) => {
    const msg = text.trim()
    if (!msg) return
    set((s) => ({ messages: [...s.messages, { id: uid++, role: 'user', text: msg }], typing: true }))
    window.setTimeout(() => {
      const s = get()
      const reply = personalReply(msg, s)
      const memory = { ...s.memory }
      for (const r of reply.remembered ?? []) {
        const [k, v] = r.split(': ')
        const key = ({ Preferência: 'preferencias', Execução: 'execucoes', Retorno: 'retornos', Decisão: 'decisoes', Condição: 'condicoes' } as Record<string, keyof Memory>)[k]
        if (key && v && !memory[key].includes(v)) memory[key] = [...memory[key], v]
      }
      set({ messages: [...s.messages, { id: uid++, role: 'personal', ...reply }], typing: false, memory })
    }, 900)
  },
  forget: (key, item) => set((s) => ({ memory: { ...s.memory, [key]: s.memory[key].filter((x) => x !== item) } })),
  setCompare: (compare) => set({ compare }),
  toast: (t) => {
    const id = uid++
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id }] }))
    window.setTimeout(() => get().dismissToast(id), 3200)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
