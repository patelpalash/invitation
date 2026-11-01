import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, FormEvent, ReactNode } from 'react';
import { AnimatePresence, motion, MotionConfig, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowDown, ArrowRight, ArrowUpRight, CalendarBlank, Champagne, Check, DownloadSimple, EnvelopeSimple, FacebookLogo, FlowerLotus, Heart, InstagramLogo, LinkSimple, MapPin, MoonStars, Plus, ShareNetwork, Sparkle, WhatsappLogo, X } from '@phosphor-icons/react';
import { assetURL, dateParts, defaults, downloadCalendar, downloadCard, eventInstant, loadInvitation, palettes, sanitizeInvitation, saveInvitation, shareURL, shiftedDate } from './invitation';
import type { Colorway, Invitation } from './invitation';

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .12 }} transition={{ duration: .8, delay, ease: [.22, 1, .36, 1] }}>{children}</motion.div>;
}

function Dialog({ children, open, onClose, label, drawer = false }: { children: ReactNode; open: boolean; onClose: () => void; label: string; drawer?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (open && element && !element.open) {
      const previous = document.activeElement as HTMLElement | null;
      element.showModal();
      element.querySelector<HTMLElement>('[data-initial-focus]')?.focus();
      const oldOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { element.close(); document.body.style.overflow = oldOverflow; previous?.focus(); };
    }
  }, [open]);
  return <dialog ref={ref} aria-label={label} className={drawer ? 'dialog editor-dialog' : 'dialog share-dialog'} onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    {open && <div className="dialog-content">{children}</div>}
  </dialog>;
}

function Countdown({ invitation }: { invitation: Invitation }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const difference = Math.max(0, eventInstant(invitation).getTime() - now);
  const units = [Math.floor(difference / 86400000), Math.floor(difference / 3600000) % 24, Math.floor(difference / 60000) % 60, Math.floor(difference / 1000) % 60];
  return <div className="countdown-wrap">
    <span className="eyebrow">{difference > 0 ? 'A LITTLE CLOSER TO FOREVER' : 'OUR FOREVER HAS BEGUN'}</span>
    <div className="countdown" role="timer" aria-live="off" aria-label={difference > 0 ? `${units[0]} days until the wedding` : 'The wedding date has arrived'}>
      {['Days', 'Hours', 'Minutes', 'Seconds'].map((label, index) => <div className="countdown-unit" key={label}><span className="countdown-number" aria-hidden="true">{String(units[index]).padStart(2, '0')}</span><span className="eyebrow" aria-hidden="true">{label}</span></div>)}
    </div>
  </div>;
}

function Editor({ invitation, onChange, onSave, onClose }: { invitation: Invitation; onChange: (invitation: Invitation) => void; onSave: () => void; onClose: () => void }) {
  function field(key: keyof Invitation, value: string) { onChange({ ...invitation, [key]: value }); }
  function submit(event: FormEvent) { event.preventDefault(); onSave(); }
  return <form className="editor-form" onSubmit={submit}>
    <header className="dialog-heading"><div><span className="eyebrow">THE GARDEN EDIT · 01</span><h2>Make it <em>yours.</em></h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close editor"><X size={21} /></button></header>
    <p className="dialog-intro">Your people. Your story. A beautiful beginning, made personal.</p>
    <div className="editor-fields">
      <fieldset><legend><span>01</span> Your names</legend><div className="field-row"><label>Your first name<input data-initial-focus required maxLength={22} value={invitation.firstName} onChange={e => field('firstName', e.target.value)} placeholder="Aanya" /></label><label>Their first name<input required maxLength={22} value={invitation.secondName} onChange={e => field('secondName', e.target.value)} placeholder="Vihaan" /></label></div></fieldset>
      <fieldset><legend><span>02</span> The day & the place</legend><label>Wedding date<input type="date" required min="2020-01-01" max="2100-12-31" value={invitation.date} onChange={e => field('date', e.target.value)} /></label><label>Venue<input required maxLength={70} value={invitation.venue} onChange={e => field('venue', e.target.value)} /></label><div className="field-row"><label>City<input required maxLength={40} value={invitation.city} onChange={e => field('city', e.target.value)} /></label><label>Country<input required maxLength={40} value={invitation.country} onChange={e => field('country', e.target.value)} /></label></div><p className="field-note">Celebration times are in India Standard Time (IST).</p></fieldset>
      <fieldset><legend><span>03</span> A little feeling</legend><label>Your one-liner<input required maxLength={90} value={invitation.tagline} onChange={e => field('tagline', e.target.value)} /></label><label>Invitation message<textarea required maxLength={350} rows={4} value={invitation.message} onChange={e => field('message', e.target.value)} /></label><label>Your story<textarea required maxLength={800} rows={5} value={invitation.story} onChange={e => field('story', e.target.value)} /></label></fieldset>
      <fieldset><legend><span>04</span> Set the mood</legend><div className="colorways">{(Object.keys(palettes) as Colorway[]).map(color => <button className={`colorway ${invitation.colorway === color ? 'is-selected' : ''}`} type="button" key={color} aria-pressed={invitation.colorway === color} onClick={() => field('colorway', color)}><span className="colorway-swatch" style={{ background: palettes[color].ink, color: palettes[color].paper }}>{invitation.colorway === color && <Check size={15} weight="bold" />}</span>{palettes[color].name}</button>)}</div><p className="field-note">One timeless template. Three ways to make it feel like you.</p></fieldset>
    </div>
    <div className="editor-footer"><button type="submit" className="button primary full-width">Save my invitation <ArrowRight size={19} /></button><button type="button" className="text-button reset-button" onClick={() => onChange({ ...defaults })}>Start again with the sample</button></div>
  </form>;
}

function ShareDialog({ invitation, onClose, notify }: { invitation: Invitation; onClose: () => void; notify: (message: string) => void }) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const linkRef = useRef<HTMLInputElement>(null);
  const link = shareURL(invitation);
  const date = dateParts(invitation.date);
  const text = `${invitation.firstName} & ${invitation.secondName} are getting married! Join us on ${date.full} in ${invitation.city}. You, us & a little magic.\n${link}`;
  async function copy() {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(link);
      else {
        linkRef.current?.focus(); linkRef.current?.select();
        if (!document.execCommand('copy')) throw new Error('Clipboard unavailable');
      }
      setCopied(true); notify('A little joy, copied. Your invitation link is ready.');
    } catch { linkRef.current?.focus(); linkRef.current?.select(); notify('Select and copy the invitation link below.'); }
  }
  async function nativeShare() {
    if (!navigator.share) { await copy(); return; }
    try { await navigator.share({ title: `${invitation.firstName} & ${invitation.secondName} — You’re invited`, text: `${date.full} · ${invitation.city}`, url: link }); }
    catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) notify('Sharing is unavailable here. Try copying your link instead.'); }
  }
  async function card() {
    setDownloading(true);
    try { await downloadCard(invitation); notify('Your invitation card is ready to share.'); }
    catch { notify('We couldn’t create your card. Please try again.'); }
    finally { setDownloading(false); }
  }
  return <>
    <header className="dialog-heading"><div><span className="eyebrow">GOOD THINGS ARE MEANT TO BE SHARED</span><h2>Send a little <em>joy.</em></h2></div><button className="icon-button" onClick={onClose} aria-label="Close sharing"><X size={21} /></button></header>
    <div className="share-card-preview"><img src={assetURL('images/garden-palace.webp')} alt="" /><div><span className="eyebrow">YOU’RE INVITED</span><h3>{invitation.firstName} <em>&</em> {invitation.secondName}</h3><p>{date.full} · {invitation.city}</p></div></div>
    <div className="social-options">
      <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer"><WhatsappLogo size={25} /><span>WhatsApp</span></a>
      <a href={`mailto:?subject=${encodeURIComponent(`${invitation.firstName} & ${invitation.secondName} — You’re invited`)}&body=${encodeURIComponent(text)}`}><EnvelopeSimple size={25} /><span>Email</span></a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`} target="_blank" rel="noopener noreferrer"><FacebookLogo size={25} /><span>Facebook</span></a>
      <button onClick={nativeShare}><ShareNetwork size={25} /><span>More options</span></button>
    </div>
    <label className="share-link-label" htmlFor="share-link">Your personal invitation link</label><div className="copy-link"><input ref={linkRef} id="share-link" value={link} readOnly onClick={e => e.currentTarget.select()} /><button onClick={copy} aria-label="Copy invitation link">{copied ? <Check size={18} /> : <LinkSimple size={18} />}{copied ? 'Copied' : 'Copy'}</button></div>
    <button className="button primary full-width download-card" onClick={card} disabled={downloading}><DownloadSimple size={20} />{downloading ? 'Creating your card…' : 'Download invitation card'}<span className="file-tag">PNG</span></button>
    <p className="instagram-note"><InstagramLogo size={17} />Made for your story. Download the card and add your invitation link on Instagram.</p>
    <p className="share-footnote">Share with your favourite people. Anyone with this link can view your invitation.</p>
  </>;
}

function App() {
  const [initial] = useState(loadInvitation);
  const [invitation, setInvitation] = useState(initial.invitation);
  const [draft, setDraft] = useState(initial.invitation);
  const [editorOpen, setEditorOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduced = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '-8%']);
  const current = editorOpen ? draft : invitation;
  const date = dateParts(current.date || defaults.date);
  const before = dateParts(shiftedDate(current.date || defaults.date, -1));
  const colors = palettes[current.colorway];
  const heroNameLength = Math.max(current.firstName.length, current.secondName.length + 1);
  const nameSize = Math.min(1, 7 / heroNameLength);
  const paletteStyles = { '--paper': colors.paper, '--ink': colors.ink, '--accent': colors.accent, '--surface': colors.surface, '--muted': colors.muted, '--name-scale': nameSize } as CSSProperties;

  function notify(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message); toastTimer.current = setTimeout(() => setToast(''), 4200);
  }
  useEffect(() => { if (initial.badLink) notify('This invitation link is incomplete. Here’s a little inspiration instead.'); return () => { if (toastTimer.current) clearTimeout(toastTimer.current); }; }, [initial.badLink]);
  useEffect(() => {
    document.title = `${current.firstName} & ${current.secondName} — A beautiful beginning`;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors.paper);
  }, [current.firstName, current.secondName, colors.paper]);
  useEffect(() => {
    const readHash = () => { const loaded = loadInvitation(); setInvitation(loaded.invitation); setDraft(loaded.invitation); if (loaded.badLink) notify('This invitation link is incomplete. Showing the sample invitation.'); };
    window.addEventListener('hashchange', readHash); return () => window.removeEventListener('hashchange', readHash);
  }, []);

  function scrollTo(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' }); }
  function openEditor() { setDraft({ ...invitation }); setEditorOpen(true); }
  function save() {
    const next = sanitizeInvitation(draft);
    const persisted = saveInvitation(next);
    setInvitation(next); setEditorOpen(false);
    notify(persisted ? 'Beautifully yours. Your invitation is saved.' : 'Your invitation is in this link. Copy it to keep your changes.');
  }

  const notification = <AnimatePresence>{toast && <motion.div role="status" className="toast" initial={reduced ? false : { opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: reduced ? 0 : .2 }}><Check size={18} /><span>{toast}</span><button onClick={() => setToast('')} aria-label="Dismiss notification"><X size={15} /></button></motion.div>}</AnimatePresence>;

  return <MotionConfig reducedMotion="user"><div className={`app colorway-${current.colorway}`} style={paletteStyles}>
    <a href="#main" className="skip-link" onClick={e => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to invitation</a>
    <header className="site-header">
      <button className="wordmark" aria-label="Amara, back to the beginning" onClick={() => window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' })}>amarā<span className="wordmark-period">.</span></button>
      <nav aria-label="Invitation sections"><button onClick={() => scrollTo('story')}>Our story</button><button onClick={() => scrollTo('celebration')}>The celebration</button><button onClick={() => scrollTo('details')}>The details</button></nav>
      <div className="header-actions"><button className="button outline customize-button" onClick={openEditor}><span>Make it yours</span><Sparkle size={15} /></button><button className="icon-button header-share" onClick={() => setShareOpen(true)} aria-label="Share invitation"><ShareNetwork size={19} /></button></div>
    </header>

    <main id="main" tabIndex={-1}>
      <section className="hero page-width" ref={heroRef} aria-labelledby="couple-names">
        <div className="hero-copy">
          <motion.p className="eyebrow hero-eyebrow" initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, delay: .12 }}>TOGETHER WITH OUR FAMILIES</motion.p>
          <motion.h1 id="couple-names" className="couple-names" initial={reduced ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: .22, ease: [.22, 1, .36, 1] }}><span>{current.firstName || 'Your name'}</span><span className="name-second"><em>&</em>{current.secondName || 'Their name'}</span></motion.h1>
          <motion.div initial={reduced ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .9, delay: .4 }}><p className="hero-tagline">{current.tagline}</p><p className="hero-message">{current.message}</p><button className="button primary hero-cta" onClick={() => scrollTo('celebration')}>Explore the celebration <ArrowRight size={20} weight="light" /></button><p className="hero-date eyebrow">{date.weekday}, {date.full}</p></motion.div>
          <button className="scroll-cue" onClick={() => scrollTo('story')}><ArrowDown size={15} weight="light" /><span>SCROLL TO DISCOVER</span></button>
        </div>
        <motion.div className="hero-visual" initial={reduced ? false : { opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: .1, ease: [.22, 1, .36, 1] }}>
          <div className="hero-photo-frame"><motion.img className="hero-photo" style={reduced ? {} : { y: imageY }} src={assetURL('images/garden-palace.webp')} alt="An ivory-clad couple walking through a sunlit palace garden beside a lake in Udaipur" width="1122" height="1402" fetchPriority="high" /></div>
          <div className="date-keepsake" aria-label={date.full}><span>{date.month}</span><strong>{date.day}</strong><span>{date.year}</span></div>
          <p className="photo-caption eyebrow">A BEAUTIFUL BEGINNING <span>·</span> {current.city}, {current.country}</p>
        </motion.div>
      </section>

      <section id="story" className="story-section section-pad" aria-labelledby="story-title">
        <Reveal className="section-heading"><p className="eyebrow chapter-label">CHAPTER 01 / OUR KIND OF MAGIC</p><h2 id="story-title">Of all the people, <em>you.</em></h2><span className="short-rule" /></Reveal>
        <div className="story-grid content-width">
          <Reveal className="story-image-wrap"><img className="story-image" src={assetURL('images/table-details.webp')} alt="A candlelit wedding table with ivory roses, sage linen, and crystal glasses in a palace garden" width="1100" height="825" loading="lazy" /><span className="image-note">the little things, the big feelings.</span></Reveal>
          <Reveal className="story-copy" delay={.12}><FlowerLotus className="story-flower" size={38} weight="thin" /><p className="eyebrow">TWO SOULS. ONE VERY GOOD STORY.</p><h3>It started with<br />a simple <em>hello.</em></h3><p>{current.story}</p><p className="story-signature">{current.firstName} <em>&</em> {current.secondName}<Heart size={18} weight="thin" /></p></Reveal>
        </div>
        <Reveal><Countdown invitation={{ ...current, date: current.date || defaults.date }} /></Reveal>
      </section>

      <section id="celebration" className="celebration-section section-pad" aria-labelledby="celebration-title">
        <Reveal className="section-heading"><p className="eyebrow chapter-label">CHAPTER 02 / THE GOOD PART</p><h2 id="celebration-title">A weekend to <em>remember.</em></h2><p>Come for the love. Stay for the dancing.</p></Reveal>
        <div className="events-grid content-width">
          <Reveal className="event" delay={0}><div className="event-top"><span className="event-index">01</span><Champagne size={30} weight="thin" /></div><p className="eyebrow event-date">{before.weekday} · {before.day} {before.month}</p><h3>The welcome.</h3><p>Old friends, new stories, and a toast to everything that’s about to begin.</p><div className="event-meta"><span>6:00 PM — LATE</span><span>The garden terrace</span></div><p className="dress-code">A little festive, a little you.</p></Reveal>
          <Reveal className="event" delay={.1}><div className="event-top"><span className="event-index">02</span><FlowerLotus size={31} weight="thin" /></div><p className="eyebrow event-date">{date.weekday} · {date.day} {date.month}</p><h3>The big <em>yes.</em></h3><p>A promise, a few happy tears, and the beginning of our favourite chapter.</p><div className="event-meta"><span>4:00 PM — 7:00 PM</span><span>{current.venue}</span></div><p className="dress-code">Indian elegance in soft hues.</p></Reveal>
          <Reveal className="event" delay={.2}><div className="event-top"><span className="event-index">03</span><MoonStars size={30} weight="thin" /></div><p className="eyebrow event-date">{date.weekday} · {date.day} {date.month}</p><h3>Under the stars.</h3><p>Dinner, your favourite people, and absolutely no reason to leave the dance floor.</p><div className="event-meta"><span>7:30 PM — FOREVER</span><span>The lakeside lawn</span></div><p className="dress-code">Dress up. Let your hair down.</p></Reveal>
        </div>
        <Reveal className="calendar-row"><span>All times in India Standard Time</span><button className="text-button" onClick={() => { downloadCalendar(invitation); notify('A date worth keeping. Calendar event downloaded.'); }}><CalendarBlank size={18} />Save the wedding date<ArrowUpRight size={16} /></button></Reveal>
      </section>

      <section id="details" className="details-section section-pad content-width" aria-labelledby="details-title">
        <Reveal className="venue-copy"><p className="eyebrow chapter-label">CHAPTER 03 / MEET US HERE</p><h2 id="details-title">Somewhere<br /><em>unforgettable.</em></h2><p className="venue-name">{current.venue}</p><p className="venue-location"><MapPin size={16} weight="light" />{current.city}, {current.country}</p><p className="venue-description">Lakeside sunsets, slow mornings, and a little old-world magic. We couldn’t imagine a more beautiful place to begin.</p><a className="button outline" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${current.venue}, ${current.city}, ${current.country}`)}`} target="_blank" rel="noopener noreferrer">Find your way here<ArrowUpRight size={18} /></a></Reveal>
        <Reveal className="venue-image-wrap" delay={.1}><img src={assetURL('images/garden-palace.webp')} alt="An editorial photograph of a romantic lakeside palace in Udaipur" width="1122" height="1402" loading="lazy" /><span className="venue-caption eyebrow">A PLACE TO REMEMBER. A WEEKEND FOR US.</span></Reveal>
      </section>

      <section className="little-details content-width" aria-labelledby="little-details-title"><Reveal className="little-details-heading"><p className="eyebrow">A FEW LITTLE THINGS</p><h2 id="little-details-title">Before you <em>come.</em></h2></Reveal><Reveal className="faq-list">
        <details><summary>What should I wear?<Plus className="faq-plus" aria-hidden="true" size={17} weight="light" /></summary><p>Think soft colours, flowing silhouettes, and something you feel wonderful in. Festive for the welcome, Indian elegance for the ceremony, and your dancing best for the evening.</p></details>
        <details><summary>When should I arrive?<Plus className="faq-plus" aria-hidden="true" size={17} weight="light" /></summary><p>We recommend arriving in {current.city} by the afternoon of {before.full}, so you have time to settle in before our welcome at 6 PM. The wedding ceremony begins at 4 PM the next day.</p></details>
        <details><summary>What’s the best gift?<Plus className="faq-plus" aria-hidden="true" size={17} weight="light" /></summary><p>Your presence is our favourite present. Come with your love, your stories, and your very best dance moves. That’s more than enough.</p></details>
      </Reveal></section>

      <section className="closing-section section-pad"><Reveal><Heart className="closing-heart" size={34} weight="thin" /><p className="eyebrow">THE ONLY THING MISSING IS YOU</p><h2>We saved you<br /><em>a little piece of forever.</em></h2><p>Some days are made more beautiful by the people in them.<br />This is one of those days.</p><button className="button primary" onClick={() => setShareOpen(true)}>Share this invitation<ShareNetwork size={18} /></button><p className="closing-signature">With all our love, {current.firstName} & {current.secondName}</p></Reveal></section>
    </main>

    <footer className="site-footer"><button className="wordmark" aria-label="Amara, back to top" onClick={() => window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' })}>amarā.</button><span>MADE FOR MOMENTS THAT MATTER.</span><button className="text-button" onClick={openEditor}>The Garden Edit <ArrowUpRight size={15} /></button></footer>
    <Dialog open={editorOpen} onClose={() => setEditorOpen(false)} label="Personalize your invitation" drawer><Editor invitation={draft} onChange={setDraft} onSave={save} onClose={() => setEditorOpen(false)} />{editorOpen && notification}</Dialog>
    <Dialog open={shareOpen} onClose={() => setShareOpen(false)} label="Share your invitation"><ShareDialog invitation={invitation} onClose={() => setShareOpen(false)} notify={notify} />{shareOpen && notification}</Dialog>
    {!shareOpen && !editorOpen && notification}
  </div></MotionConfig>;
}

export default App;
