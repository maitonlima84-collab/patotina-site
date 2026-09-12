import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { Botao } from '@shared/components/ui/Botao'

// errorElement dos routers: um dado inesperado no banco (um documento sem o
// campo que a tela usa, por exemplo) derruba só a tela, com um jeito de
// voltar — e não a página inteira com o aviso genérico do react-router.
export function ErroDaTela() {
  const erro = useRouteError()
  const detalhe = isRouteErrorResponse(erro) ? `${erro.status} ${erro.statusText}` : erro instanceof Error ? erro.message : String(erro)
  console.error('Erro na tela:', erro)

  return (
    <div className="mx-auto max-w-[520px] p-8 text-center">
      <h1 className="font-anton text-[1.4rem] tracking-wide">Algo deu errado nesta tela</h1>
      <p className="mt-2 text-gray">Recarregue a página. Se continuar, avise quem cuida do sistema com a mensagem abaixo.</p>
      <pre className="sem-barra mt-4 overflow-x-auto rounded-lg border border-line bg-navy-2 p-3 text-left text-[0.8rem] text-red-200">{detalhe}</pre>
      <div className="mt-5 flex justify-center gap-2">
        <Botao variante="principal" onClick={() => location.reload()}>
          Recarregar
        </Botao>
        <Botao onClick={() => location.assign('/')}>Início</Botao>
      </div>
    </div>
  )
}
