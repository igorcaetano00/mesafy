import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [rest, setRest] = useState(undefined)   // restaurante do usuário logado

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) { setRest(session === null ? null : undefined); return }
    supabase.from('restaurantes').select('*').order('criado_em').limit(1).maybeSingle().then(({ data }) => setRest(data || null))
  }, [session])

  return <Ctx.Provider value={{ session, rest, setRest, user: session?.user || null }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
