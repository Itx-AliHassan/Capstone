import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { uploadToCloudinary } from '../services/cloudinary'

export default function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', photoURL: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setError('')
    setUploadingAvatar(true)

    try {
      const photoURL = await uploadToCloudinary(file)
      setForm((current) => ({ ...current, photoURL }))
    } catch (uploadError) {
      setError(uploadError.message || 'Avatar upload failed.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Please fill in all required fields.')
      return
    }

    setBusy(true)
    try {
      await signup(form)
      navigate('/')
    } catch (signupError) {
      setError(signupError.message || 'Could not create your account.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-slate-50 dark:bg-[#090D16]">
      <div className="w-full max-w-md card p-7">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Create account</h1>
        <p className="text-slate-500 mt-1 mb-6">Start your first workspace.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            className="field"
            name="name"
            placeholder="Full name"
            value={form.name}
            onChange={updateField}
            autoComplete="name"
            required
          />
          <input
            className="field"
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={updateField}
            autoComplete="email"
            required
          />
          <input
            className="field"
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={updateField}
            autoComplete="new-password"
            minLength={6}
            required
          />

          <div className="text-sm text-slate-500">
            <label className="block mb-2">Avatar (optional)</label>
            <input type="file" accept="image/*" onChange={handleAvatarChange} />
            {uploadingAvatar && <span className="block mt-2">Uploading avatar…</span>}
            {form.photoURL && !uploadingAvatar && (
              <span className="block mt-2 text-emerald-600">Avatar uploaded.</span>
            )}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button disabled={busy || uploadingAvatar} className="primary w-full disabled:opacity-50">
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-5">
          Already have one?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
