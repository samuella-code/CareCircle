import { useState } from 'react'
import { Activity, Bell, CalendarDays, Check, CheckCircle2, ChevronRight, ClipboardList, HeartPulse, Home, Menu, MessageCircle, Mic, Phone, Pill, Plus, ShieldCheck, Sparkles, UserRound, Users, X } from 'lucide-react'

type Mode = 'senior' | 'caregiver'

const meds = [
  { name: 'Amlodipine', detail: '5 mg · After breakfast', time: '8:00 AM', taken: true },
  { name: 'Vitamin D', detail: '1 tablet · With food', time: '1:00 PM', taken: false },
  { name: 'Metformin', detail: '500 mg · After dinner', time: '7:00 PM', taken: false },
]

const tasks = [
  { title: 'Pick up prescription', owner: 'Amara', due: 'Today, 4 PM', done: false },
  { title: 'Call Mum after lunch', owner: 'David', due: 'Today, 2 PM', done: true },
  { title: 'Arrange clinic transport', owner: 'Amara', due: 'Tomorrow', done: false },
]

function Logo() { return <div className="logo"><span><HeartPulse size={22}/></span><b>CareCircle</b></div> }

function App() {
  const [mode, setMode] = useState<Mode>('senior')
  const [voice, setVoice] = useState(false)
  const [help, setHelp] = useState(false)
  const [checked, setChecked] = useState(false)
  return <div className="app">
    <header><Logo/><nav aria-label="View switcher"><button className={mode==='senior'?'active':''} onClick={()=>setMode('senior')}>Senior view</button><button className={mode==='caregiver'?'active':''} onClick={()=>setMode('caregiver')}>Family view</button></nav><button className="icon-btn" aria-label="Notifications"><Bell size={22}/><i/></button></header>
    {mode === 'senior' ? <Senior onVoice={()=>setVoice(true)} onHelp={()=>setHelp(true)} checked={checked} setChecked={setChecked}/> : <Caregiver/>}
    {voice && <Modal onClose={()=>setVoice(false)}><div className="voice"><div className="voice-ring"><Mic size={38}/></div><small>CareCircle is listening</small><h2>How can I help you, Grace?</h2><p>Try saying “What medicine do I take today?”</p><div className="wave"><i/><i/><i/><i/><i/><i/><i/></div><button className="secondary" onClick={()=>setVoice(false)}>Cancel</button></div></Modal>}
    {help && <Modal onClose={()=>setHelp(false)}><div className="help"><span className="danger-icon"><Phone/></span><small>HELP REQUEST</small><h2>Who should we contact?</h2><p>Choose a trusted contact. We will ask you to confirm before calling.</p><button className="contact"><span>AO</span><div><b>Amara Okafor</b><small>Daughter · Primary caregiver</small></div><ChevronRight/></button><button className="contact"><span>DO</span><div><b>David Okafor</b><small>Son</small></div><ChevronRight/></button><button className="emergency"><Phone size={18}/> Call emergency services</button></div></Modal>}
  </div>
}

function Senior({onVoice,onHelp,checked,setChecked}:{onVoice:()=>void,onHelp:()=>void,checked:boolean,setChecked:(v:boolean)=>void}) {
  return <main className="senior-page">
    <section className="welcome"><div><span className="eyebrow">MONDAY, 21 SEPTEMBER</span><h1>Good morning, Grace.</h1><p>You have a calm day ahead. Your family is connected.</p></div><div className="weather"><Sparkles/><b>26°</b><span>Clear skies</span></div></section>
    <button className="voice-card" onClick={onVoice}><span className="mic"><Mic/></span><span><small>YOUR CARECIRCLE ASSISTANT</small><b>Tap here and ask me anything</b><em>“What do I have planned today?”</em></span><ChevronRight/></button>
    <div className="senior-grid"><section className="card schedule"><div className="section-title"><div><span className="eyebrow">TODAY</span><h2>Your day</h2></div><button>See all <ChevronRight size={16}/></button></div>
      <div className="timeline"><div><time>8:00</time><span className="dot green"><Pill/></span><p><b>Morning medicine</b><small>Amlodipine · Taken</small></p><CheckCircle2 className="success"/></div><div><time>1:00</time><span className="dot coral"><Pill/></span><p><b>Vitamin D</b><small>1 tablet · With lunch</small></p><button className="take">Mark taken</button></div><div><time>3:30</time><span className="dot blue"><CalendarDays/></span><p><b>Physiotherapy</b><small>Dr. Bello · Wellness Centre</small></p><ChevronRight/></div></div>
    </section><aside><section className="checkin"><MessageCircle/><span className="eyebrow">DAILY CHECK-IN</span><h2>{checked?'Thank you, Grace!':'How are you feeling today?'}</h2><p>{checked?'Your family can see that you checked in.':'A quick check-in helps your family know you’re doing well.'}</p><button onClick={()=>setChecked(true)}>{checked?<><Check/> Check-in complete</>:"Start my check-in"}</button></section><button className="help-button" onClick={onHelp}><span><ShieldCheck/></span><span><b>I need help</b><small>Contact family or emergency support</small></span><ChevronRight/></button></aside></div>
    <section className="family"><div><span className="eyebrow">MY CIRCLE</span><h2>Your family is close by</h2></div><div className="people"><div><span className="avatar">AO<i/></span><p><b>Amara</b><small>Daughter</small></p><button aria-label="Call Amara"><Phone/></button></div><div><span className="avatar blue-bg">DO<i/></span><p><b>David</b><small>Son</small></p><button aria-label="Call David"><Phone/></button></div><button className="add"><Plus/> Add person</button></div></section>
  </main>
}

function Caregiver() { const [done,setDone]=useState(tasks.map(t=>t.done)); return <main className="dashboard"><aside className="sidebar"><Logo/><div className="profile"><span>AO</span><div><b>Amara Okafor</b><small>Primary caregiver</small></div></div><nav>{[[Home,'Overview'],[Activity,'Health & activity'],[Pill,'Medications'],[CalendarDays,'Appointments'],[ClipboardList,'Care tasks'],[Users,'Family circle']].map(([Icon,label],i)=>{const I=Icon as typeof Home;return <button className={i===0?'selected':''} key={label as string}><I/>{label as string}</button>})}</nav><div className="privacy"><ShieldCheck/><b>Privacy protected</b><small>Grace controls what her circle can see.</small></div></aside>
    <div className="dash-content"><div className="dash-head"><div><span className="eyebrow">CARE OVERVIEW</span><h1>Good morning, Amara.</h1><p>Here’s how Grace is doing today.</p></div><button className="outline"><Plus/> Add care task</button><button className="mobile-menu"><Menu/></button></div>
    <div className="status-banner"><span className="large-avatar">GO<i/></span><div><b>Grace is doing well</b><p>Last active 12 minutes ago · At home</p></div><span className="status"><CheckCircle2/> All okay</span></div>
    <div className="stats"><div><span className="green-box"><CheckCircle2/></span><p><b>Checked in</b><small>Today at 8:14 AM</small></p></div><div><span className="coral-box"><Pill/></span><p><b>1 of 3 taken</b><small>Next at 1:00 PM</small></p></div><div><span className="blue-box"><CalendarDays/></span><p><b>1 appointment</b><small>Today at 3:30 PM</small></p></div></div>
    <div className="dash-grid"><section className="panel"><div className="section-title"><div><span className="eyebrow">MEDICATIONS</span><h2>Today’s schedule</h2></div><button>Manage <ChevronRight/></button></div>{meds.map((m,i)=><div className="med-row" key={m.name}><span className={m.taken?'med-icon taken':'med-icon'}>{m.taken?<Check/>:<Pill/>}</span><div><b>{m.name}</b><small>{m.detail}</small></div><time>{m.time}</time><span className={m.taken?'pill-tag done':'pill-tag'}>{m.taken?'Taken':'Upcoming'}</span></div>)}</section>
    <section className="panel"><div className="section-title"><div><span className="eyebrow">CARE TASKS</span><h2>Family to-do</h2></div><button>View all <ChevronRight/></button></div>{tasks.map((t,i)=><div className="task-row" key={t.title}><button onClick={()=>setDone(d=>d.map((x,j)=>j===i?!x:x))} className={done[i]?'checkbox checked':'checkbox'}>{done[i]&&<Check/>}</button><div><b className={done[i]?'strike':''}>{t.title}</b><small>{t.owner} · {t.due}</small></div></div>)}</section></div>
    <section className="panel activity-panel"><div className="section-title"><div><span className="eyebrow">RECENT ACTIVITY</span><h2>Care updates</h2></div><button>View history <ChevronRight/></button></div><div className="updates"><div><span className="green-box"><CheckCircle2/></span><p><b>Morning medication taken</b><small>Grace confirmed · 8:12 AM</small></p></div><div><span className="blue-box"><MessageCircle/></span><p><b>Daily check-in completed</b><small>Feeling good · 8:14 AM</small></p></div><div><span className="neutral-box"><UserRound/></span><p><b>David accepted a care task</b><small>Call Mum after lunch · Yesterday</small></p></div></div></section>
    </div></main> }

function Modal({children,onClose}:{children:React.ReactNode,onClose:()=>void}) { return <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="modal"><button className="close" onClick={onClose} aria-label="Close"><X/></button>{children}</div></div> }

export default App
