/*
 * Sends a contact-form message straight to the site owner's inbox through a
 * form-to-email service (GitHub Pages is static, so there's no server of our
 * own). Configure `profile.contact` in portfolioData.js:
 *
 *   { provider: 'web3forms', key: '<access key>' }  → https://web3forms.com
 *   { provider: 'formspree', key: '<form id>' }     → https://formspree.io
 *
 * Both keys are designed to be public: they can only deliver mail to the
 * address they were registered with.
 */
const PROVIDERS = {
  web3forms: {
    url: () => 'https://api.web3forms.com/submit',
    body: (key, m) => ({
      access_key: key,
      subject: m.subject,
      from_name: `${m.name} via astro-port`,
      name: m.name,
      email: m.email,
      replyto: m.email,
      message: m.message,
      botcheck: '',
    }),
    ok: (res, json) => res.ok && json?.success !== false,
  },
  formspree: {
    url: (key) => `https://formspree.io/f/${encodeURIComponent(key)}`,
    body: (_key, m) => ({ name: m.name, email: m.email, _replyto: m.email, _subject: m.subject, message: m.message }),
    ok: (res, json) => res.ok && !json?.errors,
  },
};

export function canSendDirectly(contact) {
  return Boolean(contact?.key && PROVIDERS[contact.provider]);
}

/* Resolves on delivery; throws an Error with a short human-readable reason otherwise. */
export async function sendMessage(contact, message, { timeoutMs = 15000 } = {}) {
  const p = PROVIDERS[contact.provider];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(p.url(contact.key), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(p.body(contact.key, message)),
      signal: controller.signal,
    });
    const json = await res.json().catch(() => null);
    if (!p.ok(res, json)) {
      const reason = json?.message || json?.errors?.[0]?.message || `HTTP ${res.status}`;
      throw new Error(reason);
    }
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('timed out');
    if (err instanceof TypeError) throw new Error('network unreachable');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
