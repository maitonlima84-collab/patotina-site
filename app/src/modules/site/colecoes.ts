import { z } from 'zod'
import { dataCurta, hojeIso } from '@/shared/lib/utils'
import type { Destaque, Historia, ItemDoSite, Parceiro, Textos, Titulo, Turma } from './types'

/**
 * Descrição das seções editáveis: quais campos existem, de que tipo são e
 * como cada item aparece na lista. O formulário, a validação (zod) e a
 * gravação se apoiam nesta única definição — acrescentar um campo é mexer
 * só aqui (e no site, que o mostra).
 */

export type TipoCampo = 'texto' | 'area' | 'numero' | 'url' | 'data' | 'sim' | 'imagem'

export interface CampoDef {
  n: string
  r: string
  t: TipoCampo
  obrig?: boolean
  dica?: string
  metade?: boolean
  padrao?: string | number | boolean
  max?: number
  // só para t = 'imagem'
  pasta?: string
  larguraMax?: number
  proporcao?: number
  larga?: boolean
}

export interface SecaoDef<T extends ItemDoSite = ItemDoSite> {
  id: string
  colecao: string
  titulo: string
  ajuda: string
  nomeItem: string
  ordenavel?: boolean
  // Como ordenar a lista no painel (o site usa a mesma regra).
  ordenar: (a: T, b: T) => number
  nome: (item: T) => string
  resumo: (item: T) => string
  miniatura?: (item: T) => string
  campos: CampoDef[]
}

const porOrdem = (a: { ordem: number }, b: { ordem: number }) => a.ordem - b.ordem

export const TURMAS: SecaoDef<Turma> = {
  id: 'turmas',
  colecao: 'site_turmas',
  titulo: 'Turmas',
  ajuda: 'Os cards de "Turmas e horários". A idade mínima e máxima é o que sugere a turma no formulário de pré-matrícula.',
  nomeItem: 'turma',
  ordenavel: true,
  ordenar: porOrdem,
  nome: (t) => t.nome,
  resumo: (t) => [t.faixa && `${t.faixa} anos`, t.horarios.split('\n').filter(Boolean).length + ' treino(s)/semana', t.destaque && 'em destaque'].filter(Boolean).join(' · '),
  campos: [
    { n: 'nome', r: 'Nome da turma', t: 'texto', obrig: true, max: 40, dica: 'Ex.: Fut Baby, Iniciação, Formação.' },
    { n: 'faixa', r: 'Faixa etária (como aparece)', t: 'texto', metade: true, max: 12, dica: 'Ex.: "4 a 6" ou "10+".' },
    { n: 'idadeMin', r: 'Idade mínima', t: 'numero', metade: true, padrao: 4 },
    { n: 'idadeMax', r: 'Idade máxima', t: 'numero', metade: true, padrao: 14, dica: 'Usada só para sugerir a turma na pré-matrícula.' },
    { n: 'descricao', r: 'Descrição', t: 'area', max: 200, dica: 'Uma ou duas frases curtas.' },
    { n: 'horarios', r: 'Treinos', t: 'area', max: 600, dica: 'Um treino por linha, separando com |. Ex.: SEX | 18h00 – 18h50 | Campo do Clube' },
    { n: 'mensagem', r: 'Mensagem do WhatsApp', t: 'texto', max: 200, dica: 'O que abre pronto ao tocar em "Quero essa turma".' },
    { n: 'destaque', r: 'Card em destaque (borda dourada)', t: 'sim' },
    { n: 'visivel', r: 'Aparecer no site', t: 'sim', padrao: true },
  ],
}

export const DESTAQUES: SecaoDef<Destaque> = {
  id: 'destaques',
  colecao: 'site_destaques',
  titulo: 'Destaques',
  ajuda: 'As novidades da escolinha. O card grande é o marcado como principal; os outros ficam ao lado, do mais novo para o mais antigo. Sem nenhum destaque, a seção some do site.',
  nomeItem: 'destaque',
  ordenar: (a, b) => Number(b.principal) - Number(a.principal) || b.publicadoEm.localeCompare(a.publicadoEm),
  nome: (d) => d.titulo,
  resumo: (d) => [dataCurta(d.publicadoEm), d.principal && 'card grande'].filter(Boolean).join(' · '),
  campos: [
    { n: 'titulo', r: 'Título', t: 'texto', obrig: true, max: 90 },
    { n: 'texto', r: 'Texto', t: 'area', max: 800, dica: 'Entre *asteriscos* o trecho fica em negrito.' },
    { n: 'citacao', r: 'Frase em destaque', t: 'texto', max: 200, dica: 'Só aparece no card grande. Ex.: "O primeiro passo foi dado."' },
    { n: 'publicadoEm', r: 'Data', t: 'data', metade: true },
    { n: 'link', r: 'Link', t: 'url', metade: true, dica: 'Opcional: post no Instagram, matéria…' },
    { n: 'principal', r: 'Card grande (principal)', t: 'sim' },
    { n: 'visivel', r: 'Aparecer no site', t: 'sim', padrao: true },
  ],
}

export const TITULOS: SecaoDef<Titulo> = {
  id: 'titulos',
  colecao: 'site_titulos',
  titulo: 'Títulos',
  ajuda: 'A sala de troféus. O número de troféus na faixa dourada do site é contado sozinho.',
  nomeItem: 'título',
  ordenavel: true,
  ordenar: porOrdem,
  nome: (t) => t.nome,
  resumo: (t) => [t.ano, t.icone, t.destaque && 'card dourado'].filter(Boolean).join(' · '),
  campos: [
    { n: 'nome', r: 'Nome do título', t: 'texto', obrig: true, max: 90 },
    { n: 'ano', r: 'Ano', t: 'texto', metade: true, max: 12 },
    { n: 'icone', r: 'Ícone', t: 'texto', metade: true, max: 8, padrao: '🏆', dica: '🏆 campeão, 🥈 vice…' },
    { n: 'descricao', r: 'Descrição', t: 'area', max: 300, dica: 'A história curta da conquista.' },
    { n: 'destaque', r: 'Card dourado', t: 'sim' },
    { n: 'visivel', r: 'Aparecer no site', t: 'sim', padrao: true },
  ],
}

export const HISTORIA: SecaoDef<Historia> = {
  id: 'historia',
  colecao: 'site_historia',
  titulo: 'Linha do tempo',
  ajuda: 'A história do time, ano a ano, na seção "O time que deu origem a tudo".',
  nomeItem: 'marco',
  ordenavel: true,
  ordenar: porOrdem,
  nome: (h) => h.titulo,
  resumo: (h) => [h.ano, h.destaque && 'em destaque'].filter(Boolean).join(' · '),
  campos: [
    { n: 'ano', r: 'Ano', t: 'texto', obrig: true, metade: true, max: 12 },
    { n: 'titulo', r: 'Título', t: 'texto', obrig: true, max: 90 },
    { n: 'texto', r: 'Texto', t: 'area', max: 600, dica: 'Entre *asteriscos* o trecho fica em negrito.' },
    { n: 'link', r: 'Link', t: 'url', metade: true, dica: 'Opcional.' },
    { n: 'linkTexto', r: 'Texto do link', t: 'texto', metade: true, max: 40, dica: 'Ex.: @patotinaoficial ↗' },
    { n: 'destaque', r: 'Marco em destaque (dourado)', t: 'sim' },
    { n: 'visivel', r: 'Aparecer no site', t: 'sim', padrao: true },
  ],
}

export const PARCEIROS: SecaoDef<Parceiro> = {
  id: 'parceiros',
  colecao: 'site_parceiros',
  titulo: 'Parceiros',
  ajuda: 'Os patrocinadores e apoiadores. Sem logo enviado, o site escreve o nome com a fonte do clube.',
  nomeItem: 'parceiro',
  ordenavel: true,
  ordenar: porOrdem,
  nome: (p) => p.nome.replace('|', ' '),
  resumo: (p) => [p.rotulo, p.master && 'card grande'].filter(Boolean).join(' · '),
  miniatura: (p) => p.logoUrl,
  campos: [
    { n: 'nome', r: 'Nome', t: 'texto', obrig: true, max: 60, dica: 'Use | antes da parte que vai para a linha de baixo. Ex.: SICOOB |CREDITIROS' },
    { n: 'rotulo', r: 'Rótulo', t: 'texto', max: 40, dica: 'Linha pequena abaixo do nome. Ex.: PARCEIRO MASTER, APOIO INSTITUCIONAL.' },
    { n: 'logo', r: 'Logo', t: 'imagem', pasta: 'parceiros', larguraMax: 600, larga: true, dica: 'PNG com fundo transparente fica melhor. Opcional.' },
    { n: 'site', r: 'Site', t: 'url', dica: 'Opcional. Precisa começar com https://' },
    { n: 'master', r: 'Card grande (máster)', t: 'sim' },
    { n: 'visivel', r: 'Aparecer no site', t: 'sim', padrao: true },
  ],
}

// Cada seção é tipada com o próprio item; a lista mistura todas, e o painel
// genérico só usa o que é comum (id, visivel, ordem).
export const LISTA_SECOES = [TURMAS, DESTAQUES, TITULOS, HISTORIA, PARCEIROS] as unknown as SecaoDef[]

/* Textos soltos do site, editados de uma vez só. */
export const CAMPOS_TEXTOS: Array<{ n: keyof Textos; r: string; t?: 'area'; dica?: string }> = [
  { n: 'whatsapp', r: 'WhatsApp da matrícula', dica: 'Só números, com DDD. Ex.: 34988658518. Vale para todos os botões do site.' },
  { n: 'anosEscolinha', r: 'Anos de escolinha', dica: 'Só o número. Aparece na faixa dourada.' },
  { n: 'heroEyebrow', r: 'Topo · linha dourada', dica: 'Ex.: » MATUTINA · MINAS GERAIS · ESCOLINHA DESDE 2021' },
  { n: 'heroTag', r: 'Topo · frase de apoio', t: 'area', dica: 'Entre *asteriscos* o trecho fica em branco e negrito.' },
  { n: 'heroChips', r: 'Topo · selos', t: 'area', dica: 'Um por linha. Comece a linha com * para o selo dourado. Ex.: *⭐ Aluno aprovado na peneira do Cruzeiro' },
  { n: 'turmasTag', r: 'Turmas · linha dourada' },
  { n: 'turmasTitulo', r: 'Turmas · título', dica: 'O que vem depois de | fica dourado. Ex.: TURMAS E |HORÁRIOS' },
  { n: 'turmasSub', r: 'Turmas · frase de apoio', t: 'area' },
  { n: 'turmasNota', r: 'Turmas · observação', t: 'area', dica: 'Aparece abaixo dos cards. Entre *asteriscos* fica dourado.' },
  { n: 'destaquesTag', r: 'Destaques · linha dourada' },
  { n: 'destaquesTitulo', r: 'Destaques · título' },
  { n: 'titulosTag', r: 'Títulos · linha dourada' },
  { n: 'titulosTitulo', r: 'Títulos · título' },
  { n: 'professorNome', r: 'Professor · nome' },
  { n: 'professorDesc', r: 'Professor · descrição', t: 'area', dica: 'Entre *asteriscos* fica em branco e negrito. Ex.: *CREF 046342-G/MG*' },
  { n: 'professorInstagram', r: 'Professor · Instagram', dica: 'Endereço completo, começando com https://' },
  { n: 'parceirosTag', r: 'Parceiros · linha dourada' },
  { n: 'parceirosTitulo', r: 'Parceiros · título' },
]

/* ------------------------------------------------------------------ */
/* Validação                                                           */
/* ------------------------------------------------------------------ */

const url = z
  .string()
  .trim()
  .max(300, 'Endereço longo demais.')
  .refine((v) => !v || /^https?:\/\//i.test(v), 'O endereço precisa começar com https://')

const data = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data.')

/** Monta o esquema zod de uma seção a partir da lista de campos. */
export function esquemaDaSecao(secao: SecaoDef) {
  const forma: Record<string, z.ZodType> = {}
  for (const c of secao.campos) {
    switch (c.t) {
      case 'texto':
      case 'area': {
        let s = z.string().trim().max(c.max ?? 200, `No máximo ${c.max ?? 200} caracteres.`)
        if (c.obrig) s = s.min(1, 'Preencha este campo.')
        forma[c.n] = s
        break
      }
      case 'numero':
        forma[c.n] = z.coerce.number().int().min(0).max(99999)
        break
      case 'url':
        forma[c.n] = url
        break
      case 'data':
        forma[c.n] = data
        break
      case 'sim':
        forma[c.n] = z.boolean()
        break
      case 'imagem':
        // O caminho no Storage e a URL pública andam juntos (ver CampoImagem).
        forma[c.n] = z.string()
        forma[`${c.n}Url`] = z.string()
        break
    }
  }
  return z.object(forma)
}

/** Valores iniciais do formulário: os do item, ou os padrões da seção. */
export function valoresIniciais(secao: SecaoDef, item?: ItemDoSite | null): Record<string, unknown> {
  const v: Record<string, unknown> = {}
  const fonte = (item ?? {}) as Record<string, unknown>
  for (const c of secao.campos) {
    const atual = fonte[c.n]
    if (c.t === 'sim') v[c.n] = atual === undefined ? Boolean(c.padrao) : Boolean(atual)
    else if (c.t === 'numero') v[c.n] = atual === undefined ? Number(c.padrao ?? 0) : Number(atual)
    else if (c.t === 'data') v[c.n] = typeof atual === 'string' && atual ? atual : hojeIso()
    else v[c.n] = atual === undefined || atual === null ? String(c.padrao ?? '') : String(atual)
    if (c.t === 'imagem') v[`${c.n}Url`] = String(fonte[`${c.n}Url`] ?? '')
  }
  return v
}
