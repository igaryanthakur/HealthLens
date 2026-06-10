import { Link } from 'react-router-dom'
import StaticPageLayout, { StaticList, StaticSection } from '../components/Layout/StaticPageLayout'

export default function HealthBlog() {
  return (
    <StaticPageLayout
      badge="Health Blog · Preventive Healthcare"
      title="Why Regular Check-Ups Are Essential for Maintaining Good Health"
      subtitle="Preventive care catches problems early, strengthens your health baseline, and pairs naturally with tools like HealthLens that track changes across reports over time."
      backLabel="Back to Health Blog"
      backTo="/blog"
    >
      <p className="text-sm text-slate-500 mb-8">
        <strong>Published on HealthLens AI</strong> · Adapted from preventive-health guidance ·{' '}
        <span className="text-slate-400">~6 min read</span>
      </p>

      <div className="prose prose-slate max-w-none">
        <p className="text-slate-600 leading-relaxed text-lg">
          In today&apos;s fast-paced life, your health often takes a back seat. An unhealthy diet,
          lack of exercise, poor sleep, and chronic stress take a toll and affect your wellbeing in
          the long run.
        </p>
        <p className="text-slate-600 leading-relaxed">
          Doctors stress the importance of <strong>regular check-ups</strong> to detect lifestyle-related
          conditions in time and begin treatment before complications develop. If you use HealthLens,
          each new lab report becomes part of a <strong>longitudinal record</strong> — making it easier
          to see whether your numbers are improving, stable, or need attention.
        </p>
      </div>

      <StaticSection title="5 reasons you need regular check-ups">
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">1. Stay aware of your health</h3>
            <p>
              Busy schedules leave little room to notice early warning signs. Without awareness,
              minor issues can grow into complications that reduce quality of life. Regular visits
              help your clinician detect symptoms early, personalize advice, and support mental
              health conversations in a trusted setting.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              2. Learn if you are at risk of diseases
            </h3>
            <p>
              Check-ups uncover underlying or inherited risks — including type 2 diabetes, hypertension,
              heart disease, stroke, and some cancers. Blood work and imaging recommended by your
              doctor can catch familial patterns early. Lifestyle changes (diet, exercise, sleep,
              smoking cessation) and timely medication often prevent progression.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              3. Control chronic health conditions
            </h3>
            <p>
              Chronic disease rarely announces itself loudly. Stress, sedentary habits, and ignored
              borderline labs can escalate into serious cardiac or metabolic illness. Ongoing monitoring
              allows precise treatment plans, specialist referrals, and — when needed — advanced
              interventions before emergencies occur.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              4. Develop a stronger immune system
            </h3>
            <p>
              Preventive care reinforces healthy habits: balanced nutrition, movement, adequate sleep,
              and reduced alcohol or tobacco use. Over time, stronger daily choices support immunity
              and resilience against common infections.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">5. Save on medical costs</h3>
            <p>
              People sometimes skip check-ups because of test costs — yet early detection usually
              avoids expensive hospitalizations, surgeries, and long-term medications. Investing in
              annual screening is often far cheaper than treating advanced disease.
            </p>
          </div>
        </div>
      </StaticSection>

      <StaticSection title="Essential check-ups to discuss with your doctor">
        <p>Annual or age-appropriate screening may include:</p>
        <StaticList
          items={[
            'Routine physical examination — weight, height, BMI, family history review.',
            'Blood sugar test — screens for prediabetes and diabetes.',
            'Cholesterol panel — excess lipids raise cardiovascular risk.',
            'Blood pressure — high readings are a major heart disease factor; often checked every two years for adults.',
            'Skin examination — new moles or growths may warrant early dermatology review.',
            'Bone density — especially for women 65+ and men 70+.',
            'Dental exam — once or twice yearly for oral health.',
            'Mammogram — typically every two years from age 50 (per clinician guidance).',
            'Cervical cancer screening — generally ages 21–65.',
            'Prostate screening — often discussed from age 50 (PSA and clinical exam).',
          ]}
        />
        <p className="mt-4 text-sm text-slate-500">
          Always follow your physician&apos;s recommendations — intervals vary by age, sex, and
          personal risk factors.
        </p>
      </StaticSection>

      <StaticSection title="Summing up">
        <p>
          If a fast-paced lifestyle has pushed health to the margins, regular check-ups are the
          reset button. Your family physician can recommend the right panel of tests and help you
          act on results before they become crises.
        </p>
        <p>
          <strong>How HealthLens fits in:</strong> upload each lab PDF or prescription, track HbA1c,
          glucose, lipids, and more across months, and use the Repository and Doctor Summary when you
          visit a new clinician. HealthLens assists understanding — it does not replace your doctor.
        </p>
      </StaticSection>

      <div className="mt-12 rounded-2xl bg-slate-900 text-white px-6 py-8">
        <p className="text-sm text-slate-300 uppercase tracking-wider font-semibold mb-2">
          Take the next step
        </p>
        <h3 className="text-xl font-bold mb-3">Organize your health records with HealthLens</h3>
        <p className="text-slate-300 text-sm leading-relaxed mb-6">
          Upload reports, view trends, and export a doctor-ready summary — all in one personal health
          intelligence profile.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/register"
            className="inline-flex items-center justify-center rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-semibold text-sm px-5 py-2.5 transition-colors"
          >
            Get started free
          </Link>
          <Link
            to="/blog"
            className="inline-flex items-center justify-center rounded-xl border border-slate-600 hover:border-slate-500 text-slate-200 font-medium text-sm px-5 py-2.5 transition-colors"
          >
            More articles
          </Link>
        </div>
      </div>

      <p className="mt-10 text-xs text-slate-400 leading-relaxed border-t border-slate-200 pt-6">
        Educational content adapted from preventive healthcare literature including{' '}
        <a
          href="https://www.metropolisindia.com/blog/preventive-healthcare/why-regular-check-ups-are-essential-for-maintaining-good-health"
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal-600 hover:underline"
        >
          Metropolis Healthcare — Regular Health Check-Ups
        </a>
        . Rewritten for HealthLens AI readers. Not medical advice.
      </p>
    </StaticPageLayout>
  )
}
