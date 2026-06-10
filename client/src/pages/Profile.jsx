import { useEffect, useMemo, useState } from 'react'
import { HeartPulse, Loader2, Lock, User } from 'lucide-react'
import {
  changeUserPassword,
  fetchCurrentUser,
  updateUserAccount,
  updateUserProfile,
} from '../lib/api'

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say']
const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']
const SMOKING_OPTIONS = ['Never', 'Former', 'Current']
const ALCOHOL_OPTIONS = ['None', 'Occasional', 'Regular']
const CHRONIC_CONDITIONS = [
  'Type 1 Diabetes',
  'Type 2 Diabetes',
  'Hypertension',
  'Hypothyroidism',
  'Hyperthyroidism',
  'Asthma',
  'Chronic Kidney Disease',
  'Cardiovascular Disease',
]

const TABS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'health', label: 'Health Profile', icon: HeartPulse },
]

const EMPTY_HEALTH_FORM = {
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  heightCm: '',
  weightKg: '',
  chronicConditions: [],
  lifestyle: {
    smokingStatus: '',
    alcoholConsumption: '',
  },
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600'

function toDateInputValue(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function getBmiCategory(bmi) {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal'
  if (bmi < 30) return 'Overweight'
  return 'Obese'
}

function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export default function Profile() {
  const [activeTab, setActiveTab] = useState('account')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [accountForm, setAccountForm] = useState({ name: '', email: '' })
  const [healthForm, setHealthForm] = useState(EMPTY_HEALTH_FORM)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [savingAccount, setSavingAccount] = useState(false)
  const [savingHealth, setSavingHealth] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const [accountSuccess, setAccountSuccess] = useState(false)
  const [healthSuccess, setHealthSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const [accountError, setAccountError] = useState(null)
  const [healthError, setHealthError] = useState(null)
  const [passwordError, setPasswordError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      setLoading(true)
      setError(null)

      try {
        const json = await fetchCurrentUser()
        if (cancelled) return

        const user = json.user ?? {}
        const profile = user.profile ?? {}

        setAccountForm({
          name: user.name ?? '',
          email: user.email ?? '',
        })
        setHealthForm({
          dateOfBirth: toDateInputValue(profile.dateOfBirth),
          gender: profile.gender ?? '',
          bloodGroup: profile.bloodGroup ?? '',
          heightCm: profile.heightCm ?? '',
          weightKg: profile.weightKg ?? '',
          chronicConditions: profile.chronicConditions ?? [],
          lifestyle: {
            smokingStatus: profile.lifestyle?.smokingStatus ?? '',
            alcoholConsumption: profile.lifestyle?.alcoholConsumption ?? '',
          },
        })
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load profile.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProfile()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!accountSuccess) return undefined
    const timer = setTimeout(() => setAccountSuccess(false), 3000)
    return () => clearTimeout(timer)
  }, [accountSuccess])

  useEffect(() => {
    if (!healthSuccess) return undefined
    const timer = setTimeout(() => setHealthSuccess(false), 3000)
    return () => clearTimeout(timer)
  }, [healthSuccess])

  useEffect(() => {
    if (!passwordSuccess) return undefined
    const timer = setTimeout(() => setPasswordSuccess(false), 3000)
    return () => clearTimeout(timer)
  }, [passwordSuccess])

  const bmi = useMemo(() => {
    const height = Number(healthForm.heightCm)
    const weight = Number(healthForm.weightKg)
    if (!height || !weight || height <= 0 || weight <= 0) return null
    return weight / (height / 100) ** 2
  }, [healthForm.heightCm, healthForm.weightKg])

  function updateHealthField(field, value) {
    setHealthForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateLifestyle(field, value) {
    setHealthForm((prev) => ({
      ...prev,
      lifestyle: { ...prev.lifestyle, [field]: value },
    }))
  }

  function toggleCondition(condition) {
    setHealthForm((prev) => {
      const selected = prev.chronicConditions.includes(condition)
        ? prev.chronicConditions.filter((item) => item !== condition)
        : [...prev.chronicConditions, condition]
      return { ...prev, chronicConditions: selected }
    })
  }

  async function handleAccountSubmit(e) {
    e.preventDefault()
    setSavingAccount(true)
    setAccountError(null)
    setAccountSuccess(false)

    try {
      const json = await updateUserAccount({
        name: accountForm.name.trim(),
        email: accountForm.email.trim(),
      })
      setAccountForm({
        name: json.user?.name ?? accountForm.name,
        email: json.user?.email ?? accountForm.email,
      })
      setAccountSuccess(true)
    } catch (err) {
      setAccountError(err.message || 'Failed to update account.')
    } finally {
      setSavingAccount(false)
    }
  }

  async function handleHealthSubmit(e) {
    e.preventDefault()
    setSavingHealth(true)
    setHealthError(null)
    setHealthSuccess(false)

    try {
      const payload = {
        dateOfBirth: healthForm.dateOfBirth || undefined,
        gender: healthForm.gender || undefined,
        bloodGroup: healthForm.bloodGroup || undefined,
        heightCm: healthForm.heightCm ? Number(healthForm.heightCm) : undefined,
        weightKg: healthForm.weightKg ? Number(healthForm.weightKg) : undefined,
        chronicConditions: healthForm.chronicConditions,
        lifestyle: {
          smokingStatus: healthForm.lifestyle.smokingStatus || undefined,
          alcoholConsumption: healthForm.lifestyle.alcoholConsumption || undefined,
        },
      }

      await updateUserProfile(payload)
      setHealthSuccess(true)
    } catch (err) {
      setHealthError(err.message || 'Failed to save health profile.')
    } finally {
      setSavingHealth(false)
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }

    setSavingPassword(true)

    try {
      await changeUserPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordSuccess(true)
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.')
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <p className="text-sm text-slate-600 text-center">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-5 py-8 md:px-8 md:py-10 space-y-6">
        {/* Header */}
        <header className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-7 flex items-center gap-5">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-700 text-white text-xl font-bold shrink-0">
            {getInitials(accountForm.name)}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              Your Profile
            </p>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{accountForm.name || 'Account'}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{accountForm.email}</p>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={[
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                activeTab === id
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-teal-700 hover:border-teal-200',
              ].join(' ')}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Account tab */}
        {activeTab === 'account' && (
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-7">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Account Details</h2>
            <p className="text-sm text-slate-500 mb-6">
              Update your display name and login email. Your name appears in doctor summaries and exports.
            </p>

            {accountSuccess && (
              <div className="mb-4 bg-teal-50 text-teal-800 rounded-xl p-4 text-sm border border-teal-100">
                Account updated successfully.
              </div>
            )}
            {accountError && (
              <div className="mb-4 bg-red-50 text-red-700 rounded-xl p-4 text-sm border border-red-100">
                {accountError}
              </div>
            )}

            <form onSubmit={handleAccountSubmit} className="space-y-4 max-w-lg">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  minLength={2}
                  value={accountForm.name}
                  onChange={(e) =>
                    setAccountForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={accountForm.email}
                  onChange={(e) =>
                    setAccountForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="you@example.com"
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  Used for login and account recovery.
                </p>
              </div>
              <button
                type="submit"
                disabled={savingAccount}
                className="inline-flex items-center gap-2 bg-teal-700 text-white rounded-xl px-6 py-2.5 text-sm font-medium hover:bg-teal-800 transition-colors disabled:opacity-60"
              >
                {savingAccount && <Loader2 size={16} className="animate-spin" />}
                {savingAccount ? 'Saving…' : 'Save Account'}
              </button>
            </form>
          </section>
        )}

        {/* Security tab */}
        {activeTab === 'security' && (
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-7">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Change Password</h2>
            <p className="text-sm text-slate-500 mb-6">
              Choose a strong password you do not use elsewhere. Minimum 8 characters.
            </p>

            {passwordSuccess && (
              <div className="mb-4 bg-teal-50 text-teal-800 rounded-xl p-4 text-sm border border-teal-100">
                Password updated successfully.
              </div>
            )}
            {passwordError && (
              <div className="mb-4 bg-red-50 text-red-700 rounded-xl p-4 text-sm border border-red-100">
                {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={savingPassword}
                className="inline-flex items-center gap-2 bg-teal-700 text-white rounded-xl px-6 py-2.5 text-sm font-medium hover:bg-teal-800 transition-colors disabled:opacity-60"
              >
                {savingPassword && <Loader2 size={16} className="animate-spin" />}
                {savingPassword ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </section>
        )}

        {/* Health tab */}
        {activeTab === 'health' && (
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-7">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Health Profile</h2>
            <p className="text-sm text-slate-500 mb-6">
              Medical context used to personalize AI insights, doctor summaries, and chat responses.
            </p>

            {healthSuccess && (
              <div className="mb-4 bg-teal-50 text-teal-800 rounded-xl p-4 text-sm border border-teal-100">
                Health profile saved successfully.
              </div>
            )}
            {healthError && (
              <div className="mb-4 bg-red-50 text-red-700 rounded-xl p-4 text-sm border border-red-100">
                {healthError}
              </div>
            )}

            <form onSubmit={handleHealthSubmit} className="space-y-8">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-teal-700 mb-4">
                  Basic Demographics
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-slate-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      id="dateOfBirth"
                      type="date"
                      value={healthForm.dateOfBirth}
                      onChange={(e) => updateHealthField('dateOfBirth', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-slate-700 mb-1">
                      Gender
                    </label>
                    <select
                      id="gender"
                      value={healthForm.gender}
                      onChange={(e) => updateHealthField('gender', e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select gender</option>
                      {GENDER_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="bloodGroup" className="block text-sm font-medium text-slate-700 mb-1">
                      Blood Group
                    </label>
                    <select
                      id="bloodGroup"
                      value={healthForm.bloodGroup}
                      onChange={(e) => updateHealthField('bloodGroup', e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select blood group</option>
                      {BLOOD_GROUP_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-teal-700 mb-4">
                  Biometrics
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="heightCm" className="block text-sm font-medium text-slate-700 mb-1">
                      Height (cm)
                    </label>
                    <input
                      id="heightCm"
                      type="number"
                      min="1"
                      step="0.1"
                      value={healthForm.heightCm}
                      onChange={(e) => updateHealthField('heightCm', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="weightKg" className="block text-sm font-medium text-slate-700 mb-1">
                      Weight (kg)
                    </label>
                    <input
                      id="weightKg"
                      type="number"
                      min="1"
                      step="0.1"
                      value={healthForm.weightKg}
                      onChange={(e) => updateHealthField('weightKg', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
                {bmi != null && (
                  <div className="mt-4 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                    <p className="text-sm text-slate-600">
                      BMI:{' '}
                      <span className="font-semibold text-slate-900">{bmi.toFixed(1)}</span>
                      <span className="ml-2 text-teal-700">({getBmiCategory(bmi)})</span>
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-teal-700 mb-4">
                  Lifestyle & Conditions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label htmlFor="smokingStatus" className="block text-sm font-medium text-slate-700 mb-1">
                      Smoking Status
                    </label>
                    <select
                      id="smokingStatus"
                      value={healthForm.lifestyle.smokingStatus}
                      onChange={(e) => updateLifestyle('smokingStatus', e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select smoking status</option>
                      {SMOKING_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="alcoholConsumption"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      Alcohol Consumption
                    </label>
                    <select
                      id="alcoholConsumption"
                      value={healthForm.lifestyle.alcoholConsumption}
                      onChange={(e) => updateLifestyle('alcoholConsumption', e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select alcohol consumption</option>
                      {ALCOHOL_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <fieldset>
                  <legend className="block text-sm font-medium text-slate-700 mb-3">
                    Chronic Conditions
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {CHRONIC_CONDITIONS.map((condition) => (
                      <label
                        key={condition}
                        className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={healthForm.chronicConditions.includes(condition)}
                          onChange={() => toggleCondition(condition)}
                          className="rounded border-slate-300 text-teal-700 focus:ring-teal-600/30"
                        />
                        {condition}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              <button
                type="submit"
                disabled={savingHealth}
                className="inline-flex items-center gap-2 bg-teal-700 text-white rounded-xl px-6 py-2.5 text-sm font-medium hover:bg-teal-800 transition-colors disabled:opacity-60"
              >
                {savingHealth && <Loader2 size={16} className="animate-spin" />}
                {savingHealth ? 'Saving…' : 'Save Health Profile'}
              </button>
            </form>
          </section>
        )}
      </div>
    </div>
  )
}
