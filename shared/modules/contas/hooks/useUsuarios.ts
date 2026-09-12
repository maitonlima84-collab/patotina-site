import { useEffect, useState } from 'react'
import type { Usuario } from '../types'
import { subscribeUsuarios } from '../repositories/usuariosRepository'

export function useUsuarios() {
  const [rows, setRows] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    return subscribeUsuarios((r, e) => {
      setRows(r)
      setErro(e ?? null)
      setLoading(false)
    })
  }, [])

  return { rows, loading, erro }
}
