import { collection, getDocs, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '@shared/lib/firebase'

// Os cards de "Turmas e horários" do site, para ligar a turma real ao seu
// card. Só os visíveis: é o que a regra pública deixa qualquer um ler, e um
// Gestor não é necessariamente Editor.
export function useCardsDoSite() {
  const [cards, setCards] = useState<{ id: string; nome: string }[]>([])
  useEffect(() => {
    getDocs(query(collection(db, 'site_turmas'), where('visivel', '==', true)))
      .then((snap) => setCards(snap.docs.map((d) => ({ id: d.id, nome: String(d.data().nome ?? '') }))))
      .catch(() => setCards([]))
  }, [])
  return cards
}
