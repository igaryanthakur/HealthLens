import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Accessibility,
  Activity,
  Brain,
  CheckCircle,
  FileScan,
  Heart,
  History,
  LayoutDashboard,
  Lightbulb,
  Mountain,
  PlayCircle,
  Sparkles,
  Upload,
  User,
  Users,
} from 'lucide-react'
import { getAuthToken } from '../lib/api'
import Footer from '../components/Layout/Footer'

const DASHBOARD_PREVIEW_SRC =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAiX_OjnykFzGbEiPUXnaCIvjl81_CcxTFNyhhGuy0r30twhxXBGABMmXMVAcOPdN9v3HVqvN75dnCv3EdFZhuS2F-pUTxtFJW0KsBrjB_SJMJ3vrn09g_jAMAkMoo8pmpBp7dNfBmfwhX0whtE_tus_1Ei8GhJVAWLoKWmd5lY1APlnvOHX8wowXg53VIZMm2_Hfqd8j_C6UTVP7C0Ugi7ZhIGjcu12wyIA4zyh8Sdg5Y_VEiZ9JVR4JV8hFlFyycCrGjcxEQeNqc'

const SOCIAL_IMPACT_IMG_SRC =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD2CNi67Zwzl5Iw9a5fBrvqqm5uAaQ0oH3dOIv3NsBicFksx5j9Dx2ba08RB64ORD7nycZ5iydN3Mbln7wilXjX2qJXL2C2Td2j4o-fBl9ai_QXusBx8tC_s915xyaNxGE5t2IFi-TJpW6U56UdnT942NlUmrS9cyWLvNXy_rTZEL-Y5HN31xMO6IZvA7HNfTTIFkYQVFTcCaIUjF4rTGKcQJZDWPN_BHP_Fv22vG_KPHu1nJkWjuWbspy__63OZdr5jfEMRyDVAU0'

export default function Landing() {
  const rootRef = useRef(null)
  const uploadHref = getAuthToken() ? '/dashboard?upload=1' : '/register'

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15,
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target
          const delay = Number(el.getAttribute('data-reveal-delay') || 0)
          setTimeout(() => {
            el.classList.add('reveal-visible')
          }, delay)
          obs.unobserve(el)
        }
      })
    }, observerOptions)

    root.querySelectorAll('.reveal-hidden').forEach((element) => {
      observer.observe(element)
    })

    const timer = setTimeout(() => {
      root.querySelectorAll('.reveal-hidden').forEach((element) => {
        if (element.getBoundingClientRect().top < window.innerHeight) {
          const delay = Number(element.getAttribute('data-reveal-delay') || 0)
          setTimeout(() => {
            element.classList.add('reveal-visible')
          }, delay)
        }
      })
    }, 100)

    return () => {
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [])

  return (
    <div
      ref={rootRef}
      className="bg-surface text-on-surface font-body-md antialiased selection:bg-primary-container selection:text-on-primary-container min-h-screen flex flex-col"
    >
      <main className="flex-grow pt-[0px]">
        {/* Hero Section */}
        <section className="relative px-margin-xs md:px-md py-lg md:py-xl max-w-container-max mx-auto overflow-hidden">
   
          <div className="absolute inset-0 bg-gradient-to-br from-surface via-primary/5 to-surface-container-low bg-animated-gradient -z-20" />
          <div
            className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/4 animate-float"
            style={{ animationDuration: '8s' }}
          />
          <div
            className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary-container/20 rounded-full blur-3xl -z-10 -translate-x-1/3 translate-y-1/3 animate-float"
            style={{ animationDuration: '10s', animationDelay: '2s' }}
          />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center">
            <div className="lg:col-span-5 flex flex-col gap-lg z-10 reveal-hidden" data-reveal-delay="100">
              <div className="flex flex-col gap-md">
                <div className="inline-flex items-center gap-xs px-sm py-xs bg-primary-container/10 text-primary rounded-full w-fit border border-primary/10">
                  <Brain className="text-[16px]" />
                  <span className="font-label-sm text-label-sm">AI-Powered Health Intelligence</span>
                </div>
                <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface tracking-tight">
                  Understand Medical Reports <span className="text-primary">Instantly</span> with AI
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg">
                  Upload medical reports and receive structured summaries, anomaly detection, health
                  trends, and AI-powered recommendations in seconds.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-sm">
                <Link
                  to={uploadHref}
                  className="bg-primary text-on-primary font-label-md text-label-md px-lg py-md rounded-full hover:scale-105 hover:opacity-90 transition-all duration-300 shadow-md flex items-center justify-center gap-sm active:scale-95"
                >
                  <Upload className="fill-current" />
                  Upload Report
                </Link>
                <a
                  href="/#how-it-works"
                  className="bg-transparent text-primary border border-outline-variant font-label-md text-label-md px-lg py-md rounded-full hover:bg-surface-container-low transition-all duration-300 flex items-center justify-center gap-sm"
                >
                  <PlayCircle />
                  View Demo
                </a>
              </div>
              <div className="flex items-center gap-sm mt-sm">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-surface-container-highest border-2 border-surface flex items-center justify-center text-xs font-bold text-on-surface-variant shadow-sm">
                    JD
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary-container border-2 border-surface flex items-center justify-center text-xs font-bold text-on-primary-container shadow-sm">
                    AM
                  </div>
                  <div className="w-8 h-8 rounded-full bg-tertiary-container border-2 border-surface flex items-center justify-center text-xs font-bold text-on-tertiary-container shadow-sm">
                    SL
                  </div>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Trusted by 10,000+ users
                </span>
              </div>
            </div>

            <div
              className="lg:col-span-7 relative z-10 mt-xl lg:mt-0 reveal-hidden"
              data-reveal-delay="300"
            >
              <div className="relative rounded-3xl p-sm bg-gradient-to-br from-surface-container-lowest to-surface-container-low border border-outline-variant/30 ambient-shadow">
                <div className="flex gap-2 absolute top-4 left-4 z-20">
                  <div className="w-3 h-3 rounded-full bg-error/80" />
                  <div className="w-3 h-3 rounded-full bg-tertiary-fixed-dim/80" />
                  <div className="w-3 h-3 rounded-full bg-secondary-fixed-dim/80" />
                </div>
                <img
                  alt="High-fidelity preview of the HealthLens AI dashboard showing health overview graphs, a smart timeline, latest reports list, and AI insights."
                  className="w-full h-auto rounded-2xl object-cover shadow-sm border border-outline-variant/20 relative z-10"
                  src={DASHBOARD_PREVIEW_SRC}
                />
                <div className="absolute -bottom-6 -left-6 md:-left-12 bg-surface-container-lowest p-sm md:p-md rounded-2xl border border-outline-variant/30 ambient-shadow glass-panel z-20 flex items-center gap-sm animate-float">
                  <div className="w-10 h-10 rounded-full bg-secondary-container/20 text-secondary-container flex items-center justify-center animate-pulse-glow">
                    <CheckCircle className="fill-current text-secondary" />
                  </div>
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Vitals Analyzed</p>
                    <p className="font-headline-md text-headline-md text-on-surface">All Normal</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards Section (Bento Grid) */}
        <section
          id="features"
          className="px-margin-mobile md:px-margin-desktop py-xl max-w-container-max mx-auto bg-surface-container-lowest rounded-3xl my-xl shadow-sm border border-outline-variant/20 relative scroll-mt-24"
        >
          <div className="text-center mb-xl max-w-2xl mx-auto reveal-hidden">
            <h2 className="font-headline-xl text-headline-xl text-on-surface mb-sm">
              Comprehensive Health Intelligence
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Our AI engines work in tandem to break down complex medical jargon into actionable
              insights.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            <div className="lg:col-span-2 bg-surface rounded-2xl p-lg border border-outline-variant/30 ambient-shadow transition-all duration-300 ambient-shadow-hover flex flex-col justify-between overflow-hidden relative group reveal-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 group-hover:bg-primary/10 transition-colors" />
              <div className="mb-xl">
                <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-xl flex items-center justify-center mb-md shadow-sm">
                  <FileScan />
                </div>
                <h3 className="font-headline-lg text-headline-lg text-on-surface mb-xs">
                  AI Report Analysis
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Extracts vitals, diagnosis, and medicines from complex lab results automatically.
                </p>
              </div>
              <div className="w-full bg-surface-container-lowest rounded-xl p-md border border-outline-variant/20 flex flex-col gap-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 animate-[scan_3s_ease-in-out_infinite]" />
                <div className="flex items-center gap-sm">
                  <div className="h-2 w-1/4 bg-surface-container-highest rounded-full" />
                  <div className="h-2 w-1/2 bg-surface-container-highest rounded-full" />
                </div>
                <div className="flex items-center gap-sm">
                  <div className="h-2 w-1/3 bg-primary/30 rounded-full" />
                  <div className="h-2 w-1/4 bg-surface-container-highest rounded-full" />
                </div>
                <div className="flex items-center gap-sm">
                  <div className="h-2 w-1/2 bg-surface-container-highest rounded-full" />
                </div>
              </div>
            </div>

            <div
              className="bg-surface rounded-2xl p-lg border border-outline-variant/30 ambient-shadow transition-all duration-300 ambient-shadow-hover flex flex-col reveal-hidden"
              data-reveal-delay="100"
            >
              <div className="w-12 h-12 bg-tertiary-container text-on-tertiary-container rounded-xl flex items-center justify-center mb-md shadow-sm">
                <History />
              </div>
              <h3 className="font-headline-lg text-headline-lg text-on-surface mb-xs">
                Smart Health Timeline
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
                Track consultations and reports visually over time.
              </p>
              <div className="mt-auto flex flex-col gap-sm relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant/30">
                <div className="flex gap-md items-start relative z-10">
                  <div className="w-5 h-5 rounded-full bg-primary border-4 border-surface shrink-0 mt-0.5" />
                  <div className="bg-surface-container-lowest p-sm rounded-lg border border-outline-variant/20 flex-grow">
                    <div className="h-2 w-1/2 bg-surface-container-highest rounded-full mb-1" />
                    <div className="h-1.5 w-1/3 bg-surface-container-high rounded-full" />
                  </div>
                </div>
                <div className="flex gap-md items-start relative z-10 opacity-60">
                  <div className="w-5 h-5 rounded-full bg-outline-variant border-4 border-surface shrink-0 mt-0.5" />
                  <div className="bg-surface-container-lowest p-sm rounded-lg border border-outline-variant/20 flex-grow">
                    <div className="h-2 w-2/3 bg-surface-container-highest rounded-full mb-1" />
                    <div className="h-1.5 w-1/4 bg-surface-container-high rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            <div
              className="bg-surface rounded-2xl p-lg border border-outline-variant/30 ambient-shadow transition-all duration-300 ambient-shadow-hover flex flex-col reveal-hidden"
              data-reveal-delay="200"
            >
              <div className="w-12 h-12 bg-secondary-container/30 text-on-surface rounded-xl flex items-center justify-center mb-md shadow-sm">
                <Activity className="text-secondary" />
              </div>
              <h3 className="font-headline-lg text-headline-lg text-on-surface mb-xs">Trend Analytics</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
                Monitor sugar, BP, cholesterol trends with clear graphs.
              </p>
              <div className="mt-auto h-24 bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-sm flex items-end gap-1">
                <div className="w-full bg-primary/20 rounded-t-sm h-[30%] hover:bg-primary/40 transition-colors" />
                <div className="w-full bg-primary/30 rounded-t-sm h-[50%] hover:bg-primary/50 transition-colors" />
                <div className="w-full bg-primary/40 rounded-t-sm h-[40%] hover:bg-primary/60 transition-colors" />
                <div className="w-full bg-primary/60 rounded-t-sm h-[70%] hover:bg-primary/80 transition-colors" />
                <div className="w-full bg-primary rounded-t-sm h-[60%] shadow-sm relative">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-surface-container-high text-on-surface text-[10px] px-1.5 py-0.5 rounded font-medium">
                    92
                  </div>
                </div>
              </div>
            </div>

            <div
              className="lg:col-span-2 bg-gradient-to-br from-surface to-surface-container-low rounded-2xl p-lg border border-outline-variant/30 ambient-shadow transition-all duration-300 ambient-shadow-hover flex flex-col md:flex-row gap-lg items-center relative overflow-hidden group reveal-hidden"
              data-reveal-delay="300"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent -z-10 group-hover:scale-110 transition-transform duration-700" />
              <div className="flex-1">
                <div className="w-12 h-12 bg-surface-container-highest text-on-surface rounded-xl flex items-center justify-center mb-md shadow-sm border border-surface">
                  <Lightbulb />
                </div>
                <h3 className="font-headline-lg text-headline-lg text-on-surface mb-xs">
                  AI Recommendations
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Receive simplified health insights and lifestyle recommendations based on your unique
                  data profile.
                </p>
              </div>
              <div className="flex-1 w-full bg-surface-container-lowest rounded-xl p-md border border-outline-variant/20 shadow-sm relative">
                <div className="flex items-start gap-sm mb-sm">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="text-[16px] text-primary" />
                  </div>
                  <div className="bg-surface-container-low p-sm rounded-lg rounded-tl-none border border-outline-variant/10">
                    <div className="h-2 w-32 bg-surface-container-highest rounded-full mb-2" />
                    <div className="h-2 w-48 bg-surface-container-highest rounded-full" />
                  </div>
                </div>
                <div className="flex items-start gap-sm justify-end">
                  <div className="bg-primary p-sm rounded-lg rounded-tr-none text-on-primary">
                    <div className="h-2 w-24 bg-white/30 rounded-full mb-2" />
                    <div className="h-2 w-16 bg-white/30 rounded-full" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0 border border-surface">
                    <User className="text-[16px] text-on-surface-variant" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="px-margin-mobile md:px-margin-desktop py-xl max-w-container-max mx-auto scroll-mt-24"
        >
          <div className="text-center mb-xl reveal-hidden">
            <h2 className="font-headline-xl text-headline-xl text-on-surface mb-sm">
              How HealthLens AI Works
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              A seamless journey from raw medical data to clear, actionable insights.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg relative">
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-outline-variant to-transparent -translate-y-1/2 -z-10" />
            <div className="flex flex-col items-center text-center group reveal-hidden" data-reveal-delay="100">
              <div className="w-16 h-16 bg-surface border-2 border-outline-variant/30 rounded-full flex items-center justify-center mb-md shadow-sm group-hover:border-primary group-hover:text-primary transition-colors bg-white relative z-10">
                <Upload className="text-[28px]" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-surface-container-highest text-on-surface rounded-full flex items-center justify-center text-xs font-bold border-2 border-surface">
                  1
                </div>
              </div>
              <h4 className="font-headline-md text-headline-md text-on-surface mb-xs">Upload</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Upload your medical report PDF or image securely.
              </p>
            </div>
            <div className="flex flex-col items-center text-center group reveal-hidden" data-reveal-delay="200">
              <div className="w-16 h-16 bg-surface border-2 border-outline-variant/30 rounded-full flex items-center justify-center mb-md shadow-sm group-hover:border-primary group-hover:text-primary transition-colors bg-white relative z-10">
                <FileScan className="text-[28px]" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-surface-container-highest text-on-surface rounded-full flex items-center justify-center text-xs font-bold border-2 border-surface">
                  2
                </div>
              </div>
              <h4 className="font-headline-md text-headline-md text-on-surface mb-xs">Extract</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Advanced OCR extracts text and data accurately.
              </p>
            </div>
            <div className="flex flex-col items-center text-center group reveal-hidden" data-reveal-delay="300">
              <div className="w-16 h-16 bg-surface border-2 border-outline-variant/30 rounded-full flex items-center justify-center mb-md shadow-sm group-hover:border-primary group-hover:text-primary transition-colors bg-white relative z-10">
                <Brain className="text-[28px]" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-surface-container-highest text-on-surface rounded-full flex items-center justify-center text-xs font-bold border-2 border-surface">
                  3
                </div>
              </div>
              <h4 className="font-headline-md text-headline-md text-on-surface mb-xs">Analyze</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                AI contextualizes health data against medical norms.
              </p>
            </div>
            <div className="flex flex-col items-center text-center group reveal-hidden" data-reveal-delay="400">
              <div className="w-16 h-16 bg-surface border-2 border-outline-variant/30 rounded-full flex items-center justify-center mb-md shadow-sm group-hover:border-primary group-hover:text-primary transition-colors bg-white relative z-10">
                <LayoutDashboard className="text-[28px]" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-surface-container-highest text-on-surface rounded-full flex items-center justify-center text-xs font-bold border-2 border-surface">
                  4
                </div>
              </div>
              <h4 className="font-headline-md text-headline-md text-on-surface mb-xs">Insights</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Dashboard updates instantly with visual insights.
              </p>
            </div>
          </div>
        </section>

        {/* Social Impact Section */}
        <section
          id="impact"
          className="px-margin-mobile md:px-margin-desktop py-xl md:py-2xl max-w-container-max mx-auto reveal-hidden scroll-mt-24"
        >
          <div className="bg-surface-container-low rounded-3xl overflow-hidden border border-outline-variant/20 shadow-sm relative">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-lg md:p-xl flex flex-col justify-center z-10 relative">
                <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mb-md">
                  <Heart className="fill-current" />
                </div>
                <h2 className="font-headline-xl text-headline-xl text-on-surface mb-sm tracking-tight">
                  Simplifying healthcare understanding for everyone.
                </h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant mb-lg">
                  Designed to improve healthcare accessibility. Whether you&apos;re managing a chronic
                  condition, caring for elderly parents, or living in rural areas with limited
                  specialist access, HealthLens AI brings clarity to your health data.
                </p>
                <div className="flex flex-wrap gap-sm">
                  <div className="px-sm py-xs bg-surface border border-outline-variant/30 rounded-full font-label-sm text-label-sm text-on-surface-variant flex items-center gap-xs">
                    <Accessibility className="text-[14px]" />
                    Elderly Patients
                  </div>
                  <div className="px-sm py-xs bg-surface border border-outline-variant/30 rounded-full font-label-sm text-label-sm text-on-surface-variant flex items-center gap-xs">
                    <Mountain className="text-[14px]" />
                    Rural Accessibility
                  </div>
                  <div className="px-sm py-xs bg-surface border border-outline-variant/30 rounded-full font-label-sm text-label-sm text-on-surface-variant flex items-center gap-xs">
                    <Users className="text-[14px]" />
                    Caregivers
                  </div>
                </div>
              </div>
              <div className="relative min-h-[300px] md:min-h-full">
                <img
                  alt="An elderly woman with white hair smiling gently while comfortably sitting on a light-colored sofa in a bright, modern living room. She is holding a white tablet device and interacting with a clean, high-contrast digital interface that displays large, colorful icons indicative of an accessible health application. The ambient lighting is soft and natural, emphasizing a mood of empowerment, calm, and technological accessibility for senior users."
                  className="absolute inset-0 w-full h-full object-cover"
                  src={SOCIAL_IMPACT_IMG_SRC}
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-surface-container-low via-surface-container-low/50 to-transparent w-full md:w-1/2" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
