// app/book/[slug]/page.tsx
// ОБНОВЛЁННАЯ ВЕРСИЯ с slot_holds flow

'use client'

import { useState, useEffect, use, useRef } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, addDays, startOfDay } from 'date-fns'
import { de } from 'date-fns/locale'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Check, Clock, User, Loader2, ChevronRight, Scissors, Eye, Sparkles, Heart, Sun, Hand, List, X } from 'lucide-react'
import 'react-day-picker/dist/style.css'

interface Variant {
    id: string
    name: string
    description: string | null
    duration: number
    price: number
}

interface Service {
    id: string
    name: string
    description: string | null
    duration: number
    price: number
    category_id: string | null
    variants: Variant[]
}

interface Tenant {
    id: string
    name: string
    slug: string
    logo_url: string | null
}

interface SubCategory {
    id: string
    name: string
    icon: string | null
    services: Service[]
}

interface Category {
    id: string
    name: string
    icon: string | null
    children: SubCategory[]
    services: Service[]
}

interface Staff {
    id: string
    name: string
    avatar_url: string | null
}

interface BookingResult {
    id: string
    start_time: string
}

type Step = 'service' | 'staff' | 'datetime' | 'form' | 'success'

const iconMap: Record<string, React.ReactNode> = {
    scissors: <Scissors className="h-5 w-5" />,
    eye: <Eye className="h-5 w-5" />,
    hand: <Hand className="h-5 w-5" />,
    sparkles: <Sparkles className="h-5 w-5" />,
    heart: <Heart className="h-5 w-5" />,
    sun: <Sun className="h-5 w-5" />,
}

export default function BookingWidget({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params)

    const [step, setStep] = useState<Step>('service')
    const [isLoading, setIsLoading] = useState(true)
    const [isSlotsLoading, setIsSlotsLoading] = useState(false)
    const [isDatesLoaded, setIsDatesLoaded] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [tenant, setTenant] = useState<Tenant | null>(null)
    const [categories, setCategories] = useState<Category[]>([])
    const [uncategorizedServices, setUncategorizedServices] = useState<Service[]>([])
    const [staff, setStaff] = useState<Staff[]>([])
    const [slots, setSlots] = useState<string[]>([])
    const [unavailableDates, setUnavailableDates] = useState<Date[]>([])

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [expandedSubCategory, setExpandedSubCategory] = useState<string | null>(null)
    const [selectedService, setSelectedService] = useState<Service | null>(null)
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
    const [showVariantModal, setShowVariantModal] = useState(false)
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const [selectedTime, setSelectedTime] = useState('')
    const [booking, setBooking] = useState<BookingResult | null>(null)
    const confirmButtonRef = useRef<HTMLDivElement>(null)

    const [formData, setFormData] = useState({
        client_name: '',
        client_phone: '',
        client_email: '',
        notes: '',
    })

    // ИЗМЕНЕНО: Hold flow вместо reservation
    const [holdId, setHoldId] = useState<string | null>(null)
    const [sessionToken, setSessionToken] = useState<string | null>(null)
    const [expiresAt, setExpiresAt] = useState<Date | null>(null)
    const [timeRemaining, setTimeRemaining] = useState<number>(0)

    // Загрузка tenant и services
    useEffect(() => {
        async function loadInitialData() {
            try {
                const [tenantRes, servicesRes] = await Promise.all([
                    fetch(`/api/widget/${slug}`),
                    fetch(`/api/widget/${slug}/services`),
                ])

                if (!tenantRes.ok) {
                    setError('Salon nicht gefunden')
                    return
                }

                const tenantData = await tenantRes.json()
                const servicesData = await servicesRes.json()

                setTenant(tenantData.tenant)
                setCategories(servicesData.categories || [])
                setUncategorizedServices(servicesData.uncategorized || [])
            } catch (err) {
                setError('Fehler beim Laden')
            } finally {
                setIsLoading(false)
            }
        }
        loadInitialData()
    }, [slug])

    // Загрузка staff при выборе услуги
    useEffect(() => {
        if (!selectedService) return

        const serviceId = selectedService.id

        async function loadStaff() {
            try {
                const res = await fetch(`/api/widget/${slug}/staff?service_id=${serviceId}`)
                const data = await res.json()
                setStaff(data.staff || [])
            } catch (err) {
                console.error('Failed to load staff:', err)
            }
        }
        loadStaff()
    }, [slug, selectedService])

    // Проверяем доступность дат при выборе мастера
    useEffect(() => {
        if (!selectedService || !selectedStaff) return

        const serviceId = selectedService.id
        const staffId = selectedStaff.id

        async function checkAvailableDates() {
            const today = startOfDay(new Date())
            const from = format(addDays(today, 1), 'yyyy-MM-dd')
            const to = format(addDays(today, 60), 'yyyy-MM-dd')

            setIsDatesLoaded(false)
            try {
                const params = new URLSearchParams({
                    service_id: serviceId,
                    staff_id: staffId,
                    from,
                    to,
                })
                const res = await fetch(`/api/widget/${slug}/availability?${params.toString()}`)
                const data = await res.json()
                if (data.unavailable) {
                    setUnavailableDates(data.unavailable.map((date: string) => new Date(date)))
                } else {
                    setUnavailableDates([])
                }
            } catch (err) {
                setUnavailableDates([])
            } finally {
                setIsDatesLoaded(true)
            }
        }

        checkAvailableDates()
    }, [slug, selectedService, selectedStaff])

    // Загрузка слотов при выборе даты
    useEffect(() => {
        if (!selectedService || !selectedStaff || !selectedDate) return

        const serviceId = selectedService.id
        const staffId = selectedStaff.id
        const dateStr = format(selectedDate, 'yyyy-MM-dd')

        async function loadSlots() {
            setIsSlotsLoading(true)
            try {
                const res = await fetch(
                    `/api/widget/${slug}/slots?service_id=${serviceId}&staff_id=${staffId}&date=${dateStr}`
                )
                const data = await res.json()
                setSlots(data.slots || [])
            } catch (err) {
                console.error('Failed to load slots:', err)
                setSlots([])
            } finally {
                setIsSlotsLoading(false)
            }
        }
        loadSlots()
    }, [slug, selectedService, selectedStaff, selectedDate])

    // Таймер для hold
    useEffect(() => {
        if (!expiresAt) return

        const interval = setInterval(() => {
            const now = new Date().getTime()
            const expires = new Date(expiresAt).getTime()
            const remaining = Math.max(0, Math.floor((expires - now) / 1000))

            setTimeRemaining(remaining)

            if (remaining === 0) {
                setError('Die Reservierung ist abgelaufen. Bitte wählen Sie erneut.')
                setStep('datetime')
                setHoldId(null)
                setSessionToken(null)
                setExpiresAt(null)
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [expiresAt])

    useEffect(() => {
        if (selectedTime && confirmButtonRef.current) {
            setTimeout(() => {
                confirmButtonRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                })
            }, 100)
        }
    }, [selectedTime])

    const handleServiceClick = (service: Service) => {
        if (service.variants && service.variants.length > 0) {
            setSelectedService(service)
            setShowVariantModal(true)
        } else {
            handleServiceSelect(service, null)
        }
    }

    const handleVariantSelect = (variant: Variant) => {
        setSelectedVariant(variant)
        setShowVariantModal(false)
        handleServiceSelect(selectedService!, variant)
    }

    const handleServiceSelect = (service: Service, variant: Variant | null) => {
        setSelectedService(service)
        setSelectedVariant(variant)
        setSelectedStaff(null)
        setSelectedDate(undefined)
        setSelectedTime('')
        setUnavailableDates([])
        setStep('staff')
    }

    const handleStaffSelect = (staffMember: Staff) => {
        setSelectedStaff(staffMember)
        setSelectedDate(undefined)
        setSelectedTime('')
        setIsDatesLoaded(false)
        setStep('datetime')
    }

    const handleDateSelect = (date: Date | undefined) => {
        setSelectedDate(date)
        setSelectedTime('')
    }

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time)
        setError(null)
    }

    // ИЗМЕНЕНО: Создаёт hold вместо reservation
    const handleContinueToForm = async () => {
        if (!selectedTime) return

        setIsLoading(true)
        setError(null)

        try {
            const res = await fetch(`/api/widget/${slug}/reserve-slot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: selectedService!.id,
                    variant_id: selectedVariant?.id || null,
                    staff_id: selectedStaff!.id,
                    date: format(selectedDate!, 'yyyy-MM-dd'),
                    time: selectedTime,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.message || 'Reservierung fehlgeschlagen')
                setIsLoading(false)
                return
            }

            // ИЗМЕНЕНО: Сохраняем hold_id и session_token
            setHoldId(data.hold.id)
            setSessionToken(data.hold.session_token)

            const expiresDate = new Date(data.hold.expires_at)
            setExpiresAt(expiresDate)

            // Установить начальное значение таймера
            const expires = expiresDate.getTime()
            const now = new Date().getTime()
            const remaining = Math.max(0, Math.floor((expires - now) / 1000))
            setTimeRemaining(remaining)

            setStep('form')
        } catch (err) {
            setError('Ein Fehler ist aufgetreten')
        } finally {
            setIsLoading(false)
        }
    }

    // ИЗМЕНЕНО: Подтверждает hold и создаёт booking
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        if (!holdId || !sessionToken) {
            setError('Keine gültige Reservierung')
            setIsLoading(false)
            return
        }

        try {
            const res = await fetch(`/api/widget/${slug}/complete-booking`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hold_id: holdId,
                    session_token: sessionToken,
                    client_name: formData.client_name.trim(),
                    client_phone: formData.client_phone.trim(),
                    client_email: formData.client_email.trim() || null,
                    notes: formData.notes.trim() || null,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                if (data.error === 'HOLD_EXPIRED') {
                    setError('Die Reservierung ist abgelaufen. Bitte wählen Sie erneut.')
                    setStep('datetime')
                    setHoldId(null)
                    setSessionToken(null)
                    setExpiresAt(null)
                    return
                }
                setError(data.message || 'Buchung fehlgeschlagen')
                return
            }

            setBooking({
                id: data.booking.id,
                start_time: data.booking.start_time,
            })
            setStep('success')
        } catch (err) {
            setError('Ein Fehler ist aufgetreten')
        } finally {
            setIsLoading(false)
        }
    }

    const goBack = async () => {
        if (step === 'staff') setStep('service')
        else if (step === 'datetime') setStep('staff')
        else if (step === 'form') {
            // Отменяем hold на сервере
            if (holdId && sessionToken) {
                try {
                    await fetch(`/api/widget/${slug}/cancel-hold`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            hold_id: holdId,
                            session_token: sessionToken,
                        }),
                    })
                } catch (err) {
                    console.error('Failed to cancel hold:', err)
                }
            }
            setHoldId(null)
            setSessionToken(null)
            setExpiresAt(null)
            setStep('datetime')
        }
    }

    const formatPrice = (cents: number) => {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
        }).format(cents / 100)
    }

    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes} Min.`
        const h = Math.floor(minutes / 60)
        const m = minutes % 60
        return m > 0 ? `${h} Std. ${m} Min.` : `${h} Std.`
    }

    const formatDateLong = (date: Date) => {
        return format(date, "EEEE, d. MMMM yyyy", { locale: de })
    }

    const formatTimeRemaining = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${minutes}:${secs.toString().padStart(2, '0')}`
    }

    const getPrice = () => selectedVariant?.price ?? selectedService?.price ?? 0
    const getDuration = () => selectedVariant?.duration ?? selectedService?.duration ?? 0
    const getServiceName = () => {
        if (selectedVariant) {
            return `${selectedService?.name} — ${selectedVariant.name}`
        }
        return selectedService?.name || ''
    }

    const getVisibleServices = (): Service[] => {
        if (!selectedCategory) {
            if (expandedSubCategory) {
                for (const cat of categories) {
                    const subCat = cat.children.find(s => s.id === expandedSubCategory)
                    if (subCat) {
                        return subCat.services
                    }
                }
                return []
            }

            const allServices: Service[] = [...uncategorizedServices]
            categories.forEach(cat => {
                allServices.push(...cat.services)
                cat.children.forEach(sub => {
                    allServices.push(...sub.services)
                })
            })
            return allServices
        }

        const category = categories.find(c => c.id === selectedCategory)
        if (!category) return []

        if (expandedSubCategory) {
            const subCat = category.children.find(s => s.id === expandedSubCategory)
            return subCat?.services || []
        }

        const services: Service[] = [...category.services]
        category.children.forEach(sub => {
            services.push(...sub.services)
        })
        return services
    }

    const currentCategory = categories.find(c => c.id === selectedCategory)

    if (isLoading && !tenant) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    if (error && !tenant) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-red-500">{error}</div>
            </div>
        )
    }

    const today = startOfDay(new Date())

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Variant Selection Modal */}
            {showVariantModal && selectedService && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-semibold text-gray-900">Option wählen</h3>
                            <button
                                onClick={() => setShowVariantModal(false)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-4">
                            <h4 className="font-medium text-gray-900 mb-1">{selectedService.name}</h4>
                            <p className="text-sm text-gray-500 mb-4">Bitte wählen Sie eine Option:</p>

                            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                                {selectedService.variants.map((variant) => (
                                    <div
                                        key={variant.id}
                                        className="border rounded-lg p-4"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-medium text-gray-900">{variant.name}</p>
                                                <p className="text-sm text-gray-500">{formatDuration(variant.duration)}</p>
                                            </div>
                                            <p className="font-semibold">{formatPrice(variant.price)}</p>
                                        </div>
                                        <Button
                                            onClick={() => handleVariantSelect(variant)}
                                            className="w-full"
                                            variant="default"
                                        >
                                            Auswählen
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <p className="text-xs text-gray-400 mt-4">
                                Die angezeigten Preise gelten für die aufgeführten Dienstleistungen.
                                Wenn Sie und der Salon während Ihres Termins einen anderen Service besprechen,
                                wird der Preis für diesen neuen Service angewendet.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="bg-white border-b">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <h1 className="text-xl font-bold text-gray-900">{tenant?.name}</h1>
                    <p className="text-sm text-gray-500">Online-Terminbuchung</p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Progress */}
                {step !== 'success' && (
                    <div className="flex items-center gap-2 mb-8">
                        {['service', 'staff', 'datetime', 'form'].map((s, i) => (
                            <div key={s} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === s ? 'bg-blue-600 text-white' :
                                    ['service', 'staff', 'datetime', 'form'].indexOf(step) > i
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    {['service', 'staff', 'datetime', 'form'].indexOf(step) > i ? '✓' : i + 1}
                                </div>
                                {i < 3 && <div className="w-8 h-0.5 bg-gray-200" />}
                            </div>
                        ))}
                    </div>
                )}

                {/* Back Button */}
                {step !== 'service' && step !== 'success' && (
                    <button
                        onClick={goBack}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Zurück
                    </button>
                )}

                {/* Step 1: Service with Categories */}
                {step === 'service' && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">Dienstleistung wählen</h2>

                        {/* Category Tabs */}
                        {categories.length > 0 && (
                            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                                <button
                                    onClick={() => { setSelectedCategory(null); setExpandedSubCategory(null) }}
                                    className={`flex flex-col items-center gap-1.5 px-4 py-3 border rounded-lg min-w-[80px] transition-all ${
                                        !selectedCategory ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                                    }`}
                                >
                                    <List className="h-5 w-5" />
                                    <span className="text-xs font-medium">Alle</span>
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => { setSelectedCategory(cat.id); setExpandedSubCategory(null) }}
                                        className={`flex flex-col items-center gap-1.5 px-4 py-3 border rounded-lg min-w-[80px] transition-all ${
                                            selectedCategory === cat.id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                                        }`}
                                    >
                                        {cat.icon && iconMap[cat.icon] ? iconMap[cat.icon] : <Scissors className="h-5 w-5" />}
                                        <span className="text-xs font-medium text-center leading-tight">{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
                            {/* Subcategories Sidebar */}
                            <div className="lg:block">
                                <div className="bg-white border rounded-lg overflow-hidden">
                                    {!selectedCategory ? (
                                        categories.flatMap(cat => cat.children).length > 0 ? (
                                            <>
                                                <button
                                                    onClick={() => setExpandedSubCategory(null)}
                                                    className={`w-full px-4 py-3 text-left flex items-center justify-between border-b transition-all ${
                                                        !expandedSubCategory ? 'bg-gray-100' : 'hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <span className="text-sm font-medium text-gray-700">Alle Dienstleistungen</span>
                                                    <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${
                                                        !expandedSubCategory ? 'rotate-90' : ''
                                                    }`} />
                                                </button>
                                                {categories.flatMap(cat => cat.children).map(sub => (
                                                    <button
                                                        key={sub.id}
                                                        onClick={() => setExpandedSubCategory(expandedSubCategory === sub.id ? null : sub.id)}
                                                        className={`w-full px-4 py-3 text-left flex items-center justify-between border-b last:border-b-0 transition-all ${
                                                            expandedSubCategory === sub.id ? 'bg-gray-100' : 'hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <span className="text-sm font-medium text-gray-700">{sub.name}</span>
                                                        <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${
                                                            expandedSubCategory === sub.id ? 'rotate-90' : ''
                                                        }`} />
                                                    </button>
                                                ))}
                                            </>
                                        ) : (
                                            <div className="px-4 py-6 text-center">
                                                <p className="text-sm text-gray-400">Keine Unterkategorien</p>
                                            </div>
                                        )
                                    ) : currentCategory && currentCategory.children.length > 0 ? (
                                        currentCategory.children.map(sub => (
                                            <button
                                                key={sub.id}
                                                onClick={() => setExpandedSubCategory(expandedSubCategory === sub.id ? null : sub.id)}
                                                className={`w-full px-4 py-3 text-left flex items-center justify-between border-b last:border-b-0 transition-all ${
                                                    expandedSubCategory === sub.id ? 'bg-gray-100' : 'hover:bg-gray-50'
                                                }`}
                                            >
                                                <span className="text-sm font-medium text-gray-700">{sub.name}</span>
                                                <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${
                                                    expandedSubCategory === sub.id ? 'rotate-90' : ''
                                                }`} />
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-4 py-6 text-center">
                                            <p className="text-sm text-gray-400">Keine Unterkategorien</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Services List */}
                            <div className="space-y-3">
                                {getVisibleServices().map((service) => (
                                    <button
                                        key={service.id}
                                        onClick={() => handleServiceClick(service)}
                                        className="w-full bg-white border rounded-lg p-4 text-left hover:border-blue-500 hover:shadow-sm transition-all"
                                    >
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-gray-900">{service.name}</p>
                                                {service.description && (
                                                    <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                                                )}
                                                <p className="text-sm text-gray-400 mt-2">
                                                    {service.variants && service.variants.length > 0
                                                        ? `${service.variants.length} Optionen verfügbar`
                                                        : formatDuration(service.duration)
                                                    }
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className="font-semibold text-gray-900 whitespace-nowrap">
                                                    {service.variants && service.variants.length > 0
                                                        ? `ab ${formatPrice(Math.min(...service.variants.map(v => v.price)))}`
                                                        : formatPrice(service.price)
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                                {getVisibleServices().length === 0 && (
                                    <p className="text-gray-500 text-center py-8">Keine Services in dieser Kategorie</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Staff */}
                {step === 'staff' && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Mitarbeiter wählen
                        </h2>
                        <div className="space-y-3 max-w-2xl">
                            {staff.map((member) => (
                                <button
                                    key={member.id}
                                    onClick={() => handleStaffSelect(member)}
                                    className="w-full bg-white border rounded-lg p-4 text-left hover:border-blue-500 hover:shadow transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                                            <span className="text-lg font-medium text-gray-600">
                                                {member.name.charAt(0)}
                                            </span>
                                        </div>
                                        <p className="font-medium text-gray-900">{member.name}</p>
                                    </div>
                                </button>
                            ))}
                            {staff.length === 0 && (
                                <p className="text-gray-500 text-center py-8">Keine Mitarbeiter verfügbar</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 3: Date & Time */}
                {step === 'datetime' && (
                    <div className="max-w-2xl">
                        <h2 className="text-lg font-semibold mb-4">Datum & Uhrzeit wählen</h2>

                        {!isDatesLoaded ? (
                            <div className="bg-white border rounded-lg p-4 mb-6 flex items-center justify-center min-h-[400px]">
                                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                            </div>
                        ) : (
                            <div className="bg-white border rounded-lg p-2 sm:p-4 mb-6 overflow-x-auto">
                                <style>{`
                .booking-calendar .rdp {
                  --rdp-cell-size: 40px;
                  --rdp-accent-color: #2563eb;
                  --rdp-background-color: #eff6ff;
                  margin: 0 auto;
                }
                @media (max-width: 400px) {
                  .booking-calendar .rdp {
                    --rdp-cell-size: 36px;
                  }
                }
                @media (max-width: 340px) {
                  .booking-calendar .rdp {
                    --rdp-cell-size: 32px;
                  }
                }
                .booking-calendar .rdp-day_disabled {
                  color: #d1d5db !important;
                  background-color: #f3f4f6 !important;
                }
                .booking-calendar .rdp-day_selected {
                  background-color: #2563eb !important;
                  color: white !important;
                }
                .booking-calendar .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
                  background-color: #dbeafe;
                }
              `}</style>
                                <div className="booking-calendar min-w-[280px]">
                                    <DayPicker
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={handleDateSelect}
                                        locale={de}
                                        disabled={[
                                            { before: addDays(today, 1) },
                                            { after: addDays(today, 60) },
                                            ...unavailableDates,
                                        ]}
                                        modifiers={{
                                            unavailable: unavailableDates,
                                        }}
                                        modifiersStyles={{
                                            unavailable: {
                                                color: '#d1d5db',
                                                backgroundColor: '#f9fafb',
                                            },
                                        }}
                                        footer={
                                            <div className="mt-4 pt-4 border-t flex items-center gap-4 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <span className="w-3 h-3 rounded bg-blue-600"></span>
                                                    Ausgewählt
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="w-3 h-3 rounded bg-gray-200"></span>
                                                    Nicht verfügbar
                                                </span>
                                            </div>
                                        }
                                    />
                                </div>
                            </div>
                        )}

                        {isDatesLoaded && selectedDate && (
                            <div className="bg-white border rounded-lg p-4">
                                <Label className="mb-3 block flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Verfügbare Zeiten am {format(selectedDate, 'd. MMMM', { locale: de })}
                                </Label>

                                {isSlotsLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                    </div>
                                ) : slots.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {slots.map((time) => (
                                            <button
                                                key={time}
                                                onClick={() => handleTimeSelect(time)}
                                                className={`px-3 py-2 text-sm border rounded-lg transition-all ${
                                                    selectedTime === time
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                                                        : 'hover:border-blue-300 hover:bg-blue-50'
                                                }`}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-4">
                                        Keine Termine an diesem Tag verfügbar
                                    </p>
                                )}

                            </div>

                        )}

                        {/* Кнопка подтверждения времени */}
                        {isDatesLoaded && selectedTime && (
                            <div className="mt-6 pt-6 border-t" ref={confirmButtonRef}>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Ausgewählte Zeit</p>
                                        <p className="text-lg font-semibold text-gray-900">{selectedTime} Uhr</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedTime('')}
                                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                                    >
                                        Ändern
                                    </button>
                                </div>

                                {error && (
                                    <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    onClick={handleContinueToForm}
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Zeitslot wird reserviert...
                                        </>
                                    ) : (
                                        'Weiter zur Buchung'
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 4: Contact Form */}
                {step === 'form' && (
                    <div className="max-w-2xl">
                        {/* Компактный таймер */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold">Ihre Daten</h2>
                            {timeRemaining > 0 && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 border border-orange-300 rounded-full">
                                    <Clock className="h-3.5 w-3.5 text-orange-600" />
                                    <span className="text-sm font-mono font-semibold text-orange-700">
                                        {formatTimeRemaining(timeRemaining)}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <p className="font-medium text-gray-900">{getServiceName()}</p>
                            <p className="text-sm text-gray-600">mit {selectedStaff?.name}</p>
                            <p className="text-sm text-gray-600 mt-2">
                                {selectedDate && formatDateLong(selectedDate)} um {selectedTime} Uhr
                            </p>
                            <p className="font-semibold text-gray-900 mt-2">
                                {formatPrice(getPrice())}
                            </p>

                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="client_name">Name *</Label>
                                <Input
                                    id="client_name"
                                    placeholder="Max Mustermann"
                                    value={formData.client_name}
                                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="client_phone">Telefon *</Label>
                                <Input
                                    id="client_phone"
                                    type="tel"
                                    placeholder="+49 123 456 7890"
                                    value={formData.client_phone}
                                    onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="client_email">E-Mail*</Label>

                                <Input
                                    type="email"
                                    required
                                    placeholder="erikamustermann@mail.de"
                                    value={formData.client_email}
                                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Anmerkungen (optional)</Label>
                                <textarea
                                    id="notes"
                                    placeholder="Besondere Wünsche..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    rows={3}
                                />
                            </div>

                            <label className="flex items-start gap-2 text-sm text-gray-600">
                                <input type="checkbox" required className="mt-1 h-4 w-4" />
                                <span>
                                    Ich habe die{' '}
                                    <Link
                                        href="/datenschutz"
                                        target="_blank"
                                        rel="noreferrer noopener"
                                        className="underline"
                                    >
                                        Datenschutzerklärung
                                    </Link>{' '}
                                    gelesen und stimme der Verarbeitung meiner Daten zu.
                                </span>
                            </label>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Wird gebucht...
                                    </>
                                ) : (
                                    'Termin buchen'
                                )}
                            </Button>
                        </form>
                    </div>
                )}

                {/* Step 5: Success */}
                {step === 'success' && booking && (
                    <div className="text-center py-8 max-w-md mx-auto">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Termin gebucht!</h2>
                        <p className="text-gray-600 mb-6">
                            Vielen Dank für Ihre Buchung.
                        </p>

                        <div className="bg-white border rounded-lg p-6 text-left">
                            <p className="text-sm text-gray-500 mb-1">Buchungs-ID</p>
                            <p className="text-2xl font-mono font-bold text-gray-900 mb-4">
                                {booking.id.slice(0, 8).toUpperCase()}
                            </p>

                            <div className="border-t pt-4 space-y-2">
                                <p className="text-sm">
                                    <span className="text-gray-500">Service:</span>{' '}
                                    <span className="font-medium">{getServiceName()}</span>
                                </p>
                                <p className="text-sm">
                                    <span className="text-gray-500">Mit:</span>{' '}
                                    <span className="font-medium">{selectedStaff?.name}</span>
                                </p>
                                <p className="text-sm">
                                    <span className="text-gray-500">Wann:</span>{' '}
                                    <span className="font-medium">
                                        {selectedDate && formatDateLong(selectedDate)} um {selectedTime} Uhr
                                    </span>
                                </p>
                            </div>
                        </div>

                        <p className="text-sm text-gray-500 mt-6">
                            Bitte merken Sie sich die Buchungs-ID.
                        </p>
                    </div>
                )}
            </main>
            <div className="text-xs text-gray-500 text-center mt-4 pt-4 border-t">
                <Link href="/impressum" target="_blank" rel="noreferrer noopener" className="hover:text-gray-700">
                    Impressum
                </Link>
                {' | '}
                <Link href="/datenschutz" target="_blank" rel="noreferrer noopener" className="hover:text-gray-700">
                    Datenschutz
                </Link>
            </div>
        </div>
    )
}
