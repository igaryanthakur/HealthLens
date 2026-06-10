import { Link } from 'react-router-dom'
import StaticPageLayout, { StaticList, StaticSection } from '../components/Layout/StaticPageLayout'

export default function TermsOfService() {
  return (
    <StaticPageLayout
      badge="Legal"
      title="Terms of Service"
      subtitle="Please read these terms carefully before using HealthLens AI."
    >
      <p className="text-sm text-slate-500 mb-8">
        <strong>Last updated:</strong> June 10, 2026
      </p>

      <StaticSection title="1. Agreement">
        <p>
          By accessing or using HealthLens AI, you agree to these Terms of Service. If you do not
          agree, do not use the platform.
        </p>
      </StaticSection>

      <StaticSection title="2. What HealthLens provides">
        <p>
          HealthLens is a <strong>personal health intelligence tool</strong> that helps you upload
          medical documents, extract structured data, view trends over time, and generate
          informational summaries. It is built for education, organization, and doctor communication
          support — not clinical decision-making.
        </p>
      </StaticSection>

      <StaticSection title="3. Not medical advice">
        <p className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 text-sm">
          <strong>Important:</strong> HealthLens does not diagnose, prescribe, or replace
          professional medical care. Always consult a qualified healthcare provider for medical
          decisions. In an emergency, contact local emergency services immediately.
        </p>
      </StaticSection>

      <StaticSection title="4. Your responsibilities">
        <StaticList
          items={[
            'Provide accurate registration information and keep your credentials secure.',
            'Only upload documents you have the right to use.',
            'Verify AI-generated insights against original reports and clinical guidance.',
            'Comply with applicable laws when storing or sharing health information.',
            'Not misuse the service (spam, abuse APIs, attempt unauthorized access).',
          ]}
        />
      </StaticSection>

      <StaticSection title="5. AI-generated content">
        <p>
          Interpretations, chat replies, and longitudinal briefs may be produced or assisted by AI.
          Outputs can be incomplete or incorrect. HealthLens provides deterministic fallbacks when AI
          is unavailable, but <strong>you</strong> remain responsible for how you use any output.
        </p>
      </StaticSection>

      <StaticSection title="6. Account and availability">
        <p>
          We may suspend accounts that violate these terms or threaten platform stability. The service
          is provided &quot;as is&quot; during academic and demonstration phases; uptime is not
          guaranteed.
        </p>
      </StaticSection>

      <StaticSection title="7. Intellectual property">
        <p>
          HealthLens software, branding, and documentation are owned by the project team unless
          otherwise noted. You retain ownership of documents you upload; you grant us a limited
          license to process them solely to provide the service.
        </p>
      </StaticSection>

      <StaticSection title="8. Limitation of liability">
        <p>
          To the fullest extent permitted by law, HealthLens and its founders are not liable for
          indirect, incidental, or consequential damages arising from use of the platform, including
          reliance on AI-generated health information.
        </p>
      </StaticSection>

      <StaticSection title="9. Changes">
        <p>
          We may modify these terms. Continued use after changes constitutes acceptance of the
          updated terms.
        </p>
      </StaticSection>

      <StaticSection title="10. Contact">
        <p>
          Legal or terms questions:{' '}
          <Link to="/contact" className="text-teal-700 hover:underline">
            Contact Support
          </Link>{' '}
          or email{' '}
          <a href="mailto:aryan@gmail.com" className="text-teal-700 hover:underline">
            aryan@gmail.com
          </a>
          .
        </p>
      </StaticSection>
    </StaticPageLayout>
  )
}
