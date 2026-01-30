'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DeleteBookingButton({ bookingId }: { bookingId: string }) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)

    async function handleDelete() {
        if (!confirm('Termin wirklich stornieren?')) return

        setIsDeleting(true)
        try {
            const res = await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' })
            if (res.ok) {
                router.refresh()
            }
        } catch {
            // ignore
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    )
}
