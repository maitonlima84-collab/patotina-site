import { normalizar } from '@shared/lib/utils'
import type { Turma } from '@/modules/turmas/types'
import type { AlunoForm } from './alunosService'
import { responsavelVazio, valoresIniciais } from './alunosService'

// Importação da lista que a escolinha já tem (planilha exportada como CSV).
// Não se sabe o formato de antemão, então as colunas são reconhecidas pelo
// nome do cabeçalho e o que não for reconhecido é ignorado — melhor importar
// nome e telefone e completar na ficha do que exigir uma planilha perfeita.

export type Coluna = 'nome' | 'nascimento' | 'responsavel' | 'parentesco' | 'telefone' | 'turma' | 'escola' | 'mensalidade' | 'observacoes' | ''

const PALAVRAS: [Coluna, string[]][] = [
  ['nascimento', ['nascimento', 'nasc', 'data de nasc', 'aniversario', 'dn']],
  ['responsavel', ['responsavel', 'mae', 'pai', 'contato']],
  ['parentesco', ['parentesco', 'grau']],
  ['telefone', ['telefone', 'celular', 'whatsapp', 'fone', 'tel']],
  ['turma', ['turma', 'categoria', 'sub']],
  ['escola', ['escola', 'colegio']],
  ['mensalidade', ['mensalidade', 'valor']],
  ['observacoes', ['observacao', 'obs']],
  ['nome', ['nome', 'aluno', 'crianca', 'atleta']],
]

export function reconhecerColuna(cabecalho: string): Coluna {
  const h = normalizar(cabecalho)
  for (const [coluna, palavras] of PALAVRAS) if (palavras.some((p) => h.includes(p))) return coluna
  return ''
}

// CSV com ; ou , (o Excel brasileiro exporta com ;), aspas e quebras de linha
// dentro de aspas.
export function lerCsv(texto: string): string[][] {
  const separador = (texto.match(/;/g)?.length ?? 0) >= (texto.match(/,/g)?.length ?? 0) ? ';' : ','
  const linhas: string[][] = []
  let linha: string[] = []
  let campo = ''
  let entreAspas = false
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]!
    if (entreAspas) {
      if (c === '"' && texto[i + 1] === '"') {
        campo += '"'
        i++
      } else if (c === '"') entreAspas = false
      else campo += c
    } else if (c === '"') entreAspas = true
    else if (c === separador) {
      linha.push(campo)
      campo = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++
      linha.push(campo)
      campo = ''
      if (linha.some((x) => x.trim())) linhas.push(linha)
      linha = []
    } else campo += c
  }
  linha.push(campo)
  if (linha.some((x) => x.trim())) linhas.push(linha)
  return linhas.map((l) => l.map((x) => x.trim()))
}

// "10/03/2019", "10-03-19", "2019-03-10" → "2019-03-10"; vazio se não der.
export function dataParaIso(texto: string): string {
  const t = texto.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t
  const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/.exec(t)
  if (!m) return ''
  const ano = m[3]!.length === 2 ? `20${m[3]}` : m[3]!
  return `${ano}-${m[2]!.padStart(2, '0')}-${m[1]!.padStart(2, '0')}`
}

export interface LinhaImportada {
  valores: AlunoForm
  avisos: string[]
}

export function montarAlunos(linhas: string[][], colunas: Coluna[], turmas: Turma[]): LinhaImportada[] {
  const idx = (c: Coluna) => colunas.indexOf(c)
  const pegar = (l: string[], c: Coluna) => (idx(c) >= 0 ? (l[idx(c)] ?? '') : '')
  return linhas
    .filter((l) => pegar(l, 'nome'))
    .map((l) => {
      const avisos: string[] = []
      const nomeTurma = normalizar(pegar(l, 'turma'))
      const turma = nomeTurma ? turmas.find((t) => normalizar(t.nome) === nomeTurma || normalizar(t.nome).includes(nomeTurma)) : undefined
      if (nomeTurma && !turma) avisos.push(`turma "${pegar(l, 'turma')}" não encontrada`)
      const nascimento = dataParaIso(pegar(l, 'nascimento'))
      if (pegar(l, 'nascimento') && !nascimento) avisos.push(`data "${pegar(l, 'nascimento')}" não reconhecida`)
      const mensalidadeTexto = pegar(l, 'mensalidade').replace(/[^\d,.]/g, '').replace(',', '.')
      const mensalidade = mensalidadeTexto ? Number(mensalidadeTexto) : turma?.mensalidade ?? 0

      const v = valoresIniciais(null)
      v.nome = pegar(l, 'nome')
      v.nascimento = nascimento
      v.escola = pegar(l, 'escola')
      v.turmaId = turma?.id ?? ''
      v.observacoes = pegar(l, 'observacoes')
      v.plano = { ...v.plano, valor: mensalidade || 0 }
      const responsavel = pegar(l, 'responsavel')
      const telefone = pegar(l, 'telefone')
      v.responsaveis = [{ ...responsavelVazio(true), nome: responsavel || '(não informado)', parentesco: pegar(l, 'parentesco'), telefone }]
      if (!responsavel) avisos.push('sem responsável')
      if (!telefone) avisos.push('sem telefone')
      if (!nascimento) avisos.push('sem nascimento')
      return { valores: v, avisos }
    })
}
