import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { fetchCurrentUser, updateUserProfile } from '../lib/api'

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

const EMPTY_FORM = {
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

const inputClass =
  'w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-2.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40'

export default function Profile() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      setLoading(true)
      setError(null)

      try {
        const json = await fetchCurrentUser()
        if (cancelled) return

        const profile = json.user?.profile ?? {}
        setForm({
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
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadProfile()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!success) return undefined
    const timer = setTimeout(() => setSuccess(false), 3000)
    return () => clearTimeout(timer)
  }, [success])

  const bmi = useMemo(() => {
    const height = Number(form.heightCm)
    const weight = Number(form.weightKg)
    if (!height || !weight || height <= 0 || weight <= 0) return null
    return weight / (height / 100) ** 2
  }, [form.heightCm, form.weightKg])

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateLifestyle(field, value) {
    setForm((prev) => ({
      ...prev,
      lifestyle: { ...prev.lifestyle, [field]: value },
    }))
  }

  function toggleCondition(condition) {
    setForm((prev) => {
      const selected = prev.chronicConditions.includes(condition)
        ? prev.chronicConditions.filter((item) => item !== condition)
        : [...prev.chronicConditions, condition]
      return { ...prev, chronicConditions: selected }
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const payload = {
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        bloodGroup: form.bloodGroup || undefined,
        heightCm: form.heightCm ? Number(form.heightCm) : undefined,
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        chronicConditions: form.chronicConditions,
        lifestyle: {
          smokingStatus: form.lifestyle.smokingStatus || undefined,
          alcoholConsumption: form.lifestyle.alcoholConsumption || undefined,
        },
      }

      await updateUserProfile(payload)
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center p-6">
        <Loader2 className="text-primary animate-spin" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background p-6">
      <div className="bg-surface-container-lowest shadow-ambient rounded-2xl p-8 max-w-3xl mx-auto border border-outline-variant/20">
        <h1 className="text-2xl font-semibold text-primary mb-2">Medical Profile</h1>
        <p className="text-on-surface-variant text-sm mb-6">
          Your profile helps HealthLens tailor AI insights to your baseline health context.
        </p>

        {success && (
          <div className="mb-4 bg-primary/10 text-primary rounded-xl p-4 text-sm border border-primary/20">
            Profile saved successfully.
          </div>
        )}

        {error && (
          <div className="mb-4 bg-error-container text-error rounded-xl p-4 text-sm border border-error/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-on-surface mb-4">Basic Demographics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-on-surface mb-1">
                  Date of Birth
                </label>
                <input
                  id="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => updateField('dateOfBirth', e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-on-surface mb-1">
                  Gender
                </label>
                <select
                  id="gender"
                  value={form.gender}
                  onChange={(e) => updateField('gender', e.target.value)}
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
                <label htmlFor="bloodGroup" className="block text-sm font-medium text-on-surface mb-1">
                  Blood Group
                </label>
                <select
                  id="bloodGroup"
                  value={form.bloodGroup}
                  onChange={(e) => updateField('bloodGroup', e.target.value)}
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
          </section>

          <section>
            <h2 className="text-lg font-semibold text-on-surface mb-4">Biometrics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="heightCm" className="block text-sm font-medium text-on-surface mb-1">
                  Height (cm)
                </label>
                <input
                  id="heightCm"
                  type="number"
                  min="1"
                  step="0.1"
                  value={form.heightCm}
                  onChange={(e) => updateField('heightCm', e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="weightKg" className="block text-sm font-medium text-on-surface mb-1">
                  Weight (kg)
                </label>
                <input
                  id="weightKg"
                  type="number"
                  min="1"
                  step="0.1"
                  value={form.weightKg}
                  onChange={(e) => updateField('weightKg', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {bmi != null && (
              <div className="mt-4 bg-surface-container-low rounded-xl px-4 py-3 border border-outline-variant/20">
                <p className="text-sm text-on-surface-variant">
                  BMI:{' '}
                  <span className="font-semibold text-on-surface">{bmi.toFixed(1)}</span>
                  <span className="ml-2 text-primary">({getBmiCategory(bmi)})</span>
                </p>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-on-surface mb-4">Lifestyle & Conditions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="smokingStatus" className="block text-sm font-medium text-on-surface mb-1">
                  Smoking Status
                </label>
                <select
                  id="smokingStatus"
                  value={form.lifestyle.smokingStatus}
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
                <label htmlFor="alcoholConsumption" className="block text-sm font-medium text-on-surface mb-1">
                  Alcohol Consumption
                </label>
                <select
                  id="alcoholConsumption"
                  value={form.lifestyle.alcoholConsumption}
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
              <legend className="block text-sm font-medium text-on-surface mb-3">
                Chronic Conditions
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CHRONIC_CONDITIONS.map((condition) => (
                  <label
                    key={condition}
                    className="flex items-center gap-2 text-sm text-on-surface cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={form.chronicConditions.includes(condition)}
                      onChange={() => toggleCondition(condition)}
                      className="rounded border-outline-variant/40 text-primary focus:ring-primary/40"
                    />
                    {condition}
                  </label>
                ))}
              </div>
            </fieldset>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto bg-primary text-on-primary rounded-xl px-6 py-2.5 font-medium hover:opacity-90 transition-opacity disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  )
}
