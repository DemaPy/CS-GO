import {
  Body,
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

import { PALETTE } from '@/content/palette'

/**
 * Light studio, matching the landing page: an off-white ground, a white card,
 * near-black type, the page's signal orange for the one action. One dark LCD
 * strip is kept as the single echo of the device. Deliberately carries no
 * third-party game trademarks, logos, or in-game lines.
 *
 * ## Email is not the browser
 *
 * - Inline styles only. Most clients strip `<style>`, and Gmail strips classes.
 * - No webfonts. DSEG14 renders on the page but would silently fall back here,
 *   so the readout uses a monospace stack that exists everywhere.
 * - No images. An image-blocked client (the default in many clients) still sees
 *   every word that matters, including the button.
 * - No flexbox or grid. Layout is single-column and stacks by default.
 */

const COLORS = {
  ground: PALETTE.ground,
  card: '#FFFFFF',
  rule: PALETTE.rule,
  ink: PALETTE.ink,
  muted: PALETTE.muted,
  signalInk: PALETTE.signalInk,
  lcd: PALETTE.lcd,
  armed: PALETTE.armed,
}

const MONO =
  "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace"
const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"

export interface ConfirmAddressEmailProps {
  confirmUrl: string
  /** Matches the token TTL in lib/consent-token.ts. */
  expiresInDays?: number
}

export function ConfirmAddressEmail({
  confirmUrl,
  expiresInDays = 7,
}: ConfirmAddressEmailProps) {
  return (
    <Html lang="en">
      <Head />
      {/* The inbox preview line — worth writing, since clients show it next to
          the subject and otherwise leak the first body words. */}
      <Preview>One click confirms your spot on the waitlist.</Preview>
      <Body
        style={{
          margin: 0,
          padding: '32px 0',
          backgroundColor: COLORS.ground,
          fontFamily: SANS,
        }}
      >
        <Container
          style={{
            maxWidth: '520px',
            margin: '0 auto',
            padding: '0 16px',
          }}
        >
          {/* The card */}
          <Section
            style={{
              backgroundColor: COLORS.card,
              padding: '30px 28px 34px',
              border: `1px solid ${COLORS.rule}`,
              borderRadius: '6px',
            }}
          >
            <Text
              style={{
                margin: '0 0 22px',
                fontFamily: MONO,
                fontSize: '11px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: COLORS.signalInk,
              }}
            >
              Stage five &middot; awaiting confirmation
            </Text>

            {/* The LED panel */}
            <Section
              style={{
                backgroundColor: COLORS.lcd,
                border: 'none',
                borderRadius: '4px',
                padding: '18px 18px 20px',
                marginBottom: '28px',
              }}
            >
              <Text
                style={{
                  margin: '0 0 8px',
                  fontFamily: MONO,
                  fontSize: '10px',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  // Solid hex, not rgba: this hits AA (≈6.0:1) on the LCD's
                  // #0B0F08, where the old translucent green only cleared
                  // ≈4.1:1 — and Outlook's Word engine drops rgba() entirely.
                  color: '#3AA35C',
                }}
              >
                status
              </Text>
              <Text
                style={{
                  margin: 0,
                  fontFamily: MONO,
                  fontSize: '25px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: COLORS.armed,
                }}
              >
                NOT ARMED
              </Text>
            </Section>

            <Heading
              as="h1"
              style={{
                margin: '0 0 14px',
                fontFamily: SANS,
                fontSize: '27px',
                lineHeight: 1.15,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: COLORS.ink,
              }}
            >
              One click and you are on the list
            </Heading>

            <Text
              style={{
                margin: '0 0 28px',
                fontFamily: SANS,
                fontSize: '16px',
                lineHeight: 1.55,
                color: COLORS.muted,
              }}
            >
              Confirm this address to hold your place on the waitlist.
              You&apos;ll hear when it ships: build notes and launch news
              only.
            </Text>

            {/* A styled <a>, not <Button>: Outlook ignores padding on anchors,
                so the visual weight comes from a bordered block that survives
                being reduced to plain text. Signal-ink, not black: partial-invert
                dark modes darken the card and would swallow a black button (D6). */}
            <Section style={{ marginBottom: '26px' }}>
              <Link
                href={confirmUrl}
                style={{
                  display: 'inline-block',
                  padding: '14px 26px',
                  backgroundColor: COLORS.signalInk,
                  color: '#FFFFFF',
                  fontFamily: SANS,
                  fontSize: '14px',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  textTransform: 'none',
                  textDecoration: 'none',
                  borderRadius: '6px',
                }}
              >
                Confirm my spot
              </Link>
            </Section>

            <Text
              style={{
                margin: '0 0 6px',
                fontFamily: SANS,
                fontSize: '13px',
                lineHeight: 1.5,
                color: COLORS.muted,
              }}
            >
              Button not working? Paste this into your browser:
            </Text>
            <Text
              style={{
                margin: 0,
                fontFamily: MONO,
                fontSize: '12px',
                lineHeight: 1.5,
                wordBreak: 'break-all',
                color: COLORS.muted,
              }}
            >
              {confirmUrl}
            </Text>
          </Section>

          <Hr
            style={{
              border: 'none',
              borderTop: `1px solid ${COLORS.rule}`,
              margin: '0 0 16px',
            }}
          />

          <Text
            style={{
              margin: '0 0 8px',
              fontFamily: MONO,
              fontSize: '11px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: COLORS.signalInk,
            }}
          >
            This link expires in {expiresInDays} days
          </Text>

          <Text
            style={{
              margin: 0,
              fontFamily: SANS,
              fontSize: '13px',
              lineHeight: 1.55,
              color: COLORS.muted,
            }}
          >
            Did not ask for this? Ignore it. Your address has not been added to
            anything, and the link stops working on its own.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default ConfirmAddressEmail
