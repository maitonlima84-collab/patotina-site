import { useEffect, useState } from 'react'
import { CONFIG_PADRAO, type Configuracoes } from '../types'
import { subscribeConfiguracoes } from '../repositories/configuracoesRepository'

export function useConfiguracoes() {
  const [config, setConfig] = useState<Configuracoes>(CONFIG_PADRAO)
  const [loading, setLoading] = useState(true)
  useEffect(
    () =>
      subscribeConfiguracoes((c) => {
        setConfig(c)
        setLoading(false)
      }),
    [],
  )
  return { config, loading }
}
