// lib/email/templates/booking-cancellation.tsx

import {
    Html,
    Head,
    Body,
    Container,
    Heading,
    Text,
    Section,
    Button,
    Hr,
    Preview,
} from '@react-email/components'

interface BookingCancellationEmailProps {
    clientName: string
    salonName: string
    serviceName: string
    staffName: string
    date: string
    time: string
    bookingUrl?: string
}

export default function BookingCancellationEmail({
    clientName,
    salonName,
    serviceName,
    staffName,
    date,
    time,
    bookingUrl,
}: BookingCancellationEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>Ihr Termin bei {salonName} wurde storniert</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>Termin storniert</Heading>

                    <Text style={text}>
                        Hallo {clientName},
                    </Text>

                    <Text style={text}>
                        Ihr Termin wurde erfolgreich storniert:
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
                    </Section>

                    <Hr style={hr} />

                    {bookingUrl && (
                        <Section style={ctaSection}>
                            <Text style={text}>
                                Sie möchten einen neuen Termin buchen?
                            </Text>
                            <Button style={ctaButton} href={bookingUrl}>
                                Neuen Termin buchen
                            </Button>
                        </Section>
                    )}

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

const detailsBox = {
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
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

const ctaSection = {
    textAlign: 'center' as const,
    margin: '24px 0',
}

const ctaButton = {
    backgroundColor: '#2563eb',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '500',
    padding: '12px 24px',
    textDecoration: 'none',
    display: 'inline-block',
    marginTop: '8px',
}

const footer = {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '22px',
    marginTop: '32px',
}
