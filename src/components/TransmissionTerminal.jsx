import { useState } from 'react';
import { Github, Linkedin, Loader2, Mail, Send } from 'lucide-react';
import StarChip from './ui/StarChip';
import { canSendDirectly, sendMessage } from '../lib/sendMessage';

const EMPTY = { callsign: '', frequency: '', subject: '', message: '', honeypot: '' };

/*
 * Contact "terminal". With `profile.contact` configured (see lib/sendMessage.js)
 * the message is delivered straight to the owner's inbox from the page. Without
 * it, or if delivery fails, it falls back to a prefilled mailto: link.
 */
export default function TransmissionTerminal({ profile, highlighted }) {
  const direct = canSendDirectly(profile.contact);
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState('idle'); // idle | sending | sent | failed
  const [log, setLog] = useState(['> GROUND STATION ONLINE', `> UPLINK TARGET: ${profile.email}`]);
  const [fallbackHref, setFallbackHref] = useState(null);

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (status === 'sent') setStatus('idle');
  };
  const push = (...lines) => setLog((l) => [...l, ...lines].slice(-6));

  const compose = () => {
    const name = form.callsign.trim();
    const email = form.frequency.trim();
    const subject = form.subject.trim() || `Transmission from ${name || 'a visitor'}`;
    const message = form.message.trim();
    const body = [message, '', '—', `Callsign: ${name || 'n/a'}`, `Return frequency: ${email || 'n/a'}`].join('\n');
    const mailto = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return { name, email, subject, message, mailto };
  };

  const submit = async (e) => {
    e.preventDefault();
    if (status === 'sending') return;
    const msg = compose();

    if (!direct) {
      push('> ENCODING PAYLOAD…', '> HANDING OFF TO LOCAL MAIL CLIENT ✓');
      window.location.href = msg.mailto;
      return;
    }
    // Bots fill every field, including this invisible one; pretend success and drop it.
    if (form.honeypot) {
      setStatus('sent');
      push('> TRANSMISSION RECEIVED ✓');
      return;
    }

    setStatus('sending');
    setFallbackHref(null);
    push('> ENCODING PAYLOAD…', '> TRANSMITTING…');
    try {
      await sendMessage(profile.contact, msg);
      setStatus('sent');
      push(`> TRANSMISSION RECEIVED ✓  Thanks, ${msg.name.split(' ')[0] || 'friend'}. I'll reply to ${msg.email}.`);
      setForm(EMPTY);
    } catch (err) {
      setStatus('failed');
      setFallbackHref(msg.mailto);
      push(`> LINK FAILURE: ${err.message}`, '> Your message is still in the form. Retry, or use your mail app below.');
    }
  };

  const links = [
    { href: `mailto:${profile.email}`, label: 'Email', icon: Mail },
    profile.links.linkedin && { href: profile.links.linkedin, label: 'LinkedIn', icon: Linkedin },
    profile.links.github && { href: profile.links.github, label: 'GitHub', icon: Github },
  ].filter(Boolean);

  const field =
    // 16px text below desktop: iOS Safari zooms the page when focusing inputs smaller than that.
    'w-full rounded-sm border border-line/20 bg-bg/70 px-2.5 py-2 font-mono text-base text-ink lg:text-sm placeholder:text-muted/60 focus:border-accent/70 focus:outline-none';

  return (
    <section
      id="item-comms"
      aria-labelledby="comms-title"
      className={`glass reticle rounded-sm p-4 transition-colors ${highlighted ? 'border-accent/70' : ''}`}
    >
      <div className="flex items-center justify-between">
        <h3 id="comms-title" className="font-mono text-[13px] uppercase tracking-[0.18em] text-accent">
          Transmission Terminal
        </h3>
        <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted">
          <span className={`h-1.5 w-1.5 rounded-full ${status === 'failed' ? 'bg-warn' : status === 'sending' ? 'animate-blink bg-warn' : 'animate-blink bg-accent'}`} />
          {status === 'sending' ? 'Transmitting' : status === 'failed' ? 'Link failure' : 'Link ready'}
        </span>
      </div>

      <StarChip itemId="comms" className="mt-1" />
      <pre className="mt-3 overflow-hidden whitespace-pre-wrap rounded-sm bg-bg/80 p-2.5 font-mono text-[13px] leading-relaxed text-accent/80" aria-live="polite">
        {log.join('\n')}
      </pre>

      <form onSubmit={submit} className="relative mt-3 grid gap-2.5">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="hud-label">Callsign (name)</span>
            <input className={field} value={form.callsign} onChange={update('callsign')} autoComplete="name" required />
          </label>
          <label className="grid gap-1">
            <span className="hud-label">Return frequency (email)</span>
            {/* Required when sending directly, otherwise there's no way to reply. */}
            <input className={field} type="email" value={form.frequency} onChange={update('frequency')} autoComplete="email" required={direct} />
          </label>
        </div>
        <label className="grid gap-1">
          <span className="hud-label">Subject</span>
          <input className={field} value={form.subject} onChange={update('subject')} />
        </label>
        <label className="grid gap-1">
          <span className="hud-label">Message</span>
          <textarea className={`${field} min-h-[96px] resize-y`} value={form.message} onChange={update('message')} required maxLength={5000} />
        </label>
        {/* Honeypot: hidden from people and screen readers, irresistible to form-filling bots. */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={form.honeypot}
          onChange={update('honeypot')}
          className="absolute -left-[9999px] h-px w-px opacity-0"
        />
        <button
          type="submit"
          disabled={status === 'sending'}
          className="hud-btn min-h-[44px] justify-center border-accent/50 py-2 text-accent hover:bg-accent/10 disabled:cursor-wait disabled:opacity-70"
        >
          {status === 'sending' ? <Loader2 size={14} aria-hidden className="animate-spin" /> : <Send size={14} aria-hidden />}
          {status === 'sending' ? 'Transmitting…' : status === 'sent' ? 'Sent ✓ · send another' : 'Transmit'}
        </button>
        {fallbackHref && (
          <a href={fallbackHref} className="hud-btn justify-center">
            <Mail size={14} aria-hidden /> Open in your mail app instead
          </a>
        )}
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {links.map(({ href, label, icon: Icon }) => (
          <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="hud-btn">
            <Icon size={13} aria-hidden /> {label}
          </a>
        ))}
      </div>
    </section>
  );
}
