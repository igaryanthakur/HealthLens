import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function AuthBackHome() {
  return (
    <Link
      to="/"
      className="text-sm text-outline hover:text-primary transition-colors flex items-center gap-2 mb-6"
    >
      <ArrowLeft size={16} />
      Back to Home
    </Link>
  )
}
