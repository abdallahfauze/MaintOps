import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/api/supabaseClient'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (error) {
      console.error('Failed to load profile', error)
      setProfile(null)
      return
    }
    setProfile(data)
  }, [])

  useEffect(() => {
    let active = true

    // Relying solely on onAuthStateChange (it fires immediately with the
    // current session on subscribe) rather than also calling getSession()
    // avoids a known supabase-js deadlock where the two compete for the
    // same internal browser lock on a plain page load/refresh.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!active) return
      setSession(newSession)
      loadProfile(newSession?.user?.id).finally(() => {
        if (active) setIsLoadingAuth(false)
      })
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  /** Sends a magic-link sign-in email. `requestedRole` is only used the first time a user signs up. */
  const login = async (email, requestedRole) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/post-signup`,
        data: requestedRole ? { requested_role: requestedRole } : undefined,
      },
    })
    if (error) throw error
  }

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const updateMe = async (data) => {
    if (!session?.user?.id) return null
    const { data: updated, error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', session.user.id)
      .select()
      .single()
    if (error) throw error
    setProfile(updated)
    return updated
  }

  const refreshProfile = () => loadProfile(session?.user?.id)

  const user = session?.user && profile ? { ...profile, email: session.user.email } : null

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!session,
      isLoadingAuth,
      login,
      logout,
      updateMe,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
