import { Link } from 'react-router-dom'
import StaticPageLayout, { StaticList, StaticSection } from '../components/Layout/StaticPageLayout'

export default function LegalNotice() {
  return (
    <StaticPageLayout
      badge="Legal"
      title="Privacy Policy"
      subtitle="How HealthLens AI collects, uses, and protects information when you use our personal health intelligence platform."
    >
      <p className="text-sm text-slate-500 mb-8">
        <strong>Last updated:</strong> June 10, 2026
      </p>

      <StaticSection title="1. Introduction">
        <p>
          HealthLens AI (&quot;HealthLens,&quot; &quot;we,&quot; &quot;us&quot;) is a personal health
          intelligence platform that helps you upload, organize, and understand your medical records.
          This Privacy Policy explains what data we process, why we process it, and the choices you
          have.
        </p>
        <p>
          HealthLens is designed for educational and personal wellness use. It is{' '}
          <strong>not</strong> a substitute for professional medical advice, diagnosis, or
          treatment.
        </p>
      </StaticSection>

      <StaticSection title="2. Information we collect">
        <p>
          <strong>Account information:</strong> name, email address, and password (stored using
          industry-standard hashing — we never store plain-text passwords).
        </p>
        <p>
          <strong>Health profile:</strong> optional demographics you provide (date of birth, gender,
          blood group, height, weight, chronic conditions, lifestyle) to personalize insights.
        </p>
        <p>
          <strong>Medical documents:</strong> lab reports, prescriptions, and related files you
          upload, plus structured data extracted from them (biomarkers, medications, diagnoses,
          advice) and AI-generated interpretations.
        </p>
        <p>
          <strong>Usage data:</strong> basic technical logs (e.g. request timestamps, error logs) to
          keep the service reliable and secure. We use rate limiting to protect API abuse.
        </p>
      </StaticSection>

      <StaticSection title="3. How we use your information">
        <StaticList
          items={[
            'Authenticate you and keep your records scoped to your account.',
            'Extract structured health data from uploaded documents using deterministic parsing.',
            'Generate plain-language summaries and longitudinal insights (with optional AI wording).',
            'Power the Health Repository, dashboard trends, doctor summary export, and chat assistant.',
            'Improve reliability, security, and demo/educational experiences.',
          ]}
        />
      </StaticSection>

      <StaticSection title="4. AI and third-party services">
        <p>
          When enabled, we send bounded, structured context to <strong>Google Gemini</strong> for
          interpretation, chat replies, and certain document extraction lanes. We do not send raw
          OCR dumps unnecessarily; prompts are designed to be token-efficient.
        </p>
        <p>
          Data is stored in <strong>MongoDB</strong> (local or cloud-hosted Atlas, depending on
          deployment). You are responsible for securing your database credentials and API keys in
          self-hosted environments.
        </p>
      </StaticSection>

      <StaticSection title="5. Data retention and deletion">
        <p>
          Your reports remain in your account until you delete them (e.g. from the Vault) or delete
          your account. Demo seed data is separate and used only for evaluation accounts.
        </p>
        <p>
          You may request account-related assistance via our{' '}
          <Link to="/contact" className="text-teal-700 hover:underline">
            Contact Support
          </Link>{' '}
          page.
        </p>
      </StaticSection>

      <StaticSection title="6. Security">
        <p>
          We use JWT-based authentication, bcrypt password hashing, owner-scoped database queries,
          and upload rate limits. No system is perfectly secure — do not upload highly sensitive
          data to shared or untrusted deployments.
        </p>
      </StaticSection>

      <StaticSection title="7. Your rights">
        <p>
          Depending on your jurisdiction, you may have rights to access, correct, or delete personal
          data. Use in-app profile settings and Vault delete controls where available, or contact us
          for help.
        </p>
      </StaticSection>

      <StaticSection title="8. Children">
        <p>
          HealthLens is not directed at children under 18. Do not register minors without appropriate
          parental or guardian consent and legal compliance.
        </p>
      </StaticSection>

      <StaticSection title="9. Changes">
        <p>
          We may update this policy as the product evolves. Material changes will be reflected in the
          &quot;Last updated&quot; date above.
        </p>
      </StaticSection>

      <StaticSection title="10. Contact">
        <p>
          Questions about privacy? Reach the HealthLens team via{' '}
          <a href="mailto:aryan@gmail.com" className="text-teal-700 hover:underline">
            aryan@gmail.com
          </a>{' '}
          or our{' '}
          <Link to="/contact" className="text-teal-700 hover:underline">
            Contact Support
          </Link>{' '}
          page.
        </p>
      </StaticSection>
    </StaticPageLayout>
  )
}
