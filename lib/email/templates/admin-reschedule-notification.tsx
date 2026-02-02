// lib/email/templates/admin-reschedule-notification.tsx

import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Text,
} from '@react-email/components'

interface AdminRescheduleNotificationProps {
    salonName: string
    clientName: string
    clientPhone: string
    clientEmail: string | null
    serviceName: string
    staffName: string
    oldDate: string
    oldTime: string
    newDate: string
    newTime: string
}

export default function AdminRescheduleNotificationEmail({
    salonName,
    clientName,
    clientPhone,
    clientEmail,
    serviceName,
    staffName,
    oldDate,
    oldTime,
    newDate,
    newTime,
}: AdminRescheduleNotificationProps) {
    return (
        <Html>
            <Head />
            <Preview>Termin verschoben: {serviceName} — {clientName}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>Termin verschoben</Heading>

                    <Text style={text}>
                        Ein Kunde hat seinen Termin verschoben.
                    </Text>

                    <Section style={newDetailsBox}>
                        <Text style={detailLabel}>NEUER TERMIN</Text>
                        <Text style={detailRow}>
                            <strong>Service:</strong> {serviceName}
                        </Text>
                        <Text style={detailRow}>
                            <strong>Mitarbeiter:</strong> {staffName}
                        </Text>
                        <Text style={detailRow}>
                            <strong>Datum:</strong> {newDate}
                        </Text>
                        <Text style={detailRow}>
                            <strong>Uhrzeit:</strong> {newTime} Uhr
                        </Text>
                    </Section>

                    <Section style={oldDetailsBox}>
                        <Text style={detailLabel}>ALTER TERMIN</Text>
                        <Text style={detailRow}>
                            <strong>Datum:</strong> {oldDate}
                        </Text>
                        <Text style={detailRow}>
                            <strong>Uhrzeit:</strong> {oldTime} Uhr
                        </Text>
                    </Section>

                    <Hr style={hr} />

                    <Section style={clientBox}>
                        <Text style={detailLabel}>KUNDE</Text>
                        <Text style={detailRow}>
                            <strong>Name:</strong> {clientName}
                        </Text>
                        <Text style={detailRow}>
                            <strong>Telefon:</strong> {clientPhone}
                        </Text>
                        {clientEmail && (
                            <Text style={detailRow}>
                                <strong>E-Mail:</strong> {clientEmail}
                            </Text>
                        )}
                    </Section>

                    <Text style={footer}>
                        {salonName}
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

const detailLabel = {
    color: '#6b7280',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    margin: '0 0 12px',
}

const newDetailsBox = {
    backgroundColor: '#f0fdf4',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0 16px',
    borderLeft: '4px solid #22c55e',
}

const oldDetailsBox = {
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    padding: '20px',
    margin: '0 0 24px',
    borderLeft: '4px solid #ef4444',
}

const clientBox = {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
}

const detailRow = {
    color: '#374151',
    fontSize: '15px',
    lineHeight: '28px',
    margin: '0',
}

const hr = {
    borderColor: '#e5e7eb',
    margin: '24px 0',
}

const footer = {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '22px',
    marginTop: '32px',
}
