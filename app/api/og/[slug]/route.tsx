import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const size = { width: 1200, height: 630 }

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params

    const { data: tenant } = await supabaseAdmin
        .from('tenants')
        .select('name, og_image_url')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

    // If custom OG image exists, redirect to it
    if (tenant?.og_image_url) {
        return Response.redirect(tenant.og_image_url, 302)
    }

    // Generate dynamic OG image
    const salonName = tenant?.name || 'Salon'

    return new ImageResponse(
        (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#ffffff',
                    position: 'relative',
                }}
            >
                {/* Accent border */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 8,
                        background: 'linear-gradient(90deg, #4F46E5, #10B981)',
                    }}
                />

                {/* Content */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        padding: 80,
                        paddingTop: 88,
                        height: '100%',
                    }}
                >
                    {/* Logo mark */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 56,
                            height: 56,
                            backgroundColor: '#10B981',
                            borderRadius: 12,
                            marginBottom: 40,
                            fontSize: 28,
                            color: 'white',
                        }}
                    >
                        B
                    </div>

                    {/* Salon name */}
                    <div
                        style={{
                            fontSize: 72,
                            fontWeight: 700,
                            color: '#111827',
                            marginBottom: 16,
                            maxWidth: 900,
                            lineClamp: 2,
                        }}
                    >
                        {salonName}
                    </div>

                    {/* Subtitle */}
                    <div
                        style={{
                            fontSize: 32,
                            color: '#6B7280',
                        }}
                    >
                        Online Termin buchen
                    </div>
                </div>

                {/* Footer */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 40,
                        left: 80,
                        right: 80,
                        borderTop: '1px solid #E5E7EB',
                        paddingTop: 24,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <span style={{ fontSize: 20, color: '#9CA3AF' }}>
                        powered by BookingHub
                    </span>
                    <span style={{ fontSize: 20, color: '#9CA3AF' }}>
                        bookinghub.de
                    </span>
                </div>
            </div>
        ),
        { ...size }
    )
}
