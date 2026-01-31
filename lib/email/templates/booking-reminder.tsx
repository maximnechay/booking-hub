// lib/email/templates/booking-reminder.tsx

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

interface BookingReminderEmailProps {
    clientName: string
    salonName: string
    serviceName: string
    staffName: string
    date: string
    time: string
    duration: string
    salonAddress?: string
    salonPhone?: string
    cancelUrl?: string
}

export default function BookingReminderEmail({
    clientName,
    salonName,
    serviceName,
    staffName,
    date,
    time,
    duration,
    salonAddress,
    salonPhone,
    cancelUrl,
}: BookingReminderEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>Erinnerung: Ihr Termin heute bei {salonName} um {time} Uhr</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>Terminerinnerung</Heading>

                    <Text style={text}>
                        Hallo {clientName},
                    </Text>

                    <Text style={text}>
                        wir möchten Sie an Ihren heutigen Termin erinnern:
                    </Text>

                    <Section style={detailsBox}>
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
                        <Text style={detailRow}>
                            <strong>Dauer:</strong> {duration}
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

                    {cancelUrl ? (
                        <Section style={cancelSection}>
                            <Text style={textSmall}>
                                Falls Sie den Termin nicht wahrnehmen können:
                            </Text>
                            <Button style={cancelButton} href={cancelUrl}>
                                Termin stornieren
                            </Button>
                        </Section>
                    ) : (
                        <Text style={textSmall}>
                            Falls Sie den Termin absagen oder verschieben möchten,
                            kontaktieren Sie uns bitte telefonisch.
                        </Text>
                    )}

                    <Text style={text}>
                        Wir freuen uns auf Ihren Besuch!
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

// Styles (consistent with booking-confirmation.tsx)
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

const detailsBox = {
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

const cancelSection = {
    textAlign: 'center' as const,
    margin: '16px 0',
}

const cancelButton = {
    backgroundColor: '#f3f4f6',
    borderRadius: '6px',
    color: '#374151',
    fontSize: '14px',
    fontWeight: '500',
    padding: '10px 20px',
    textDecoration: 'none',
    display: 'inline-block',
    marginTop: '8px',
}
