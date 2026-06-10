import { Link } from 'react-router-dom'

const LOGO_SRC =
  'data:image/png;base64,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'

export default function Footer() {
  return (
    <footer className="mt-auto">
      <div className="w-full rounded-t-xl bg-surface-container-lowest dark:bg-inverse-surface border-t border-surface-container-low dark:border-surface-container-high shadow-sm">
        <div className="w-full px-margin-mobile md:px-margin-desktop py-xl grid grid-cols-1 md:grid-cols-4 gap-gutter max-w-container-max mx-auto">
          <div className="col-span-1 md:col-span-2 flex flex-col gap-sm">
            <div className="text-headline-md font-headline-md font-bold text-primary dark:text-primary-fixed-dim flex items-center gap-xs">
              <img
                alt="HealthLens AI Logo"
                className="w-6 h-6 object-contain rounded-sm mix-blend-multiply"
                src={LOGO_SRC}
              />
              HealthLens AI
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant max-w-sm mt-xs">
              Empowering individuals with AI-driven clarity for their medical data. Your personal
              health intelligence companion.
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant mt-auto pt-md">
              &copy; {new Date().getFullYear()} HealthLens AI. All rights reserved.
            </p>
          </div>
          <div className="flex flex-col gap-sm">
            <h4 className="font-label-md text-label-md uppercase text-on-surface dark:text-on-surface-variant mb-xs tracking-wider">
              Legal
            </h4>
            <Link
              className="font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed transition-colors hover:underline decoration-primary dark:decoration-primary-fixed-dim w-fit"
              to="/privacy"
            >
              Privacy Policy
            </Link>
            <Link
              className="font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed transition-colors hover:underline decoration-primary dark:decoration-primary-fixed-dim w-fit"
              to="/terms"
            >
              Terms of Service
            </Link>
          </div>
          <div className="flex flex-col gap-sm">
            <h4 className="font-label-md text-label-md uppercase text-on-surface dark:text-on-surface-variant mb-xs tracking-wider">
              Company
            </h4>
            <Link
              className="font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed transition-colors hover:underline decoration-primary dark:decoration-primary-fixed-dim w-fit"
              to="/contact"
            >
              Contact Support
            </Link>
            <Link
              className="font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed transition-colors hover:underline decoration-primary dark:decoration-primary-fixed-dim w-fit"
              to="/careers"
            >
              Careers
            </Link>
            <Link
              className="font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed transition-colors hover:underline decoration-primary dark:decoration-primary-fixed-dim w-fit"
              to="/blog"
            >
              Health Blog
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
