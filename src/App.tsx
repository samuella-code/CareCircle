import { useEffect, useState } from 'react'
import { Activity, AlertTriangle, Bell, CalendarDays, Check, CheckCircle2, ChevronRight, ClipboardList, HeartPulse, Home, Menu, MessageCircle, Mic, Phone, Pill, Plus, ShieldCheck, Sparkles, UserRound, Users, X } from 'lucide-react'

type Mode = 'senior' | 'caregiver'

const initialMeds = [
  { id: 1, name: 'Amlodipine', detail: '5 mg · After breakfast', time: '8:00 AM', taken: true },
  { id: 2, name: 'Vitamin D', detail: '1 tablet · With food', time: '1:00 PM', taken: false },
  { id: 3, name: 'Metformin', detail: '500 mg · After dinner', time: '7:00 PM', taken: false },
]

const initialTasks = [
  { id: 1, title: 'Pick up prescription', owner: 'Amara', due: 'Today, 4 PM', done: false },
  { id: 2, title: 'Call Mum after lunch', owner: 'David', due: 'Today, 2 PM', done: true },
  { id: 3, title: 'Arrange clinic transport', owner: 'Amara', due: 'Tomorrow', done: false },
]

type Medicine = typeof initialMeds[number]
type CareTask = typeof initialTasks[number]
type Alert = { id: number; contact: string; time: string; resolved: boolean }

function useSavedState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) as T : initial }
    catch { return initial }
  })
  useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value])
  return [value, setValue] as const
}

const appointments = [
  { title: 'Physiotherapy', clinician: 'Dr. Bello', place: 'Wellness Centre', time: '3:30 PM' },
]

/* Legacy demo arrays are intentionally replaced by persistent state below. */
const medsExample = [
  { name: 'Amlodipine', detail: '5 mg · After breakfast', time: '8:00 AM', taken: true },
  { name: 'Vitamin D', detail: '1 tablet · With food', time: '1:00 PM', taken: false },
  { name: 'Metformin', detail: '500 mg · After dinner', time: '7:00 PM', taken: false },
]

const tasksExample = [
  { title: 'Pick up prescription', owner: 'Amara', due: 'Today, 4 PM', done: false },
  { title: 'Call Mum after lunch', owner: 'David', due: 'Today, 2 PM', done: true },
  { title: 'Arrange clinic transport', owner: 'Amara', due: 'Tomorrow', done: false },
]

function Logo() { return <div className="logo"><span><HeartPulse size={22}/></span><b>CareCircle</b></div> }

function App() {
  const [mode, setMode] = useState<Mode>('senior')
  const [voice, setVoice] = useState(false)
  const [help, setHelp] = useState(false)
  const [checkin, setCheckin] = useState(false)
  const [meds, setMeds] = useSavedState<Medicine[]>('carecircle-medicines', initialMeds)
  const [tasks, setTasks] = useSavedState<CareTask[]>('carecircle-tasks', initialTasks)
  const [checked, setChecked] = useSavedState('carecircle-checked-in', false)
  const [mood, setMood] = useSavedState('carecircle-mood', '')
  const [alerts, setAlerts] = useSavedState<Alert[]>('carecircle-alerts', [])
  const [toast, setToast] = useState('')
  const notify = (message:string) => { setToast(message); window.setTimeout(()=>setToast(''), 2600) }
  const markTaken = (id:number) => { setMeds(list=>list.map(m=>m.id===id?{...m,taken:true}:m)); notify('Medication marked as taken') }
  const sendHelp = (contact:string) => { setAlerts(list=>[{id:Date.now(),contact,time:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),resolved:false},...list]); setHelp(false); notify(`${contact} has been alerted`) }
  return <div className="app">
    <header><Logo/><nav aria-label="View switcher"><button className={mode==='senior'?'active':''} onClick={()=>setMode('senior')}>Senior view</button><button className={mode==='caregiver'?'active':''} onClick={()=>setMode('caregiver')}>Family view</button></nav><button className="icon-btn" aria-label="Notifications"><Bell size={22}/><i/></button></header>
    {mode === 'senior' ? <Senior onVoice={()=>setVoice(true)} onHelp={()=>setHelp(true)} onCheckin={()=>setCheckin(true)} checked={checked} meds={meds} markTaken={markTaken}/> : <Caregiver meds={meds} tasks={tasks} setTasks={setTasks} checked={checked} mood={mood} alerts={alerts} setAlerts={setAlerts} notify={notify}/>} 
    {voice && <VoiceAssistant meds={meds} onClose={()=>setVoice(false)}/>} 
    {checkin && <Checkin onClose={()=>setCheckin(false)} onComplete={(feeling)=>{setMood(feeling);setChecked(true);setCheckin(false);notify('Daily check-in shared with your family')}}/>}
    {help && <Modal onClose={()=>setHelp(false)}><div className="help"><span className="danger-icon"><Phone/></span><small>HELP REQUEST</small><h2>Who should we contact?</h2><p>Choose a trusted contact. CareCircle will create an urgent family alert.</p><button className="contact" onClick={()=>sendHelp('Amara')}><span>AO</span><div><b>Amara Okafor</b><small>Daughter · Primary caregiver</small></div><ChevronRight/></button><button className="contact" onClick={()=>sendHelp('David')}><span>DO</span><div><b>David Okafor</b><small>Son</small></div><ChevronRight/></button><a className="emergency" href="tel:112"><Phone size={18}/> Call emergency services (112)</a><small className="safety-copy">Calls use your phone service. CareCircle cannot guarantee emergency response.</small></div></Modal>}
    {toast && <div className="toast" role="status"><CheckCircle2/>{toast}</div>}
  </div>
}

function Senior({onVoice,onHelp,onCheckin,checked,meds,markTaken}:{onVoice:()=>void,onHelp:()=>void,onCheckin:()=>void,checked:boolean,meds:Medicine[],markTaken:(id:number)=>void}) {
  const today = new Intl.DateTimeFormat('en-NG',{weekday:'long',day:'numeric',month:'long'}).format(new Date()).toUpperCase()
  const vitamin = meds.find(m=>m.id===2)!
  return <main className="senior-page">
    <section className="welcome"><div><span className="eyebrow">{today}</span><h1>Good morning, Grace.</h1><p>You have a calm day ahead. Your family is connected.</p></div><div className="weather"><Sparkles/><b>26°</b><span>Demo weather</span></div></section>
    <button className="voice-card" onClick={onVoice}><span className="mic"><Mic/></span><span><small>YOUR CARECIRCLE ASSISTANT</small><b>Tap here and ask me anything</b><em>“What do I have planned today?”</em></span><ChevronRight/></button>
    <div className="senior-grid"><section className="card schedule"><div className="section-title"><div><span className="eyebrow">TODAY</span><h2>Your day</h2></div><button>See all <ChevronRight size={16}/></button></div>
      <div className="timeline"><div><time>8:00</time><span className="dot green"><Pill/></span><p><b>Morning medicine</b><small>Amlodipine · {meds[0].taken?'Taken':'Upcoming'}</small></p>{meds[0].taken?<CheckCircle2 className="success"/>:<button className="take" onClick={()=>markTaken(1)}>Mark taken</button>}</div><div><time>1:00</time><span className="dot coral"><Pill/></span><p><b>Vitamin D</b><small>1 tablet · With lunch</small></p>{vitamin.taken?<CheckCircle2 className="success"/>:<button className="take" onClick={()=>markTaken(2)}>Mark taken</button>}</div><div><time>3:30</time><span className="dot blue"><CalendarDays/></span><p><b>Physiotherapy</b><small>Dr. Bello · Wellness Centre</small></p><ChevronRight/></div></div>
    </section><aside><section className="checkin"><MessageCircle/><span className="eyebrow">DAILY CHECK-IN</span><h2>{checked?'Thank you, Grace!':'How are you feeling today?'}</h2><p>{checked?'Your family can see that you checked in.':'A quick check-in helps your family know you’re doing well.'}</p><button onClick={onCheckin}>{checked?<><Check/> Update my check-in</>:"Start my check-in"}</button></section><button className="help-button" onClick={onHelp}><span><ShieldCheck/></span><span><b>I need help</b><small>Contact family or emergency support</small></span><ChevronRight/></button></aside></div>
    <section className="family"><div><span className="eyebrow">MY CIRCLE</span><h2>Your family is close by</h2></div><div className="people"><div><span className="avatar">AO<i/></span><p><b>Amara</b><small>Daughter</small></p><a href="tel:+2348000000001" aria-label="Call Amara"><Phone/></a></div><div><span className="avatar blue-bg">DO<i/></span><p><b>David</b><small>Son</small></p><a href="tel:+2348000000002" aria-label="Call David"><Phone/></a></div></div></section>
  </main>
}

function Caregiver({meds,tasks,setTasks,checked,mood,alerts,setAlerts,notify}:{meds:Medicine[],tasks:CareTask[],setTasks:React.Dispatch<React.SetStateAction<CareTask[]>>,checked:boolean,mood:string,alerts:Alert[],setAlerts:React.Dispatch<React.SetStateAction<Alert[]>>,notify:(m:string)=>void}) { const [taskModal,setTaskModal]=useState(false); const toggleTask=(id:number)=>setTasks(list=>list.map(t=>t.id===id?{...t,done:!t.done}:t)); return <main className="dashboard"><aside className="sidebar"><Logo/><div className="profile"><span>AO</span><div><b>Amara Okafor</b><small>Primary caregiver</small></div></div><nav>{[[Home,'Overview'],[Activity,'Health & activity'],[Pill,'Medications'],[CalendarDays,'Appointments'],[ClipboardList,'Care tasks'],[Users,'Family circle']].map(([Icon,label],i)=>{const I=Icon as typeof Home;return <button className={i===0?'selected':''} key={label as string}><I/>{label as string}</button>})}</nav><div className="privacy"><ShieldCheck/><b>Privacy protected</b><small>Grace controls what her circle can see.</small></div></aside>
    <div className="dash-content"><div className="dash-head"><div><span className="eyebrow">CARE OVERVIEW</span><h1>Good morning, Amara.</h1><p>Here’s how Grace is doing today.</p></div><button className="outline" onClick={()=>setTaskModal(true)}><Plus/> Add care task</button><button className="mobile-menu"><Menu/></button></div>
    {alerts.filter(a=>!a.resolved).map(a=><div className="urgent-alert" key={a.id}><AlertTriangle/><div><b>Grace requested help</b><p>{a.contact} was alerted at {a.time}. Please contact Grace now.</p></div><button onClick={()=>{setAlerts(list=>list.map(x=>x.id===a.id?{...x,resolved:true}:x));notify('Alert marked as resolved')}}>Resolve</button></div>)}
    <div className="status-banner"><span className="large-avatar">GO<i/></span><div><b>Grace is doing well</b><p>Last active 12 minutes ago · At home</p></div><span className="status"><CheckCircle2/> All okay</span></div>
    <div className="stats"><div><span className="green-box"><CheckCircle2/></span><p><b>{checked?'Checked in':'Awaiting check-in'}</b><small>{checked?(mood?`Feeling ${mood.toLowerCase()}`:'Completed today'):'No response yet today'}</small></p></div><div><span className="coral-box"><Pill/></span><p><b>{meds.filter(m=>m.taken).length} of {meds.length} taken</b><small>{meds.find(m=>!m.taken)?`Next at ${meds.find(m=>!m.taken)?.time}`:'All complete today'}</small></p></div><div><span className="blue-box"><CalendarDays/></span><p><b>{appointments.length} appointment</b><small>Today at {appointments[0].time}</small></p></div></div>
    <div className="dash-grid"><section className="panel"><div className="section-title"><div><span className="eyebrow">MEDICATIONS</span><h2>Today’s schedule</h2></div><button>Manage <ChevronRight/></button></div>{meds.map((m,i)=><div className="med-row" key={m.name}><span className={m.taken?'med-icon taken':'med-icon'}>{m.taken?<Check/>:<Pill/>}</span><div><b>{m.name}</b><small>{m.detail}</small></div><time>{m.time}</time><span className={m.taken?'pill-tag done':'pill-tag'}>{m.taken?'Taken':'Upcoming'}</span></div>)}</section>
    <section className="panel"><div className="section-title"><div><span className="eyebrow">CARE TASKS</span><h2>Family to-do</h2></div><button onClick={()=>setTaskModal(true)}>Add <Plus/></button></div>{tasks.map(t=><div className="task-row" key={t.id}><button onClick={()=>toggleTask(t.id)} className={t.done?'checkbox checked':'checkbox'}>{t.done&&<Check/>}</button><div><b className={t.done?'strike':''}>{t.title}</b><small>{t.owner} · {t.due}</small></div></div>)}</section></div>
    <section className="panel activity-panel"><div className="section-title"><div><span className="eyebrow">RECENT ACTIVITY</span><h2>Care updates</h2></div><button>View history <ChevronRight/></button></div><div className="updates"><div><span className="green-box"><CheckCircle2/></span><p><b>Morning medication taken</b><small>Grace confirmed · 8:12 AM</small></p></div><div><span className="blue-box"><MessageCircle/></span><p><b>Daily check-in completed</b><small>Feeling good · 8:14 AM</small></p></div><div><span className="neutral-box"><UserRound/></span><p><b>David accepted a care task</b><small>Call Mum after lunch · Yesterday</small></p></div></div></section>
    </div>{taskModal&&<TaskForm onClose={()=>setTaskModal(false)} onAdd={(task)=>{setTasks(list=>[...list,{...task,id:Date.now(),done:false}]);setTaskModal(false);notify('Care task added')}}/>}</main> }

function VoiceAssistant({meds,onClose}:{meds:Medicine[],onClose:()=>void}) {
  const [answer,setAnswer]=useState('Tap a question below or speak it aloud.')
  const respond=(question:string)=>{let response='I can help with medicines, appointments, family calls, and daily check-ins.'; if(question.includes('medicine')) response=`You have ${meds.filter(m=>!m.taken).length} medicines remaining today. ${meds.find(m=>!m.taken)?.name??'All medicines are complete'}.`; if(question.includes('plan')||question.includes('appointment')) response='You have physiotherapy with Dr. Bello at 3:30 PM.'; setAnswer(response); if('speechSynthesis' in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(response))}
  return <Modal onClose={onClose}><div className="voice"><div className="voice-ring"><Mic size={38}/></div><small>CARECIRCLE ASSISTANT</small><h2>How can I help you, Grace?</h2><p className="assistant-answer" aria-live="polite">{answer}</p><div className="quick-questions"><button onClick={()=>respond('medicine')}>What medicine is next?</button><button onClick={()=>respond('appointment')}>What is planned today?</button></div><button className="secondary" onClick={onClose}>Close assistant</button></div></Modal>
}

function Checkin({onClose,onComplete}:{onClose:()=>void,onComplete:(mood:string)=>void}) { return <Modal onClose={onClose}><div className="form-modal"><span className="eyebrow">DAILY CHECK-IN</span><h2>How are you feeling?</h2><p>Choose the answer that feels closest right now.</p><div className="moods">{['Great','Good','Not well'].map(m=><button key={m} onClick={()=>onComplete(m)}>{m==='Great'?'😊':m==='Good'?'🙂':'😟'}<b>{m}</b></button>)}</div></div></Modal> }

function TaskForm({onClose,onAdd}:{onClose:()=>void,onAdd:(t:Omit<CareTask,'id'|'done'>)=>void}) { const [title,setTitle]=useState(''); const [owner,setOwner]=useState('Amara'); const [due,setDue]=useState('Today'); return <Modal onClose={onClose}><form className="form-modal" onSubmit={e=>{e.preventDefault();if(title.trim())onAdd({title:title.trim(),owner,due})}}><span className="eyebrow">NEW CARE TASK</span><h2>Add something to the family to-do</h2><label>Task<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Pick up groceries" required autoFocus/></label><label>Assign to<select value={owner} onChange={e=>setOwner(e.target.value)}><option>Amara</option><option>David</option></select></label><label>Due<input value={due} onChange={e=>setDue(e.target.value)}/></label><button className="primary" type="submit">Add care task</button></form></Modal> }

function Modal({children,onClose}:{children:React.ReactNode,onClose:()=>void}) { return <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="modal"><button className="close" onClick={onClose} aria-label="Close"><X/></button>{children}</div></div> }

export default App
