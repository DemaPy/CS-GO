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

/**
 * Newsletter confirmation email.
 *
 * Styled after a military demolition device — dark housing, warning-tape amber,
 * a green LED readout — matching the landing page's Visual Direction. It is an
 * aesthetic homage, deliberately carrying no third-party game trademarks,
 * logos, or in-game lines: this is commercial mail for our own product.
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
  ground: '#12140f',
  housing: '#1f2319',
  panel: '#0b0f08',
  paper: '#d8d4c6',
  muted: 'rgba(216, 212, 198, 0.62)',
  faint: 'rgba(216, 212, 198, 0.42)',
  brass: '#8a6e3b',
  amber: '#c8862a',
  armed: '#4ee27b',
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
      <Preview>One click arms your subscription. Nothing else.</Preview>
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
          {/* Warning tape. A striped repeating-linear-gradient degrades to the
              solid amber background colour where gradients are unsupported. */}
          <Section
            style={{
              height: '10px',
              backgroundColor: COLORS.amber,
              backgroundImage: `repeating-linear-gradient(135deg, ${COLORS.amber} 0, ${COLORS.amber} 10px, ${COLORS.ground} 10px, ${COLORS.ground} 20px)`,
              borderRadius: '2px 2px 0 0',
            }}
          />

          {/* Device housing */}
          <Section
            style={{
              backgroundColor: COLORS.housing,
              padding: '30px 28px 34px',
              border: `1px solid ${COLORS.brass}`,
              borderTop: 'none',
            }}
          >
            <Text
              style={{
                margin: '0 0 22px',
                fontFamily: MONO,
                fontSize: '11px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: COLORS.amber,
              }}
            >
              Stage five &middot; awaiting confirmation
            </Text>

            {/* The LED panel */}
            <Section
              style={{
                backgroundColor: COLORS.panel,
                border: '1px solid #000000',
                borderRadius: '3px',
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
                  color: 'rgba(78, 226, 123, 0.55)',
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
                fontWeight: 700,
                color: COLORS.paper,
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
              Confirm this address and you will get build notes and updates.
              That is the whole list. No digests, no partners.
            </Text>

            {/* A styled <a>, not <Button>: Outlook ignores padding on anchors,
                so the visual weight comes from a bordered block that survives
                being reduced to plain text. */}
            <Section style={{ marginBottom: '26px' }}>
              <Link
                href={confirmUrl}
                style={{
                  display: 'inline-block',
                  padding: '14px 26px',
                  backgroundColor: COLORS.armed,
                  color: COLORS.panel,
                  fontFamily: MONO,
                  fontSize: '14px',
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  borderRadius: '3px',
                }}
              >
                Arm subscription
              </Link>
            </Section>

            <Text
              style={{
                margin: '0 0 6px',
                fontFamily: SANS,
                fontSize: '13px',
                lineHeight: 1.5,
                color: COLORS.faint,
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
                color: COLORS.faint,
              }}
            >
              {confirmUrl}
            </Text>
          </Section>

          <Hr
            style={{
              border: 'none',
              borderTop: `1px solid ${COLORS.brass}`,
              margin: '0 0 16px',
            }}
          />

          <Text
            style={{
              margin: '0 0 8px',
              fontFamily: MONO,
              fontSize: '11px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: COLORS.amber,
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
              color: COLORS.faint,
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
