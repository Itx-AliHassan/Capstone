import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '../services/firebase'

const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function hydrate(firebaseUser) {
    if (!firebaseUser) { setUser(null); setProfile(null); setLoading(false); return }
    setUser(firebaseUser)
    const ref = doc(db, 'users', firebaseUser.uid)
    const snap = await getDoc(ref)
    if (snap.exists()) setProfile({ id: snap.id, ...snap.data() })
    else {
      const next = { uid: firebaseUser.uid, displayName: firebaseUser.displayName || 'User', email: firebaseUser.email, photoURL: firebaseUser.photoURL || '', createdAt: serverTimestamp() }
      await setDoc(ref, next)
      setProfile(next)
    }
    setLoading(false)
  }

  useEffect(() => onAuthStateChanged(auth, hydrate), [])

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password)
  const loginGoogle = () => signInWithPopup(auth, googleProvider)
  const signup = async ({ name, email, password, photoURL = '' }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name, photoURL })
    await setDoc(doc(db, 'users', cred.user.uid), { uid: cred.user.uid, displayName: name, email, photoURL, createdAt: serverTimestamp() })
    return cred
  }
  const logout = () => signOut(auth)
  const refreshProfile = () => hydrate(auth.currentUser)
  const value = useMemo(() => ({ user, profile, loading, login, loginGoogle, signup, logout, refreshProfile }), [user, profile, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)
