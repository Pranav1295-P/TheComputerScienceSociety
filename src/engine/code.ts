// One compact source per algorithm, printed as C++, Java or Python.
// Lines tagged "@tag" are what simulation steps highlight.

export type Lang = 'cpp' | 'java' | 'python'
export const LANGS: { id: Lang; label: string }[] = [
  { id: 'cpp', label: 'C++' },
  { id: 'java', label: 'Java' },
  { id: 'python', label: 'Python' },
]

export interface CodeLine {
  text: string
  tag?: string
}

export interface Algo {
  name: string
  params: string[]
  ret?: string
  body: { dsl: string; indent: number; tag?: string }[]
}

export function algo(name: string, params: string[], src: string, ret?: string): Algo {
  const body = src
    .split('\n')
    .filter((l) => l.trim())
    .map((raw) => {
      const indent = (raw.length - raw.trimStart().length) / 2
      const m = raw.trim().match(/^(.*?)\s+@(\w+)$/)
      return { dsl: m ? m[1] : raw.trim(), tag: m?.[2], indent }
    })
  return { name, params, ret, body }
}

function expr(s: string, lang: Lang) {
  if (lang === 'python') {
    return s
      .replace(/== null/g, 'is None')
      .replace(/!= null/g, 'is not None')
      .replace(/\bnull\b/g, 'None')
      .replace(/\btrue\b/g, 'True')
      .replace(/\bfalse\b/g, 'False')
      .replace(/ \/ /g, ' // ')
      .replace(/\bnew\(/g, 'Node(')
  }
  let out = s.replace(/\bnew\(/g, 'new Node(').replace(/ and /g, ' && ')
  if (lang === 'cpp') {
    out = out.replace(/\bnull\b/g, 'nullptr').replace(/\.(next|prev|val)\b/g, '->$1')
  }
  return out
}

function stmt(s: string, lang: Lang): string {
  const free = s.match(/^free\((.+)\)$/)
  if (free) {
    if (lang === 'cpp') return `delete ${free[1]};`
    const c = lang === 'java' ? '//' : '#'
    return `${c} garbage collector reclaims ${free[1]}`
  }
  const thrown = s.match(/^throw "(.+)"$/)
  if (thrown) {
    if (lang === 'python') return `raise Exception("${thrown[1]}")`
    return lang === 'java' ? `throw new RuntimeException("${thrown[1]}");` : `throw runtime_error("${thrown[1]}");`
  }
  const block = s.match(/^array (\w+) = (.+)$/)
  if (block) {
    if (lang === 'python') return `${block[1]} = [0] * (${block[2]})`
    return lang === 'java' ? `int[] ${block[1]} = new int[${block[2]}];` : `int* ${block[1]} = new int[${block[2]}];`
  }
  const num = s.match(/^int (\w+) = (.+)$/)
  if (num) return lang === 'python' ? expr(`${num[1]} = ${num[2]}`, lang) : `int ${num[1]} = ${expr(num[2], lang)};`
  const inc = s.match(/^(\w+)(\+\+|--)$/)
  if (inc && lang === 'python') return `${inc[1]} ${inc[2] === '++' ? '+=' : '-='} 1`
  const decl = s.match(/^let (\w+) = (.+)$/)
  if (lang === 'python') return expr(decl ? `${decl[1]} = ${decl[2]}` : s, lang)
  const t = lang === 'cpp' ? 'Node*' : 'Node'
  return expr(decl ? `${t} ${decl[1]} = ${decl[2]}` : s, lang) + ';'
}

function translate(s: string, lang: Lang): { text: string; opens?: boolean; continues?: boolean } {
  const inline = s.match(/^(if|while) (.+?): (.+)$/)
  if (inline) {
    return lang === 'python'
      ? { text: `${inline[1]} ${expr(inline[2], lang)}: ${stmt(inline[3], lang)}` }
      : { text: `${inline[1]} (${expr(inline[2], lang)}) ${stmt(inline[3], lang)}` }
  }
  const block = s.match(/^(if|while) (.+):$/)
  if (block) {
    return lang === 'python'
      ? { text: `${block[1]} ${expr(block[2], lang)}:`, opens: true }
      : { text: `${block[1]} (${expr(block[2], lang)}) {`, opens: true }
  }
  const loop = s.match(/^for i in 0\.\.(.+):$/)
  if (loop) {
    return lang === 'python'
      ? { text: `for i in range(${loop[1]}):`, opens: true }
      : { text: `for (int i = 0; i < ${loop[1]}; i++) {`, opens: true }
  }
  const range = s.match(/^(up|down) (\w+) from (.+) to (.+):$/)
  if (range) {
    const [, dir, v, a, b] = range
    if (lang === 'python') return { text: `for ${v} in range(${a}, ${b}${dir === 'down' ? ', -1' : ''}):`, opens: true }
    return { text: `for (int ${v} = ${a}; ${v} ${dir === 'up' ? '<' : '>'} ${b}; ${v}${dir === 'up' ? '++' : '--'}) {`, opens: true }
  }
  if (s === 'else:') {
    return lang === 'python' ? { text: 'else:', opens: true } : { text: '} else {', opens: true, continues: true }
  }
  return { text: stmt(s, lang) }
}

export function printAlgo(a: Algo, lang: Lang): CodeLine[] {
  const pad = '    '
  const out: CodeLine[] = []
  if (lang === 'python') {
    out.push({ text: `def ${a.name}(${a.params.join(', ')}):` })
  } else {
    out.push({ text: `${a.ret ?? 'void'} ${a.name}(${a.params.map((p) => `int ${p}`).join(', ')}) {` })
  }
  let depth = 1
  for (const line of a.body) {
    const target = line.indent + 1
    const t = translate(line.dsl, lang)
    if (lang !== 'python') {
      const until = t.continues ? target + 1 : target
      while (depth > until) {
        depth--
        out.push({ text: pad.repeat(depth) + '}' })
      }
    }
    out.push({ text: pad.repeat(target) + t.text, tag: line.tag })
    depth = t.opens ? target + 1 : target
  }
  if (lang !== 'python') {
    while (depth > 1) {
      depth--
      out.push({ text: pad.repeat(depth) + '}' })
    }
    out.push({ text: '}' })
  }
  return out
}

const KW: Record<Lang, Set<string>> = {
  cpp: new Set('void int bool return if else while for new delete nullptr struct class public auto true false this break throw'.split(' ')),
  java: new Set('void int boolean bool return if else while for new null class public true false break throw'.split(' ')),
  python: new Set('def return if elif else while for in range None True False is not and or class self import from break raise'.split(' ')),
}

export function tokenize(line: string, lang: Lang): { t: string; c: string }[] {
  const cm = lang === 'python' ? line.indexOf('#') : line.indexOf('//')
  const code = cm >= 0 ? line.slice(0, cm) : line
  const out = code
    .split(/(\b\w+\b)/)
    .filter((p) => p !== '')
    .map((t) => ({
      t,
      c: KW[lang].has(t) ? 'kw' : /^\d+$/.test(t) ? 'num' : /^(next|prev|val)$/.test(t) ? 'fld' : /^(Node|ListNode)$/.test(t) ? 'typ' : '',
    }))
  if (cm >= 0) out.push({ t: line.slice(cm), c: 'cmt' })
  return out
}
