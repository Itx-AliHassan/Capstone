import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, firebaseConfigured, googleProvider } from '../services/firebase'

const C = createContext(null)
const STORAGE_KEY = 'wm-auth-user'
const demoUser = { uid: 'demo', displayName: 'Demo User', email: 'demo@example.com', photoURL: '' }

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  const [profile, setProfile] = useState(readStoredUser)
  const [loading, setLoading] = useState(firebaseConfigured)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (!firebaseConfigured || !auth) {
      setLoading(false)
      return undefined
    }

    let settled = false
    const finish = () => {
      if (!settled) {
        settled = true
        setLoading(false)
      }
    }

    // Firebase normally resolves this immediately. The timeout prevents a
    // broken/misconfigured Firebase project from trapping the whole app on a
    // permanent loading screen.
    const timeout = window.setTimeout(() => {
      setAuthError('Firebase authentication did not respond. Demo mode is available from the login page.')
      finish()
    }, 5000)

    let unsubscribe
    try {
      unsubscribe = onAuthStateChanged(
        auth,
        async (firebaseUser) => {
          window.clearTimeout(timeout)
          try {
            setAuthError('')
            setUser(firebaseUser)
            if (!firebaseUser) {
              localStorage.removeItem(STORAGE_KEY)
              setProfile(null)
              return
            }

            const localUser = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(localUser))

            try {
              const snapshot = await getDoc(doc(db, 'users', firebaseUser.uid))
              setProfile(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : localUser)
            } catch {
              setProfile(localUser)
            }
          } finally {
            finish()
          }
        },
        (error) => {
          window.clearTimeout(timeout)
          setAuthError(error?.message || 'Firebase authentication failed.')
          finish()
        },
      )
    } catch (error) {
      window.clearTimeout(timeout)
      setAuthError(error?.message || 'Firebase authentication failed.')
      finish()
    }

    return () => {
      window.clearTimeout(timeout)
      unsubscribe?.()
    }
  }, [])

  const login = async (email, password) => {
    if (!firebaseConfigured || !auth) {
      const next = { ...demoUser, email: email || demoUser.email }
      setUser(next)
      setProfile(next)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    }
    return signInWithEmailAndPassword(auth, email, password)
  }

  const loginGoogle = async () => {
    if (!firebaseConfigured || !auth || !googleProvider) {
      setUser(demoUser)
      setProfile(demoUser)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demoUser))
      return demoUser
    }
    return signInWithPopup(auth, googleProvider)
  }

  const signup = async ({ name, email, password, photoURL = '' }) => {
    if (!firebaseConfigured || !auth) {
      const next = { uid: 'demo', displayName: name, email, photoURL }
      setUser(next)
      setProfile(next)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    }

    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(credential.user, { displayName: name, photoURL })
    await setDoc(doc(db, 'users', credential.user.uid), {
      uid: credential.user.uid,
      displayName: name,
      email,
      photoURL,
      createdAt: serverTimestamp(),
    })
    return credential
  }

  const logout = async () => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
    setProfile(null)
    if (firebaseConfigured && auth) return signOut(auth)
  }

  const enterDemoMode = () => {
    setAuthError('')
    setUser(demoUser)
    setProfile(demoUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoUser))
  }

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      authError,
      firebaseConfigured,
      login,
      loginGoogle,
      signup,
      logout,
      enterDemoMode,
    }),
    [user, profile, loading, authError],
  )

  return <C.Provider value={value}>{children}</C.Provider>
}

export const useAuth = () => useContext(C)
