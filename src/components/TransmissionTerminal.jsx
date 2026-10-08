import { useState } from 'react';
import { Github, Linkedin, Mail, Send } from 'lucide-react';
import StarChip from './ui/StarChip';

/*
 * Contact "terminal". No backend: submitting composes a mailto: link
 * prefilled with the visitor's message and hands it to their mail client.
 */
export default function TransmissionTerminal({ profile, highlighted }) {
  const [form, setForm] = useState({ callsign: '', frequency: '', subject: '', message: '' });
  const [log, setLog] = useState(['> GROUND STATION ONLINE', `> UPLINK TARGET: ${profile.email}`]);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const subject = form.subject.trim() || `Transmission from ${form.callsign.trim() || 'a visitor'}`;
    const body = [
      form.message.trim(),
      '',
      '—',
      `Callsign: ${form.callsign.trim() || 'n/a'}`,
      `Return frequency: ${form.frequency.trim() || 'n/a'}`,
    ].join('\n');
    const href = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setLog((l) => [...l.slice(-4), '> ENCODING PAYLOAD…', '> HANDING OFF TO LOCAL MAIL CLIENT ✓']);
    window.location.href = href;
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
          <span className="h-1.5 w-1.5 animate-blink rounded-full bg-accent" /> Link ready
        </span>
      </div>

      <StarChip itemId="comms" className="mt-1" />
      <pre className="mt-3 overflow-hidden whitespace-pre-wrap rounded-sm bg-bg/80 p-2.5 font-mono text-[13px] leading-relaxed text-accent/80" aria-live="polite">
        {log.join('\n')}
      </pre>

      <form onSubmit={submit} className="mt-3 grid gap-2.5">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="hud-label">Callsign (name)</span>
            <input className={field} value={form.callsign} onChange={update('callsign')} autoComplete="name" required />
          </label>
          <label className="grid gap-1">
            <span className="hud-label">Return frequency (email)</span>
            <input className={field} type="email" value={form.frequency} onChange={update('frequency')} autoComplete="email" />
          </label>
        </div>
        <label className="grid gap-1">
          <span className="hud-label">Subject</span>
          <input className={field} value={form.subject} onChange={update('subject')} />
        </label>
        <label className="grid gap-1">
          <span className="hud-label">Message</span>
          <textarea className={`${field} min-h-[96px] resize-y`} value={form.message} onChange={update('message')} required />
        </label>
        <button type="submit" className="hud-btn min-h-[44px] justify-center border-accent/50 py-2 text-accent hover:bg-accent/10">
          <Send size={13} aria-hidden /> Transmit
        </button>
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
