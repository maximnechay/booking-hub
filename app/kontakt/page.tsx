import SiteHeader from '../../components/SiteHeader'
import SiteFooter from '../../components/SiteFooter'
import KontaktQuiz from '../../components/KontaktQuiz'

export const metadata = {
  title: 'Kontakt & Beratung | BookingHub',
  description: 'Kostenlose Beratung für Online-Terminbuchung. In 1 Minute zur passenden Lösung für Ihren Salon.',
}

export default function KontaktPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <SiteHeader />
      <KontaktQuiz />
      <SiteFooter />
    </div>
  )
}
