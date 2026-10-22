import { useDomus, type ClimateMode, type FocusId, type RoomId } from '../../store'
import { SCENES } from '../../lib/scenes'

/* ──────────────────────────────────────────────────────────────
   Domus local intent engine — EN · PT-BR · ES, no network.
   interpret() parses a free-form request, executes it through the
   store and returns a localized reply plus action chips.
   ────────────────────────────────────────────────────────────── */

export type Lang = 'en' | 'pt' | 'es'

export interface BrainReply {
  lang: Lang
  text: string
  actions: string[]
}

type Binary = 'tv' | 'sonos' | 'cleanbot' | 'lamp' | 'led' | 'door' | 'eco'
type Entity = Binary | 'music' | 'volume' | 'temp' | 'all'
type Verb = 'on' | 'off' | 'lock' | 'unlock' | 'up' | 'down' | 'set' | 'play' | 'pause'
type Topic = 'energy' | 'solar' | 'temp' | 'humidity' | 'occupancy' | 'door' | 'devices' | 'eco'

type Tri = readonly [en: string, pt: string, es: string]

const s = () => useDomus.getState()
const L = <T,>(lang: Lang, en: T, pt: T, es: T): T => (lang === 'pt' ? pt : lang === 'es' ? es : en)
const tr = (lang: Lang, t: Tri) => L(lang, t[0], t[1], t[2])
const num = (n: number, lang: Lang, d = 1) => (lang === 'en' ? n.toFixed(d) : n.toFixed(d).replace('.', ','))
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

/* ── text utils ─────────────────────────────────────────────── */

const normalize = (raw: string) =>
  raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/[“”"'’!¡¿]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const esc = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const reCache = new Map<string, RegExp>()
const wordRe = (w: string) => {
  let r = reCache.get(w)
  if (!r) {
    r = new RegExp(`(?:^|[^a-z0-9])${esc(w)}(?=$|[^a-z0-9])`)
    reCache.set(w, r)
  }
  return r
}
const has = (t: string, words: readonly string[]) => words.some((w) => wordRe(w).test(t))

/* ── language detection ─────────────────────────────────────── */

const LANG_WORDS: Record<Lang, Set<string>> = {
  en: new Set(
    'the turn switch set what whats how much is are lock unlock door lights light please to and on off start play stop temperature i im my it can you now today room hall kitchen energy solar music tell me show warmer cooler thanks thank hello hi hey everything'.split(' '),
  ),
  pt: new Set(
    'voce desliga desligar desligue liga ligar ligue acende acender acenda tranca trancar tranque destranca destrancar porta quanto quanta quantos quantas qual quais agora hoje ontem obrigado obrigada nao sim luzes quarto cozinha graus umidade pessoas aumenta aumentar diminui diminuir abaixa abaixar coloca colocar deixa deixar oi ola bom boa som toca tocar fecha fechar tem muito pra o os as do da dos das no na um uma e em ta estou meu minha ativa ativar desativa desativar tudo quente ajuda pode manda aspira limpa limpar terraco escritorio esta frente casa a muda mudar fita coloque deixe luminaria robo limpeza agora'.split(' '),
  ),
  es: new Set(
    'enciende encender enciendes prende prender cierra cerrar puerta cuanto cuanta cuantos cuantas cual ahora hoy ayer gracias luces cocina dormitorio habitacion grados humedad personas sube subir baja bajar pon poner hola buenos buenas salon terraza la el los las del y al que quien estoy tengo mi activa activar desactiva desactivar todo caliente ayuda puedes limpia limpiar aspiradora tele por favor abre abrir principal hay'.split(' '),
  ),
}

export function detectLang(raw: string): Lang {
  const t = normalize(raw)
  const tokens = t.split(/[^a-z0-9]+/).filter(Boolean)
  const score: Record<Lang, number> = { en: 0, pt: 0, es: 0 }
  for (const tok of tokens) for (const l of ['en', 'pt', 'es'] as const) if (LANG_WORDS[l].has(tok)) score[l]++
  if (/[ãõçê]/i.test(raw)) score.pt += 2
  if (/[ñ¿¡]/i.test(raw)) score.es += 2
  const best = (['pt', 'es', 'en'] as const).reduce((a, b) => (score[b] > score[a] ? b : a))
  return score[best] === 0 ? 'en' : best
}

/* ── vocabulary ─────────────────────────────────────────────── */

const ROOMS: Array<[RoomId, string[]]> = [
  ['main-hall', ['main hall', 'hall', 'living room', 'living', 'lounge', 'sala principal', 'sala de estar', 'sala', 'salon', 'salon principal']],
  ['kitchen', ['kitchen', 'cozinha', 'cocina']],
  ['master-suite', ['master suite', 'suite', 'bedroom', 'quarto', 'dormitorio', 'habitacion', 'recamara']],
  ['studio', ['studio', 'estudio', 'office', 'escritorio']],
  ['terrace', ['terrace', 'roof terrace', 'rooftop', 'terraco', 'terraza', 'varanda']],
]

const ENTITIES: Array<[Entity, string[]]> = [
  ['tv', ['tv', 'tele', 'television', 'televisao', 'televisor', 'oled', 'tv oled', 'smart tv']],
  ['sonos', ['sonos', 'speaker', 'caixa de som', 'alto falante', 'altavoz', 'parlante', 'bocina', 'era 300']],
  ['music', ['music', 'musica', 'song', 'cancion', 'playlist', 'som']],
  ['volume', ['volume', 'volumen', 'louder', 'quieter', 'mais alto', 'mais baixo', 'mas alto', 'mas bajo']],
  ['cleanbot', ['cleanbot', 'robot', 'robo', 'aspirador', 'aspiradora', 'vacuum', 'cleaner', 'limpeza', 'limpieza', 'clean', 'limpa', 'limpar', 'limpia', 'limpiar', 'aspira', 'aspirar']],
  ['led', ['led', 'leds', 'strip', 'fita', 'fita led', 'tira', 'tira led', 'frame']],
  ['lamp', ['lamp', 'light', 'lights', 'luz', 'luzes', 'luces', 'lampada', 'luminaria', 'abajur', 'hue', 'lampara', 'iluminacao', 'iluminacion']],
  ['door', ['door', 'front door', 'porta', 'puerta', 'fechadura', 'cerradura', 'entrance', 'entrada']],
  ['eco', ['eco', 'eco mode', 'modo eco', 'economia', 'ahorro', 'economy', 'energy saving']],
  ['temp', ['temperature', 'temp', 'temperatura', 'degrees', 'degree', 'graus', 'grau', 'grados', 'grado', 'thermostat', 'termostato', 'climate', 'clima', 'ar condicionado', 'aire acondicionado', 'heating', 'aquecimento', 'calefaccion', 'ac']],
  ['all', ['everything', 'all devices', 'all', 'tudo', 'todo', 'todos', 'tudo isso']],
]

const VERBS: Array<[Verb, string[], boolean]> = [
  // [verb, words, strong] — strong verbs make a "?" sentence an action ("can you lock the door?")
  ['unlock', ['unlock', 'destranca', 'destrancar', 'destranque', 'abre', 'abrir', 'abra', 'desbloquea', 'desbloquear', 'open'], true],
  ['lock', ['lock', 'tranca', 'trancar', 'tranque', 'fecha', 'fechar', 'feche', 'cierra', 'cerrar', 'cierre', 'bloquea', 'bloquear', 'secure'], true],
  ['pause', ['pause', 'pausa', 'pausar', 'pause a', 'mute', 'silencia', 'silenciar'], true],
  ['play', ['play', 'toca', 'tocar', 'toque', 'reproduce', 'reproducir', 'pon musica', 'coloca musica', 'bota musica'], true],
  ['off', ['turn off', 'switch off', 'shut off', 'shut down', 'power off', 'lights out', 'off', 'out', 'stop', 'kill', 'desliga', 'desligar', 'desligue', 'apaga', 'apagar', 'apague', 'desativa', 'desativar', 'desative', 'parar', 'pare', 'detener', 'deten', 'desactiva', 'desactivar', 'dock', 'disable'], true],
  ['on', ['turn on', 'switch on', 'power on', 'on', 'start', 'run', 'enable', 'activate', 'liga', 'ligar', 'ligue', 'acende', 'acender', 'acenda', 'ativa', 'ativar', 'ative', 'enciende', 'encender', 'encienda', 'prende', 'prender', 'activa', 'activar', 'inicia', 'iniciar', 'comeca', 'comecar', 'manda', 'aspira', 'aspirar', 'limpa', 'limpar', 'limpia', 'limpiar'], true],
  ['up', ['raise', 'increase', 'turn up', 'warmer', 'brighter', 'brighten', 'louder', 'up', 'aumenta', 'aumentar', 'aumente', 'sobe', 'subir', 'suba', 'esquenta', 'esquentar', 'mais quente', 'sube', 'calienta', 'mas caliente', 'mais alto', 'mas alto'], true],
  ['down', ['lower', 'decrease', 'turn down', 'cooler', 'dim', 'dimmer', 'quieter', 'down', 'diminui', 'diminuir', 'diminua', 'abaixa', 'abaixar', 'abaixe', 'baixa', 'esfria', 'esfriar', 'mais frio', 'baja', 'bajar', 'enfria', 'mas frio', 'reduce', 'reduz', 'reduzir', 'mais baixo', 'mas bajo'], true],
  ['set', ['set', 'put', 'change', 'make', 'adjust', 'coloca', 'colocar', 'coloque', 'deixa', 'deixar', 'deixe', 'ajusta', 'ajustar', 'ajuste', 'muda', 'mudar', 'mude', 'define', 'definir', 'bota', 'pon', 'poner', 'ponga', 'cambia', 'cambiar', 'pone'], true],
]

const QUESTION_START = [
  'how', 'what', 'whats', 'which', 'is', 'are', 'does', 'do', 'tell me', 'show me', 'who', 'where', 'status',
  'quanto', 'quanta', 'quantos', 'quantas', 'qual', 'quais', 'como', 'esta', 'tem', 'quem', 'onde', 'o que', 'me diz', 'me fala', 'mostra',
  'cuanto', 'cuanta', 'cuantos', 'cuantas', 'cual', 'cuales', 'que', 'quien', 'donde', 'hay', 'dime', 'muestra',
]

const TOPICS: Array<[Topic, string[]]> = [
  ['solar', ['solar', 'sun', 'sol', 'panel', 'panels', 'painel', 'paineis', 'paneles', 'producing', 'gerando', 'generando', 'producao', 'produccion']],
  ['energy', ['energy', 'energia', 'consumption', 'consumo', 'kwh', 'usage', 'used', 'consumi', 'gastei', 'gasto', 'electricity', 'eletricidade', 'electricidad']],
  ['humidity', ['humidity', 'umidade', 'humedad', 'humid']],
  ['occupancy', ['who', 'people', 'person', 'pessoas', 'pessoa', 'personas', 'persona', 'quem', 'quien', 'occupied', 'occupancy', 'ocupado', 'ocupada', 'ocupacao', 'ocupacion', 'home', 'em casa', 'en casa']],
  ['door', ['door', 'porta', 'puerta', 'lock', 'locked', 'trancada', 'cerrada', 'fechadura', 'cerradura']],
  ['eco', ['eco', 'savings', 'economia', 'ahorro', 'saving']],
  ['temp', ['temperature', 'temp', 'temperatura', 'degrees', 'graus', 'grados', 'warm', 'cold', 'hot', 'quente', 'frio', 'calor', 'caliente']],
  ['devices', ['devices', 'device', 'dispositivos', 'dispositivo', 'status', 'estado', 'on', 'ligado', 'ligada', 'encendido', 'encendida', 'running']],
]

interface Color {
  hex: string
  name: Tri
  words: string[]
}

const COLORS: Color[] = [
  { hex: '#e0a64a', name: ['warm amber', 'âmbar quente', 'ámbar cálido'], words: ['warm', 'amber', 'quente', 'ambar', 'calido', 'calida'] },
  { hex: '#d8b25a', name: ['gold', 'dourado', 'dorado'], words: ['gold', 'golden', 'dourado', 'dourada', 'dorado', 'dorada', 'ouro', 'oro'] },
  { hex: '#f4f1ea', name: ['white', 'branco', 'blanco'], words: ['white', 'branco', 'branca', 'blanco', 'blanca', 'neutral', 'neutro'] },
  { hex: '#e0574f', name: ['red', 'vermelho', 'rojo'], words: ['red', 'vermelho', 'vermelha', 'rojo', 'roja'] },
  { hex: '#5b8def', name: ['blue', 'azul', 'azul'], words: ['blue', 'azul'] },
  { hex: '#9bd66a', name: ['green', 'verde', 'verde'], words: ['green', 'verde', 'lime'] },
  { hex: '#9a6cf0', name: ['purple', 'roxo', 'morado'], words: ['purple', 'violet', 'roxo', 'roxa', 'violeta', 'morado', 'lilas', 'lila'] },
  { hex: '#ef7fb0', name: ['pink', 'rosa', 'rosa'], words: ['pink', 'rosa'] },
  { hex: '#f08a3c', name: ['orange', 'laranja', 'naranja'], words: ['orange', 'laranja', 'naranja'] },
  { hex: '#f2d24b', name: ['yellow', 'amarelo', 'amarillo'], words: ['yellow', 'amarelo', 'amarela', 'amarillo', 'amarilla'] },
  { hex: '#53d0e0', name: ['cyan', 'ciano', 'cian'], words: ['cyan', 'ciano', 'cian', 'turquoise', 'turquesa'] },
]

const MODES: Array<[ClimateMode, string[]]> = [
  ['auto', ['auto', 'automatic', 'automatico', 'automatica']],
  ['cold', ['cold', 'cool', 'cooling', 'frio', 'fria', 'resfriar', 'enfriar']],
  ['warm', ['warm', 'heat', 'heating', 'quente', 'aquecer', 'calor', 'calentar', 'caliente']],
  ['eco', ['eco']],
]

const MODE_NAME: Record<ClimateMode, Tri> = {
  auto: ['Auto', 'Automático', 'Automático'],
  cold: ['Cold', 'Frio', 'Frío'],
  warm: ['Warm', 'Quente', 'Cálido'],
  eco: ['Eco', 'Eco', 'Eco'],
}

const ROOM_NAME: Record<RoomId, { en: string; pt: [string, string]; es: [string, string] }> = {
  'main-hall': { en: 'Main Hall', pt: ['a', 'Sala Principal'], es: ['el', 'Salón Principal'] },
  kitchen: { en: 'Kitchen', pt: ['a', 'Cozinha'], es: ['la', 'Cocina'] },
  'master-suite': { en: 'Master Suite', pt: ['a', 'Suíte Master'], es: ['la', 'Suite Principal'] },
  studio: { en: 'Studio', pt: ['o', 'Estúdio'], es: ['el', 'Estudio'] },
  terrace: { en: 'Roof Terrace', pt: ['o', 'Terraço'], es: ['la', 'Terraza'] },
}

/** "a Sala Principal" / "el Salón Principal" / "the Main Hall" */
const roomRef = (id: RoomId, lang: Lang, withArticle = true) => {
  const r = ROOM_NAME[id]
  if (lang === 'en') return withArticle ? `the ${r.en}` : r.en
  const [art, name] = lang === 'pt' ? r.pt : r.es
  return withArticle ? `${art} ${name}` : name
}

/* ── binary device table ────────────────────────────────────── */

interface BinaryDef {
  get: () => boolean
  set: (v: boolean) => void
  done: [on: Tri, off: Tri]
  already: [on: Tri, off: Tri]
  chip: [on: Tri, off: Tri]
  focus?: FocusId
}

const BIN: Record<Binary, BinaryDef> = {
  tv: {
    get: () => s().nodes.tv.on,
    set: (v) => s().toggleNode('tv', v),
    done: [
      ['turned on the Smart OLED TV', 'liguei a Smart TV OLED', 'encendí la Smart TV OLED'],
      ['turned off the Smart OLED TV', 'desliguei a Smart TV OLED', 'apagué la Smart TV OLED'],
    ],
    already: [
      ['the Smart OLED TV was already on', 'a Smart TV OLED já estava ligada', 'la Smart TV OLED ya estaba encendida'],
      ['the Smart OLED TV was already off', 'a Smart TV OLED já estava desligada', 'la Smart TV OLED ya estaba apagada'],
    ],
    chip: [
      ['TV on', 'TV ligada', 'TV encendida'],
      ['TV off', 'TV desligada', 'TV apagada'],
    ],
    focus: 'main-hall',
  },
  sonos: {
    get: () => s().nodes.sonos.on,
    set: (v) => {
      s().toggleNode('sonos', v)
      s().setSpeaker({ on: v, playing: v ? s().speaker.playing : false })
    },
    done: [
      ['turned on the Sonos Era 300', 'liguei o Sonos Era 300', 'encendí el Sonos Era 300'],
      ['turned off the Sonos Era 300', 'desliguei o Sonos Era 300', 'apagué el Sonos Era 300'],
    ],
    already: [
      ['the Sonos Era 300 was already on', 'o Sonos Era 300 já estava ligado', 'el Sonos Era 300 ya estaba encendido'],
      ['the Sonos Era 300 was already off', 'o Sonos Era 300 já estava desligado', 'el Sonos Era 300 ya estaba apagado'],
    ],
    chip: [
      ['Sonos on', 'Sonos ligado', 'Sonos encendido'],
      ['Sonos off', 'Sonos desligado', 'Sonos apagado'],
    ],
  },
  cleanbot: {
    get: () => s().nodes.cleanbot.on,
    set: (v) => s().toggleNode('cleanbot', v),
    done: [
      ['sent the CleanBot V4 out to clean', 'coloquei o CleanBot V4 para limpar', 'puse a limpiar el CleanBot V4'],
      ['sent the CleanBot V4 back to its dock', 'mandei o CleanBot V4 de volta à base', 'envié el CleanBot V4 a su base'],
    ],
    already: [
      ['the CleanBot V4 is already cleaning', 'o CleanBot V4 já está limpando', 'el CleanBot V4 ya está limpiando'],
      ['the CleanBot V4 is already docked', 'o CleanBot V4 já está na base', 'el CleanBot V4 ya está en su base'],
    ],
    chip: [
      ['CleanBot running', 'CleanBot limpando', 'CleanBot limpiando'],
      ['CleanBot docked', 'CleanBot na base', 'CleanBot en base'],
    ],
  },
  lamp: {
    get: () => s().lamp.on,
    set: (v) => s().setLamp(v && s().lamp.intensity < 5 ? { on: true, intensity: 40 } : { on: v }),
    done: [
      ['turned on the Hue Master Lamp', 'acendi a Hue Master Lamp', 'encendí la Hue Master Lamp'],
      ['turned off the Hue Master Lamp', 'apaguei a Hue Master Lamp', 'apagué la Hue Master Lamp'],
    ],
    already: [
      ['the Hue Master Lamp was already on', 'a Hue Master Lamp já estava acesa', 'la Hue Master Lamp ya estaba encendida'],
      ['the Hue Master Lamp was already off', 'a Hue Master Lamp já estava apagada', 'la Hue Master Lamp ya estaba apagada'],
    ],
    chip: [
      ['Lamp on', 'Luminária acesa', 'Lámpara encendida'],
      ['Lamp off', 'Luminária apagada', 'Lámpara apagada'],
    ],
  },
  led: {
    get: () => s().led.on,
    set: (v) => s().setLed({ on: v }),
    done: [
      ['turned on the LED Strip Frame', 'acendi a fita LED', 'encendí la tira LED'],
      ['turned off the LED Strip Frame', 'apaguei a fita LED', 'apagué la tira LED'],
    ],
    already: [
      ['the LED strip was already on', 'a fita LED já estava acesa', 'la tira LED ya estaba encendida'],
      ['the LED strip was already off', 'a fita LED já estava apagada', 'la tira LED ya estaba apagada'],
    ],
    chip: [
      ['LED on', 'LED aceso', 'LED encendido'],
      ['LED off', 'LED apagado', 'LED apagado'],
    ],
  },
  door: {
    get: () => s().door.locked,
    set: (v) => s().setDoorLocked(v),
    done: [
      ['locked the front door', 'tranquei a porta da frente', 'cerré con llave la puerta principal'],
      ['unlocked the front door', 'destranquei a porta da frente', 'abrí la puerta principal'],
    ],
    already: [
      ['the front door was already locked', 'a porta da frente já estava trancada', 'la puerta principal ya estaba cerrada con llave'],
      ['the front door was already unlocked', 'a porta da frente já estava destrancada', 'la puerta principal ya estaba abierta'],
    ],
    chip: [
      ['Door locked', 'Porta trancada', 'Puerta cerrada'],
      ['Door unlocked', 'Porta destrancada', 'Puerta abierta'],
    ],
    focus: 'front-door',
  },
  eco: {
    get: () => s().eco.active,
    set: (v) => s().setEco(v),
    done: [
      ['turned Eco mode on', 'ativei o modo Eco', 'activé el modo Eco'],
      ['turned Eco mode off', 'desativei o modo Eco', 'desactivé el modo Eco'],
    ],
    already: [
      ['Eco mode was already on', 'o modo Eco já estava ativo', 'el modo Eco ya estaba activo'],
      ['Eco mode was already off', 'o modo Eco já estava desligado', 'el modo Eco ya estaba desactivado'],
    ],
    chip: [
      ['Eco on', 'Eco ativo', 'Eco activo'],
      ['Eco off', 'Eco desligado', 'Eco apagado'],
    ],
  },
}

/* ── accumulator ────────────────────────────────────────────── */

interface Acc {
  lang: Lang
  done: string[]
  already: string[]
  info: string[]
  chips: string[]
  focus?: FocusId
  answered: Set<string>
}

const chip = (acc: Acc, label: string) => {
  if (!acc.chips.includes(label)) acc.chips.push(label)
}

function applyBinary(acc: Acc, key: Binary, on: boolean) {
  const d = BIN[key]
  const i = on ? 0 : 1
  if (d.get() === on) acc.already.push(tr(acc.lang, d.already[i]))
  else {
    d.set(on)
    acc.done.push(tr(acc.lang, d.done[i]))
  }
  chip(acc, tr(acc.lang, d.chip[i]))
  if (d.focus) acc.focus = d.focus
}

function applyTemp(acc: Acc, room: RoomId, next: number) {
  const { lang } = acc
  const before = s().rooms[room].target
  s().setRoomTarget(room, next)
  const r = s().rooms[room]
  const t = num(r.target, lang)
  if (Math.abs(before - r.target) < 0.05) {
    acc.already.push(
      L(lang, `${roomRef(room, lang)} is already set to ${t}°C`, `${roomRef(room, lang)} já está em ${t}°C`, `${roomRef(room, lang)} ya está a ${t}°C`),
    )
  } else {
    acc.done.push(
      L(lang, `set ${roomRef(room, lang)} to ${t}°C`, `ajustei ${roomRef(room, lang)} para ${t}°C`, `ajusté ${roomRef(room, lang)} a ${t}°C`),
    )
    const diff = r.target - r.temperature
    if (Math.abs(diff) >= 0.3) {
      const mins = Math.max(1, Math.round(Math.abs(diff) * 4))
      const now = num(r.temperature, lang)
      acc.info.push(
        diff > 0
          ? L(lang, `It's ${now}°C now — heating, about ${mins} min to go.`, `Agora está em ${now}°C — aquecendo, cerca de ${mins} min.`, `Ahora hay ${now}°C — calentando, unos ${mins} min.`)
          : L(lang, `It's ${now}°C now — cooling, about ${mins} min to go.`, `Agora está em ${now}°C — resfriando, cerca de ${mins} min.`, `Ahora hay ${now}°C — enfriando, unos ${mins} min.`),
      )
    }
  }
  chip(acc, `${ROOM_NAME[room].en} ${num(r.target, 'en')}°C`)
  s().selectRoom(room)
  if (room === 'main-hall') acc.focus = 'main-hall'
}

/* ── query answers ──────────────────────────────────────────── */

function answer(acc: Acc, topic: Topic, room: RoomId | undefined, entity: Entity | undefined) {
  const { lang } = acc
  const st = s()
  switch (topic) {
    case 'energy': {
      const e = num(st.energy.today, lang)
      const d = Math.abs(st.energy.deltaVsYesterday)
      const less = st.energy.deltaVsYesterday < 0
      let line = L(
        lang,
        `You've used ${e} kWh today — ${d}% ${less ? 'less' : 'more'} than yesterday.`,
        `Hoje você consumiu ${e} kWh — ${d}% ${less ? 'a menos' : 'a mais'} que ontem.`,
        `Hoy llevas ${e} kWh — un ${d}% ${less ? 'menos' : 'más'} que ayer.`,
      )
      if (st.eco.active)
        line += L(lang, ` Eco mode is saving about ${st.eco.savings}%.`, ` O modo Eco está economizando cerca de ${st.eco.savings}%.`, ` El modo Eco está ahorrando cerca de un ${st.eco.savings}%.`)
      acc.info.push(line)
      return
    }
    case 'solar': {
      const kw = num(st.solar.kw, lang)
      const peak = num(st.solar.peak, lang)
      const pct = Math.round((st.solar.kw / st.solar.peak) * 100)
      acc.info.push(
        L(
          lang,
          `Your panels are producing ${kw} kW right now — ${pct}% of today's ${peak} kW peak.`,
          `Seus painéis estão gerando ${kw} kW agora — ${pct}% do pico de hoje (${peak} kW).`,
          `Tus paneles están generando ${kw} kW ahora — un ${pct}% del pico de hoy (${peak} kW).`,
        ),
      )
      acc.focus = 'solar'
      return
    }
    case 'temp':
    case 'humidity': {
      const id = room ?? st.selectedRoom
      if (acc.answered.has(`temp:${id}`)) return
      if (topic === 'temp') acc.answered.add(`temp:${id}`)
      const r = st.rooms[id]
      const ref = cap(roomRef(id, lang))
      acc.info.push(
        topic === 'humidity'
          ? L(lang, `Humidity in ${roomRef(id, lang)} is ${r.humidity}%.`, `A umidade n${ROOM_NAME[id].pt[0]} ${ROOM_NAME[id].pt[1]} é de ${r.humidity}%.`, `La humedad en ${roomRef(id, lang)} es del ${r.humidity}%.`)
          : L(
              lang,
              `${ref} is at ${num(r.temperature, lang)}°C (set to ${num(r.target, lang)}°C) with ${r.humidity}% humidity.`,
              `${ref} está em ${num(r.temperature, lang)}°C (meta de ${num(r.target, lang)}°C), com umidade de ${r.humidity}%.`,
              `${ref} está a ${num(r.temperature, lang)}°C (objetivo ${num(r.target, lang)}°C), con ${r.humidity}% de humedad.`,
            ),
      )
      st.selectRoom(id)
      return
    }
    case 'occupancy': {
      if (room) {
        const r = st.rooms[room]
        const ref = cap(roomRef(room, lang))
        acc.info.push(
          r.occupants
            ? L(lang, `${ref} is occupied — ${r.occupants} ${r.occupants === 1 ? 'person' : 'people'}.`, `${ref} está ocupad${ROOM_NAME[room].pt[0]} — ${r.occupants} ${r.occupants === 1 ? 'pessoa' : 'pessoas'}.`, `${ref} está ocupad${ROOM_NAME[room].es[0] === 'el' ? 'o' : 'a'} — ${r.occupants} ${r.occupants === 1 ? 'persona' : 'personas'}.`)
            : L(lang, `${ref} is empty right now.`, `${ref} está vazi${ROOM_NAME[room].pt[0]} agora.`, `${ref} está vací${ROOM_NAME[room].es[0] === 'el' ? 'o' : 'a'} ahora.`),
        )
        st.selectRoom(room)
        return
      }
      const occupied = Object.values(st.rooms).filter((r) => r.occupants > 0)
      const total = occupied.reduce((n, r) => n + r.occupants, 0)
      const where = occupied.map((r) => `${roomRef(r.id, lang, false)} (${r.occupants})`).join(', ')
      acc.info.push(
        total
          ? L(lang, `${total} ${total === 1 ? 'person is' : 'people are'} home — ${where}.`, `${total} ${total === 1 ? 'pessoa em casa' : 'pessoas em casa'} — ${where}.`, `${total} ${total === 1 ? 'persona en casa' : 'personas en casa'} — ${where}.`)
          : L(lang, 'Nobody is home right now.', 'Não há ninguém em casa agora.', 'No hay nadie en casa ahora.'),
      )
      return
    }
    case 'door': {
      const locked = st.door.locked
      acc.info.push(
        L(
          lang,
          `The front door is ${locked ? 'locked' : 'unlocked'}.`,
          `A porta da frente está ${locked ? 'trancada' : 'destrancada'}.`,
          `La puerta principal está ${locked ? 'cerrada con llave' : 'abierta'}.`,
        ),
      )
      acc.focus = 'front-door'
      return
    }
    case 'eco': {
      acc.info.push(
        st.eco.active
          ? L(lang, `Eco mode is on — ${st.eco.savings}% savings today.`, `O modo Eco está ativo — ${st.eco.savings}% de economia hoje.`, `El modo Eco está activo — ${st.eco.savings}% de ahorro hoy.`)
          : L(lang, 'Eco mode is off.', 'O modo Eco está desligado.', 'El modo Eco está desactivado.'),
      )
      return
    }
    case 'devices': {
      const state = (b: boolean, fem = true) =>
        b ? tr(lang, ['on', fem ? 'ligada' : 'ligado', fem ? 'encendida' : 'encendido']) : tr(lang, ['off', fem ? 'desligada' : 'desligado', fem ? 'apagada' : 'apagado'])
      const is = lang === 'en' ? ' is ' : ' '
      const parts: Record<'tv' | 'sonos' | 'cleanbot' | 'lamp' | 'led', string> = {
        tv: `${L(lang, 'Smart OLED TV', 'Smart TV OLED', 'Smart TV OLED')}${is}${state(st.nodes.tv.on)}`,
        sonos: `Sonos Era 300${is}${st.nodes.sonos.on && st.speaker.playing ? tr(lang, ['playing', 'tocando', 'sonando']) : state(st.nodes.sonos.on, false)}`,
        cleanbot: `CleanBot V4${is}${st.nodes.cleanbot.on ? tr(lang, ['cleaning', 'limpando', 'limpiando']) : tr(lang, ['docked', 'na base', 'en su base'])}`,
        lamp: st.lamp.on ? `Hue Master Lamp ${L(lang, 'at', 'em', 'al')} ${Math.round(st.lamp.intensity)}%` : `Hue Master Lamp${is}${state(false)}`,
        led: `${L(lang, 'the LED strip', 'a fita LED', 'la tira LED')}${is}${state(st.led.on)}`,
      }
      if (entity === 'music') {
        acc.info.push(cap(parts.sonos) + (st.speaker.playing && st.nodes.sonos.on ? ` — “${st.speaker.track}”, ${st.speaker.artist}.` : '.'))
        return
      }
      if (entity && entity in parts) {
        acc.info.push(cap(parts[entity as keyof typeof parts]) + '.')
        return
      }
      acc.info.push(cap(joinList([parts.tv, parts.sonos, parts.cleanbot, parts.lamp, parts.led], lang)) + '.')
      return
    }
  }
}

/* ── clause parser ──────────────────────────────────────────── */

interface Ctx {
  verb?: Verb
  entity?: Entity
  room?: RoomId
}

/** Remembers the last device across messages ("turn it off"). */
let memory: Ctx = {}

const findRoom = (c: string) => ROOMS.find(([, w]) => has(c, w))?.[0]
const findEntities = (c: string) => ENTITIES.filter(([, w]) => has(c, w)).map(([e]) => e)
const findVerb = (c: string) => VERBS.find(([, w]) => has(c, w))?.[0]
const findNumber = (c: string) => {
  const m = c.match(/(\d+(?:\.\d+)?)/)
  return m ? parseFloat(m[1]) : undefined
}

function isQuestion(raw: string, c: string) {
  const head = c.replace(/^[^a-z0-9]+/, '')
  const startsQ = QUESTION_START.some((w) => head === w || (head.startsWith(w) && /[^a-z0-9]/.test(head.charAt(w.length))))
  const politeAction = /^(can you|could you|would you|will you|please|pode|podes|poderia|voce pode|puedes|podrias|por favor)\b/.test(c)
  if (politeAction) return false
  if (startsQ) return true
  if (raw.includes('?')) {
    const strongVerb = VERBS.some(([v, w]) => v !== 'on' && v !== 'off' && has(c, w)) || has(c, ['turn on', 'turn off', 'liga', 'desliga', 'enciende', 'apaga'])
    return !strongVerb
  }
  return false
}

function handleClause(acc: Acc, raw: string, c: string, ctx: Ctx): boolean {
  const { lang } = acc
  const room = findRoom(c)
  const ents = findEntities(c)
  const verb0 = findVerb(c)
  const n = findNumber(c)
  const hasDeg = c.includes('°') || has(c, ['degrees', 'graus', 'grados', 'celsius'])

  if (room) ctx.room = room

  /* — queries — */
  if (isQuestion(raw, c)) {
    let topics = TOPICS.filter(([, w]) => has(c, w)).map(([t]) => t)
    if (topics.includes('solar')) topics = topics.filter((t) => t !== 'energy')
    if (topics.includes('door')) topics = topics.filter((t) => t !== 'devices')
    if (topics.includes('temp') || topics.includes('humidity')) topics = topics.filter((t) => t !== 'devices' && t !== 'occupancy')
    if (topics.includes('temp')) topics = topics.filter((t) => t !== 'humidity')
    const deviceEnt = ents.find((e) => e in BIN || e === 'music')
    if (deviceEnt && deviceEnt !== 'door' && deviceEnt !== 'eco') topics = ['devices']
    if (!topics.length && (room || ctx.room)) topics = ['temp']
    if (!topics.length) return false
    if (deviceEnt) ctx.entity = deviceEnt
    for (const t of topics.slice(0, 3)) answer(acc, t, room ?? ctx.room, deviceEnt)
    return true
  }

  /* — comfort phrases: "I'm cold" / "estou com frio" / "tengo calor" — */
  if (/\b(i m|im|i am|estou|tengo|estoy)\b.*\b(cold|freezing|frio)\b/.test(c) || /\b(i m|im|i am|estou|tengo|estoy)\b.*\b(hot|warm|calor)\b/.test(c)) {
    const cold = /\b(cold|freezing|frio)\b/.test(c)
    const id = room ?? ctx.room ?? s().selectedRoom
    applyTemp(acc, id, s().rooms[id].target + (cold ? 1 : -1))
    return true
  }

  /* — climate mode — */
  if (has(c, ['mode', 'modo'])) {
    const mode = MODES.find(([, w]) => has(c, w))?.[0]
    if (mode && mode !== 'eco') {
      const before = s().climate.mode
      s().setClimateMode(mode)
      const name = tr(lang, MODE_NAME[mode])
      if (before === mode) acc.already.push(L(lang, `climate is already in ${name} mode`, `a climatização já está no modo ${name}`, `el clima ya está en modo ${name}`))
      else acc.done.push(L(lang, `switched climate to ${name} mode`, `mudei a climatização para o modo ${name}`, `cambié el clima a modo ${name}`))
      chip(acc, `${MODE_NAME[mode][0]} mode`)
      return true
    }
  }

  const verb = verb0 ?? ctx.verb
  if (verb0) ctx.verb = verb0

  // Pick the main entity of the clause (or inherit "it")
  let entities = ents.filter((e) => e !== 'temp' || ents.length === 1)
  if (!entities.length && ents.includes('temp')) entities = ['temp']
  // "lights" plural → lamp + LED strip
  if (has(c, ['lights', 'luzes', 'luces']) && !entities.includes('led')) entities = [...entities.filter((e) => e !== 'lamp'), 'lamp', 'led']
  if (entities.includes('sonos')) entities = entities.filter((e) => e !== 'music')
  // "clean" is a verb for the robot
  if (entities.includes('cleanbot') && !verb0 && has(c, ['clean', 'limpa', 'limpar', 'limpia', 'limpiar', 'aspira', 'aspirar'])) ctx.verb = 'on'

  // Temperature shortcut: number + (room | °) and no device
  const deviceLike = entities.filter((e) => e !== 'temp' && e !== 'all')
  if (n !== undefined && !deviceLike.length && (entities.includes('temp') || hasDeg || room || (!entities.length && ctx.entity === 'temp'))) {
    const id = room ?? ctx.room ?? s().selectedRoom
    const delta = verb === 'up' || verb === 'down' ? n <= 6 : false
    const target = delta ? s().rooms[id].target + (verb === 'up' ? n : -n) : n
    applyTemp(acc, id, target)
    ctx.entity = 'temp'
    return true
  }

  if (!entities.length && verb && ctx.entity) entities = [ctx.entity]
  if (!entities.length && verb && !has(c, SCENES.flatMap((x) => x.keywords)) && memory.entity) entities = [memory.entity]

  if (entities.length) {
    let handled = false
    for (const e of entities) {
      if (handleEntity(acc, e, ctx.verb ?? verb, n, c, room ?? ctx.room)) {
        handled = true
        ctx.entity = e
      }
    }
    if (handled) return true
  }

  /* — scenes — */
  const scene = SCENES.find((x) => has(c, x.keywords))
  if (scene) {
    const actions = scene.run()
    const name = scene.name
    acc.done.push(L(lang, `started “${name}”`, `ativei a cena “${name}”`, `activé la escena “${name}”`))
    actions.forEach((a) => chip(acc, a))
    acc.focus = undefined // scenes set their own camera focus
    return true
  }

  return false
}

function handleEntity(acc: Acc, e: Entity, verb: Verb | undefined, n: number | undefined, c: string, room: RoomId | undefined): boolean {
  const { lang } = acc
  switch (e) {
    case 'all': {
      if (verb !== 'on' && verb !== 'off') return false
      const on = verb === 'on'
      ;(['tv', 'sonos', 'lamp', 'led'] as const).forEach((k) => applyBinary(acc, k, on))
      return true
    }
    case 'temp': {
      const id = room ?? s().selectedRoom
      if (verb === 'up' || verb === 'down') {
        applyTemp(acc, id, s().rooms[id].target + (verb === 'up' ? 1 : -1))
        return true
      }
      if (n !== undefined) {
        applyTemp(acc, id, n)
        return true
      }
      return false
    }
    case 'music': {
      if (verb === 'pause' || verb === 'off') {
        if (!s().speaker.playing) acc.already.push(L(lang, 'the music was already paused', 'a música já estava pausada', 'la música ya estaba en pausa'))
        else {
          s().setSpeaker({ playing: false })
          acc.done.push(L(lang, 'paused the music', 'pausei a música', 'pausé la música'))
        }
        chip(acc, L(lang, 'Music paused', 'Música pausada', 'Música en pausa'))
        return true
      }
      if (verb === 'play' || verb === 'on' || verb === 'set' || verb === undefined) {
        s().toggleNode('sonos', true)
        s().setSpeaker({ on: true, playing: true })
        const { track, artist } = s().speaker
        acc.done.push(L(lang, `started “${track}” by ${artist} on the Sonos`, `coloquei “${track}”, de ${artist}, no Sonos`, `puse “${track}” de ${artist} en el Sonos`))
        chip(acc, L(lang, 'Music playing', 'Música tocando', 'Música sonando'))
        return true
      }
      if (verb === 'up' || verb === 'down') return handleEntity(acc, 'volume', verb, n, c, room)
      return false
    }
    case 'volume': {
      const cur = s().speaker.volume
      const up = verb === 'up' || has(c, ['louder', 'mais alto', 'mas alto'])
      const down = verb === 'down' || has(c, ['quieter', 'mais baixo', 'mas bajo'])
      const next = n !== undefined && !(up || down) ? n : n !== undefined && n <= 30 ? cur + (up ? n : -n) : n !== undefined ? n : cur + (up ? 10 : down ? -10 : 0)
      const v = Math.round(Math.min(100, Math.max(0, next)))
      s().toggleNode('sonos', true)
      s().setSpeaker({ on: true, volume: v })
      acc.done.push(L(lang, `set the Sonos volume to ${v}%`, `ajustei o volume do Sonos para ${v}%`, `ajusté el volumen del Sonos al ${v}%`))
      chip(acc, `Volume ${v}%`)
      return true
    }
    case 'sonos': {
      if (verb === 'play') return handleEntity(acc, 'music', 'play', n, c, room)
      if (verb === 'pause') return handleEntity(acc, 'music', 'pause', n, c, room)
      if (n !== undefined || verb === 'up' || verb === 'down') return handleEntity(acc, 'volume', verb, n, c, room)
      if (verb === 'on' || verb === 'off') {
        applyBinary(acc, 'sonos', verb === 'on')
        return true
      }
      return false
    }
    case 'lamp': {
      if (n !== undefined && verb !== 'off') {
        const cur = s().lamp.intensity
        const v = Math.round(Math.min(100, Math.max(0, verb === 'up' && n <= 50 && !c.includes('%') ? cur + n : verb === 'down' && n <= 50 && !c.includes('%') ? cur - n : n)))
        s().setLamp({ on: v > 0, intensity: v })
        acc.done.push(L(lang, `set the Hue Master Lamp to ${v}%`, `ajustei a Hue Master Lamp para ${v}%`, `ajusté la Hue Master Lamp al ${v}%`))
        chip(acc, L(lang, `Lamp ${v}%`, `Luminária ${v}%`, `Lámpara ${v}%`))
        return true
      }
      if (verb === 'up' || verb === 'down') {
        const v = Math.round(Math.min(100, Math.max(0, s().lamp.intensity + (verb === 'up' ? 20 : -20))))
        s().setLamp({ on: v > 0, intensity: v })
        acc.done.push(
          verb === 'up'
            ? L(lang, `brightened the Hue Master Lamp to ${v}%`, `aumentei a Hue Master Lamp para ${v}%`, `subí la Hue Master Lamp al ${v}%`)
            : L(lang, `dimmed the Hue Master Lamp to ${v}%`, `diminuí a Hue Master Lamp para ${v}%`, `bajé la Hue Master Lamp al ${v}%`),
        )
        chip(acc, L(lang, `Lamp ${v}%`, `Luminária ${v}%`, `Lámpara ${v}%`))
        return true
      }
      if (verb === 'on' || verb === 'off') {
        applyBinary(acc, 'lamp', verb === 'on')
        return true
      }
      return false
    }
    case 'led': {
      const color = COLORS.find((x) => has(c, x.words))
      if (color) {
        s().setLed({ on: true, color: color.hex })
        acc.done.push(L(lang, `changed the LED strip to ${color.name[0]}`, `mudei a fita LED para ${color.name[1]}`, `cambié la tira LED a ${color.name[2]}`))
        chip(acc, `LED ${color.name[0]}`)
        return true
      }
      if (n !== undefined && verb !== 'off') {
        const v = Math.round(Math.min(100, Math.max(0, n)))
        s().setLed({ on: v > 0, brightness: v })
        acc.done.push(L(lang, `set the LED strip to ${v}%`, `ajustei a fita LED para ${v}%`, `ajusté la tira LED al ${v}%`))
        chip(acc, `LED ${v}%`)
        return true
      }
      if (verb === 'on' || verb === 'off') {
        applyBinary(acc, 'led', verb === 'on')
        return true
      }
      return false
    }
    case 'door': {
      if (verb === 'lock' || verb === 'unlock') {
        applyBinary(acc, 'door', verb === 'lock')
        return true
      }
      if (verb === 'on' || verb === 'off') {
        applyBinary(acc, 'door', verb === 'on')
        return true
      }
      return false
    }
    case 'eco': {
      applyBinary(acc, 'eco', verb !== 'off')
      return true
    }
    case 'tv':
    case 'cleanbot': {
      if (verb === 'on' || verb === 'off' || verb === 'play' || verb === 'pause') {
        applyBinary(acc, e, verb === 'on' || verb === 'play')
        return true
      }
      return false
    }
  }
}

/* ── reply composition ──────────────────────────────────────── */

export function joinList(items: string[], lang: Lang) {
  if (items.length <= 1) return items.join('')
  const and = L(lang, ' and ', ' e ', ' y ')
  return `${items.slice(0, -1).join(', ')}${and}${items[items.length - 1]}`
}

function compose(acc: Acc): string {
  const { lang } = acc
  const out: string[] = []
  if (acc.done.length) out.push(`${L(lang, 'Done — I ', 'Pronto — ', 'Listo — ')}${joinList(acc.done, lang)}.`)
  if (acc.already.length) {
    const sentence = joinList(acc.already, lang)
    out.push(acc.done.length ? `${cap(sentence)}.` : `${L(lang, 'All set — ', 'Tudo certo — ', 'Todo listo — ')}${sentence}.`)
  }
  out.push(...acc.info)
  return out.join(' ')
}

const GREETING = ['hi', 'hello', 'hey', 'good afternoon', 'good morning', 'good evening', 'oi', 'ola', 'boa tarde', 'hola', 'buenas', 'buenas tardes', 'buenos dias']
const THANKS = ['thanks', 'thank you', 'thx', 'obrigado', 'obrigada', 'valeu', 'gracias']
const HELP = ['help', 'what can you do', 'ajuda', 'o que voce faz', 'o que voce pode', 'ayuda', 'que puedes hacer']

const CAPABILITIES: Tri = [
  'I can adjust climate per room, dim the Hue lamp, recolor the LED strip, control the TV, Sonos and CleanBot, lock the front door, run scenes like Movie Night, and report energy, solar and occupancy.',
  'Posso ajustar o clima de cada cômodo, a luminária Hue, a cor da fita LED, controlar a TV, o Sonos e o CleanBot, trancar a porta, ativar cenas como Movie Night e informar energia, solar e ocupação.',
  'Puedo ajustar el clima de cada estancia, la lámpara Hue, el color de la tira LED, controlar la TV, el Sonos y el CleanBot, cerrar la puerta, activar escenas como Movie Night e informarte de energía, solar y ocupación.',
]

const FALLBACK: Tri = [
  'I didn’t quite catch that. Try “Set Main Hall to 21°”, “Turn off the TV”, “Lock the front door” or “Start movie night”.',
  'Não entendi bem. Tente “Coloca a sala em 21 graus”, “Desliga a TV”, “Tranca a porta” ou “Ativa o modo cinema”.',
  'No te entendí bien. Prueba “Pon el salón a 21 grados”, “Apaga la tele”, “Cierra la puerta” o “Activa el modo cine”.',
]

export const SUGGESTIONS: Record<Lang, string[]> = {
  en: ['Start movie night', 'Lock the front door', 'How much solar right now?', 'Set Main Hall to 21°'],
  pt: ['Ativar modo cinema', 'Trancar a porta da frente', 'Quanto de solar agora?', 'Coloca a sala em 21°'],
  es: ['Activar modo cine', 'Cerrar la puerta principal', '¿Cuánta energía solar ahora?', 'Pon el salón a 21°'],
}

export const WELCOME: Tri = [
  'Hi Alejandra — I can tune climate, lights, devices and security for you. What would you like to do?',
  'Oi, Alejandra — posso ajustar clima, luzes, dispositivos e segurança para você. O que deseja fazer?',
  'Hola, Alejandra — puedo ajustar el clima, las luces, los dispositivos y la seguridad. ¿Qué quieres hacer?',
]

/** Parse, execute and answer. Pure-ish: all side effects go through the store. */
export function interpret(raw: string): BrainReply {
  const lang = detectLang(raw)
  const acc: Acc = { lang, done: [], already: [], info: [], chips: [], answered: new Set() }
  const t = normalize(raw)

  if (has(t, HELP)) return { lang, text: tr(lang, CAPABILITIES), actions: [] }

  const clauses = t
    .split(/\s*(?:[,;]|\.(?!\d)|\band then\b|\bthen\b|\bdepois\b|\bem seguida\b|\bluego\b|\bdespues\b|\band\b|\be\b|\by\b|\balso\b|\btambem\b|\btambien\b)\s*/)
    .map((x) => x.trim())
    .filter(Boolean)

  // A single room mentioned anywhere applies to every clause ("temperature and humidity in the kitchen")
  const mentioned = ROOMS.filter(([, w]) => has(t, w))
  const ctx: Ctx = mentioned.length === 1 ? { room: mentioned[0][0] } : {}
  let understood = false
  for (const c of clauses) if (handleClause(acc, raw, c, ctx)) understood = true

  if (ctx.entity && ctx.entity !== 'all') memory = { entity: ctx.entity }
  if (acc.focus) s().setFocus(acc.focus)

  if (!understood) {
    if (has(t, THANKS)) return { lang, text: L(lang, 'Anytime, Alejandra.', 'Por nada, Alejandra!', '¡De nada, Alejandra!'), actions: [] }
    if (has(t, GREETING)) return { lang, text: `${L(lang, 'Hi Alejandra!', 'Oi, Alejandra!', '¡Hola, Alejandra!')} ${tr(lang, CAPABILITIES)}`, actions: [] }
    return { lang, text: tr(lang, FALLBACK), actions: [] }
  }
  return { lang, text: compose(acc), actions: acc.chips }
}
