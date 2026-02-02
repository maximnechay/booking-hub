// lib/email/templates/booking-rescheduled.tsx

import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Link,
    Preview,
    Section,
    Text,
} from '@react-email/components'

interface BookingRescheduledEmailProps {
    clientName: string
    salonName: string
    serviceName: string
    staffName: string
    oldDate: string
    oldTime: string
    newDate: string
    newTime: string
    duration: string
    salonAddress?: string
    salonPhone?: string
    cancelUrl?: string
}

export default function BookingRescheduledEmail({
    clientName,
    salonName,
    serviceName,
    staffName,
    oldDate,
    oldTime,
    newDate,
    newTime,
    duration,
    salonAddress,
    salonPhone,
    cancelUrl,
}: BookingRescheduledEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>Termin verschoben: {serviceName} am {newDate} um {newTime} Uhr</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>Termin verschoben</Heading>

                    <Text style={text}>
                        Hallo {clientName},
                    </Text>

                    <Text style={text}>
                        Ihr Termin wurde erfolgreich verschoben.
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
                        <Text style={detailRow}>
                            <strong>Dauer:</strong> {duration}
                        </Text>
                    </Section>

                    <Section style={oldDetailsBox}>
                        <Text style={detailLabel}>ALTER TERMIN (STORNIERT)</Text>
                        <Text style={detailRow}>
                            <strong>Datum:</strong> {oldDate}
                        </Text>
                        <Text style={detailRow}>
                            <strong>Uhrzeit:</strong> {oldTime} Uhr
                        </Text>
                    </Section>

                    {(salonAddress || salonPhone) && (
                        <>
                            <Hr style={hr} />
                            {salonAddress && (
                                <Text style={textSmall}>
                                    <strong>Adresse:</strong>{' '}
                                    <Link
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(salonAddress)}`}
                                        style={link}
                                    >
                                        {salonAddress}
                                    </Link>
                                </Text>
                            )}
                            {salonPhone && (
                                <Text style={textSmall}>
                                    <strong>Telefon:</strong>{' '}
                                    <Link href={`tel:${salonPhone.replace(/\s/g, '')}`} style={link}>
                                        {salonPhone}
                                    </Link>
                                </Text>
                            )}
                        </>
                    )}

                    <Hr style={hr} />

                    {cancelUrl && (
                        <Section style={cancelSection}>
                            <Text style={textSmall}>
                                Falls Sie den Termin absagen möchten:
                            </Text>
                            <Button style={cancelButton} href={cancelUrl}>
                                Termin stornieren
                            </Button>
                        </Section>
                    )}

                    <Text style={noteText}>
                        Hinweis: Ein Termin kann nur einmal verschoben werden.
                    </Text>

                    <Text style={footer}>
                        Mit freundlichen Grüßen,<br />
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

const textSmall = {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '20px',
    margin: '8px 0',
}

const link = {
    color: '#2563eb',
    textDecoration: 'underline',
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

const cancelSection = {
    textAlign: 'center' as const,
    margin: '16px 0',
}

const cancelButton = {
    backgroundColor: '#ef4444',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '500',
    padding: '10px 20px',
    textDecoration: 'none',
    display: 'inline-block',
    marginTop: '8px',
}

const noteText = {
    color: '#9ca3af',
    fontSize: '13px',
    lineHeight: '20px',
    margin: '16px 0',
    fontStyle: 'italic',
}

const footer = {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '22px',
    marginTop: '32px',
}
