// lib/email/templates/admin-cancellation-notification.tsx

import {
    Html,
    Head,
    Body,
    Container,
    Heading,
    Text,
    Section,
    Link,
    Hr,
    Preview,
} from '@react-email/components'

interface AdminCancellationNotificationProps {
    salonName: string
    clientName: string
    clientPhone: string
    clientEmail: string | null
    serviceName: string
    staffName: string
    date: string
    time: string
}

export default function AdminCancellationNotificationEmail({
    salonName,
    clientName,
    clientPhone,
    clientEmail,
    serviceName,
    staffName,
    date,
    time,
}: AdminCancellationNotificationProps) {
    return (
        <Html>
            <Head />
            <Preview>Stornierung: {serviceName} am {date} um {time} Uhr</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>⚠️ Termin storniert</Heading>

                    <Text style={text}>
                        Ein Kunde hat seinen Termin storniert.
                    </Text>

                    <Section style={detailsBox}>
                        <Text style={sectionTitle}>Buchungsdetails</Text>
                        <Text style={detailRow}>
                            <strong>Service:</strong> {serviceName}
                        </Text>
                        <Text style={detailRow}>
                            <strong>Mitarbeiter:</strong> {staffName}
                        </Text>
                        <Text style={detailRow}>
                            <strong>Datum:</strong> {date}
                        </Text>
                        <Text style={detailRow}>
                            <strong>Uhrzeit:</strong> {time} Uhr
                        </Text>
                    </Section>

                    <Section style={detailsBox}>
                        <Text style={sectionTitle}>Kundendaten</Text>
                        <Text style={detailRow}>
                            <strong>Name:</strong> {clientName}
                        </Text>
                        <Text style={detailRow}>
                            <strong>Telefon:</strong>{' '}
                            <Link href={`tel:${clientPhone.replace(/\s/g, '')}`} style={link}>
                                {clientPhone}
                            </Link>
                        </Text>
                        {clientEmail && (
                            <Text style={detailRow}>
                                <strong>E-Mail:</strong>{' '}
                                <Link href={`mailto:${clientEmail}`} style={link}>
                                    {clientEmail}
                                </Link>
                            </Text>
                        )}
                    </Section>

                    <Hr style={hr} />

                    <Text style={infoText}>
                        Der Zeitslot ist jetzt wieder verfügbar.
                    </Text>

                    <Text style={footer}>
                        Diese E-Mail wurde automatisch von BookingHub gesendet.
                    </Text>
                </Container>
            </Body>
        </Html>
    )
}

const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
    backgroundColor: '#ffffff',
    margin: '40px auto',
    padding: '32px',
    borderRadius: '8px',
    maxWidth: '480px',
}

const h1 = {
    color: '#1a1a1a',
    fontSize: '24px',
    fontWeight: '600',
    margin: '0 0 24px',
}

const text = {
    color: '#374151',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '16px 0',
}

const sectionTitle = {
    color: '#6b7280',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    margin: '0 0 12px',
    letterSpacing: '0.5px',
}

const detailsBox = {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '20px',
    margin: '16px 0',
}

const detailRow = {
    color: '#374151',
    fontSize: '15px',
    lineHeight: '28px',
    margin: '0',
}

const link = {
    color: '#2563eb',
    textDecoration: 'underline',
}

const hr = {
    borderColor: '#e5e7eb',
    margin: '24px 0',
}

const infoText = {
    color: '#059669',
    fontSize: '14px',
    fontWeight: '500',
    margin: '16px 0',
}

const footer = {
    color: '#9ca3af',
    fontSize: '13px',
    marginTop: '24px',
}
