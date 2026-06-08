import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'

const DOCTOR_IMG_SRC =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAYPcO61LYdO6cWrUlNiZf9KYtsr_fSYtrWV-Xh89eH0op1GE6K__PH_GVwS17nmwzRh0Y1AeCfJ_L1P9Yk02Rgp17LIgCV3Jm5qkzJiaJjkAq3FUGspOB_-nHGtQOJ1Uha1Jwi59Oo44VukyQZ7rVSktdc35UX5bLXHLPfWglVeZAkwaRKa7iMJxUX39m4CCR69_iUOEpWa7Sxh2oSkm6WrAe33jCuHGCllSYdxD_7gKD21fnkwuza4SCS3rZZvY1HL8siunr2s6o'

const SPECIALIST_IMG_SRC =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC7m14rXEVvM2LIaydPswB3TmsEvmYDwREK-XW66rr747SYVdgMWgIgHwlTq69lGW7gyarVp_Y6O1pW8BiWaYhNpd9lXW5qKwDdM0e9QwfxqwbVJBbzab3UP9_1U7ksBj4oPK3qwMQkByCKftQY-yM35kRcXnnxjrGU3RTqK1uCtUWBtIErzaQKXqjlp0B7n_xftYxjn-aeSCGThh6NvYf8-n1R4s50WKvkACAxsKBh8Qs-Z3JkO9P40wEa3wAqAZ7z-AAi6nU1OTY'

export default function AuthBrandPanel() {
  return (
    <section className="hidden lg:flex lg:w-1/2 bg-medical-gradient p-margin-desktop flex-col justify-between relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] bg-primary-container/20 rounded-full blur-3xl" />
      <div className="z-10">
        <Link to="/" className="flex items-center gap-xs mb-xl w-fit">
          <Shield className="text-primary-fixed text-4xl" />
          <span className="font-headline-md text-headline-md font-bold text-white tracking-tight">
            HealthLens AI
          </span>
        </Link>
      </div>
      <div className="z-10 max-w-lg mb-20">
        <h1 className="font-display-lg text-display-lg text-white mb-md leading-tight">
          Your Health, Secured.
        </h1>
        <p className="font-body-lg text-body-lg text-primary-fixed/80 leading-relaxed">
          Enterprise-grade encryption and AI-powered insights for your personal medical history. Our
          clinical-grade security ensures your data stays yours.
        </p>
      </div>
      <div className="z-10 flex gap-md">
        <div className="flex -space-x-3">
          <img
            alt="Doctor profile"
            className="w-10 h-10 rounded-full border-2 border-primary"
            src={DOCTOR_IMG_SRC}
          />
          <img
            alt="Specialist profile"
            className="w-10 h-10 rounded-full border-2 border-primary"
            src={SPECIALIST_IMG_SRC}
          />
          <div className="w-10 h-10 rounded-full border-2 border-primary bg-primary-container flex items-center justify-center text-xs font-bold text-white">
            +2k
          </div>
        </div>
        <p className="font-label-md text-label-md text-white/70 self-center">
          Trusted by medical professionals worldwide
        </p>
      </div>
    </section>
  )
}
