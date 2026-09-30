import type { SiteCopy } from './types'

// Copy approved 2026-09-27. Only the product name is still TODO(copy).
export const en: SiteCopy = {
  meta: {
    title: 'Plant it. Defuse it. Wake up.',
    description:
      'An alarm clock built like a bomb prop: countdown display, keypad code, defuse to snooze. Join the waitlist.',
    subscribedTitle: 'Address confirmed',
  },
  sections: {
    casing: {
      eyebrow: 'Stage one',
      stage: 'Casing',
      heading: 'An alarm clock that looks like a bomb',
      body: 'A desk prop with a real alarm inside. Scroll to build it.',
    },
    charges: {
      eyebrow: 'Stage two',
      stage: 'Charges',
      heading: 'Three blocks. Zero explosives.',
      body: "Inert, weighted, made to look the part. It's a clock; the blocks are just for drama.",
    },
    harness: {
      eyebrow: 'Stage three',
      stage: 'Harness',
      heading: 'Every wire goes somewhere',
      body: "Cut the right one and the alarm snoozes. Cut the wrong one and it doesn't.",
    },
    panel: {
      eyebrow: 'Stage four',
      stage: 'Panel',
      heading: "Set it like you're planting it",
      body: 'Punch your wake-up time into the keypad. The display counts down to it all night.',
    },
    arm: {
      eyebrow: 'Stage five',
      stage: 'Arm',
      heading: 'Defuse your morning',
      body: 'Enter the code to stop it, before the timer does. Type your email on the display to join the waitlist.',
    },
  },
  lcd: {
    label: 'address',
    button: 'arm',
    busy: 'wait',
    messageFont: 'segment',
    joined: "you're on the list — confirm in your inbox",
    checkoutFailed: 'checkout did not open — try again',
    errors: {
      empty: 'type an address first',
      too_long: 'that address is too long',
      missing_at: 'that address is missing an @',
      double_at: 'that address has more than one @',
      no_local: 'add the part before the @',
      no_domain: 'add the domain after the @',
      domain_no_dot: 'the domain needs a dot, like example.com',
      domain_stray_dot: 'that domain has a stray dot',
      invalid: 'that address is not a valid email',
    },
  },
  subscribed: {
    states: {
      confirmed: {
        eyebrow: 'Confirmed',
        heading: 'You are on the list',
        body: "We'll email you when it ships. Build notes and launch news only; every message has an unsubscribe link.",
      },
      expired: {
        eyebrow: 'Link expired',
        heading: 'That link was too old',
        body: 'Confirmation links last seven days. Enter your address again and a fresh one will arrive.',
      },
      invalid: {
        eyebrow: 'Link not valid',
        heading: 'That link did not check out',
        body: 'It may have been broken by your email client. Enter your address again to get a new one.',
      },
    },
    back: 'Back to the device',
  },
  email: {
    subject: 'Confirm your spot on the waitlist',
    preview: 'One click confirms your spot on the waitlist.',
    eyebrow: 'Stage five · awaiting confirmation',
    lcdLabel: 'status',
    lcdValue: 'NOT ARMED',
    heading: 'One click and you are on the list',
    body: "Confirm this address to hold your place on the waitlist. You'll hear when it ships: build notes and launch news only.",
    button: 'Confirm my spot',
    fallbackHint: 'Button not working? Paste this into your browser:',
    expiry: (days) => `This link expires in ${days} days`,
    footer:
      'Did not ask for this? Ignore it. Your address has not been added to anything, and the link stops working on its own.',
  },
  credits: {
    by: ' by ',
    modified: 'regrouped for animation',
  },
  switcher: {
    label: 'Language',
  },
}
