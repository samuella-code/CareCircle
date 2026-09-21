import { useEffect, useState } from 'react'
import { Activity, AlertTriangle, Bell, CalendarDays, Check, CheckCircle2, ChevronRight, ClipboardList, HeartPulse, Home, LogOut, Menu, MessageCircle, Mic, Phone, Pill, Plus, Send, ShieldCheck, Sparkles, UserRound, Users, X } from 'lucide-react'
import { api } from './api'

type Mode = 'senior' | 'caregiver'
type Session = { token: string; user: { id:number; role: Mode; name: string; email:string; invite_code?:string|null; linked_senior_id?:number|null } }

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
  const [session, setSession] = useSavedState<Session|null>('carecircle-session', null)
  const mode = session?.user?.role ?? 'senior'
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
  const refresh = async()=>{if(!session)return;try{const data=await api<{medicines:Medicine[];tasks:CareTask[];checkin:{mood:string}|null;alerts:Array<{id:number;contact:string;resolved:boolean;created_at:number}>}>('/care-data',{},session.token);setMeds(data.medicines);setTasks(data.tasks);setChecked(Boolean(data.checkin));setMood(data.checkin?.mood||'');setAlerts(data.alerts.map(a=>({...a,time:new Date(a.created_at*1000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})})))}catch(error){notify(error instanceof Error?error.message:'Backend unavailable')}}
  useEffect(()=>{void refresh()},[session?.token])
  const markTaken = async(id:number) => { if(!session)return;try{await api(`/medicines/${id}/taken`,{method:'PATCH'},session.token);await refresh();notify('Medication marked as taken')}catch(e){notify(e instanceof Error?e.message:'Could not update medicine')} }
  const sendHelp = async(contact:string) => { if(!session)return;try{await api('/alerts',{method:'POST',body:JSON.stringify({contact})},session.token);await refresh();setHelp(false);notify(`${contact} has been alerted`)}catch(e){notify(e instanceof Error?e.message:'Could not create alert')} }
  if (!session?.user || !session.token) return <AuthScreen onSignIn={setSession}/>
  return <div className="app">
    <header><Logo/><div className="signed-in"><span><small>Signed in as</small><b>{session.user.name} · {mode==='senior'?'Senior':'Family caregiver'}</b></span><button className="signout" onClick={()=>setSession(null)}><LogOut/> Sign out</button></div><button className="icon-btn" aria-label="Notifications" onClick={()=>mode==='caregiver'&&alerts.some(a=>!a.resolved)&&notify(`${alerts.filter(a=>!a.resolved).length} urgent alert waiting`)}><Bell size={22}/>{alerts.some(a=>!a.resolved)&&<i/>}</button></header>
    {mode === 'senior' ? <Senior inviteCode={session.user.invite_code||''} onVoice={()=>setVoice(true)} onHelp={()=>setHelp(true)} onCheckin={()=>setCheckin(true)} checked={checked} meds={meds} markTaken={markTaken} notify={notify}/> : <Caregiver token={session.token} linked={Boolean(session.user.linked_senior_id)} meds={meds} tasks={tasks} setTasks={setTasks} checked={checked} mood={mood} alerts={alerts} setAlerts={setAlerts} notify={notify} refresh={refresh}/>} 
    {voice && <VoiceAssistant token={session.token} meds={meds} onClose={()=>setVoice(false)}/>} 
    {checkin && <Checkin onClose={()=>setCheckin(false)} onComplete={async(feeling)=>{try{await api('/checkins',{method:'POST',body:JSON.stringify({mood:feeling})},session.token);await refresh();setCheckin(false);notify('Daily check-in shared with your family')}catch(e){notify(e instanceof Error?e.message:'Could not save check-in')}}}/>} 
    {help && <Modal onClose={()=>setHelp(false)}><div className="help"><span className="danger-icon"><Phone/></span><small>HELP REQUEST</small><h2>Who should we contact?</h2><p>Choose a trusted contact. CareCircle will create an urgent family alert.</p><button className="contact" onClick={()=>sendHelp('Amara')}><span>AO</span><div><b>Amara Okafor</b><small>Daughter · Primary caregiver</small></div><ChevronRight/></button><button className="contact" onClick={()=>sendHelp('David')}><span>DO</span><div><b>David Okafor</b><small>Son</small></div><ChevronRight/></button><a className="emergency" href="tel:112"><Phone size={18}/> Call emergency services (112)</a><small className="safety-copy">Calls use your phone service. CareCircle cannot guarantee emergency response.</small></div></Modal>}
    {toast && <div className="toast" role="status"><CheckCircle2/>{toast}</div>}
  </div>
}

function AuthScreen({onSignIn}:{onSignIn:(s:Session)=>void}) {
  const [role,setRole]=useState<Mode>('senior'); const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [error,setError]=useState(''); const [register,setRegister]=useState(false); const [busy,setBusy]=useState(false)
  const submit=async(e:React.FormEvent)=>{e.preventDefault();if(!email||!password||(register&&!name)){setError('Please complete all fields.');return}setBusy(true);setError('');try{const session=await api<Session>(register?'/auth/register':'/auth/login',{method:'POST',body:JSON.stringify(register?{name,email,password,role}:{email,password})});onSignIn(session)}catch(err){setError(err instanceof Error?err.message:'Could not connect to CareCircle')}finally{setBusy(false)}}
  return <main className="auth-page"><section className="auth-intro"><Logo/><div><span className="eyebrow light">INDEPENDENT LIVING, CONNECTED CARE</span><h1>Care that keeps everyone close.</h1><p>Simple daily support for older adults. Peace of mind and clear coordination for the people who care for them.</p></div><div className="trust-row"><ShieldCheck/><span><b>Private by design</b><small>You control who sees your care information.</small></span></div></section><section className="auth-panel"><form onSubmit={submit}><span className="eyebrow">WELCOME TO CARECIRCLE</span><h2>{register?'Create your account':'Sign in to your circle'}</h2><p>{register?'Choose your role and create secure login details.':'Enter the email and password you registered with.'}</p>{register&&<><div className="role-picker"><button type="button" className={role==='senior'?'selected':''} onClick={()=>setRole('senior')}><UserRound/><b>I am a senior</b><small>My care and daily support</small></button><button type="button" className={role==='caregiver'?'selected':''} onClick={()=>setRole('caregiver')}><Users/><b>I am family</b><small>Coordinate someone’s care</small></button></div><label>Full name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name"/></label></>}<label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></label>{error&&<p className="form-error">{error}</p>}<button className="login-button" disabled={busy}>{busy?'Please wait…':register?'Create account':'Sign in securely'} <ChevronRight/></button><div className="demo-login"><span>{register?'ALREADY HAVE AN ACCOUNT?':'NEW TO CARECIRCLE?'}</span><button type="button" onClick={()=>{setRegister(!register);setError('')}}>{register?'Sign in instead':'Create a real account'}</button></div><p className="demo-note">Accounts are stored by the CareCircle backend. Caregivers link to a senior using the senior’s private invitation code.</p></form></section></main>
}

function Senior({inviteCode,onVoice,onHelp,onCheckin,checked,meds,markTaken,notify}:{inviteCode:string,onVoice:()=>void,onHelp:()=>void,onCheckin:()=>void,checked:boolean,meds:Medicine[],markTaken:(id:number)=>void,notify:(m:string)=>void}) {
  const today = new Intl.DateTimeFormat('en-NG',{weekday:'long',day:'numeric',month:'long'}).format(new Date()).toUpperCase()
  const vitamin = meds.find(m=>m.id===2)!
  return <main className="senior-page">
    <section className="welcome"><div><span className="eyebrow">{today}</span><h1>Good morning, Grace.</h1><p>You have a calm day ahead. Your family is connected.</p></div><div className="weather"><Sparkles/><b>26°</b><span>Demo weather</span></div></section>
    <button className="voice-card" onClick={onVoice}><span className="mic"><Mic/></span><span><small>YOUR CARECIRCLE ASSISTANT</small><b>Tap here and ask me anything</b><em>“What do I have planned today?”</em></span><ChevronRight/></button>
    <div className="senior-grid"><section className="card schedule"><div className="section-title"><div><span className="eyebrow">TODAY</span><h2>Your day</h2></div><button onClick={()=>notify('All of today’s items are already shown below')}>See all <ChevronRight size={16}/></button></div>
      <div className="timeline"><div><time>8:00</time><span className="dot green"><Pill/></span><p><b>Morning medicine</b><small>Amlodipine · {meds[0].taken?'Taken':'Upcoming'}</small></p>{meds[0].taken?<CheckCircle2 className="success"/>:<button className="take" onClick={()=>markTaken(1)}>Mark taken</button>}</div><div><time>1:00</time><span className="dot coral"><Pill/></span><p><b>Vitamin D</b><small>1 tablet · With lunch</small></p>{vitamin.taken?<CheckCircle2 className="success"/>:<button className="take" onClick={()=>markTaken(2)}>Mark taken</button>}</div><div><time>3:30</time><span className="dot blue"><CalendarDays/></span><p><b>Physiotherapy</b><small>Dr. Bello · Wellness Centre</small></p><ChevronRight/></div></div>
    </section><aside><section className="checkin"><MessageCircle/><span className="eyebrow">DAILY CHECK-IN</span><h2>{checked?'Thank you, Grace!':'How are you feeling today?'}</h2><p>{checked?'Your family can see that you checked in.':'A quick check-in helps your family know you’re doing well.'}</p><button onClick={onCheckin}>{checked?<><Check/> Update my check-in</>:"Start my check-in"}</button></section><button className="help-button" onClick={onHelp}><span><ShieldCheck/></span><span><b>I need help</b><small>Contact family or emergency support</small></span><ChevronRight/></button></aside></div>
    <section className="family"><div><span className="eyebrow">MY CIRCLE</span><h2>Your private family code: <strong className="invite-code">{inviteCode||'Loading…'}</strong></h2><small>Give this code only to a trusted caregiver so they can join your circle.</small></div><div className="people"><div><span className="avatar">AO<i/></span><p><b>Amara</b><small>Daughter</small></p><a href="tel:+2348000000001" aria-label="Call Amara"><Phone/></a></div><div><span className="avatar blue-bg">DO<i/></span><p><b>David</b><small>Son</small></p><a href="tel:+2348000000002" aria-label="Call David"><Phone/></a></div></div></section>
  </main>
}

function Caregiver({token,linked,meds,tasks,setTasks,checked,mood,alerts,setAlerts,notify,refresh}:{token:string,linked:boolean,meds:Medicine[],tasks:CareTask[],setTasks:React.Dispatch<React.SetStateAction<CareTask[]>>,checked:boolean,mood:string,alerts:Alert[],setAlerts:React.Dispatch<React.SetStateAction<Alert[]>>,notify:(m:string)=>void,refresh:()=>Promise<void>}) { const [taskModal,setTaskModal]=useState(false); const [linkModal,setLinkModal]=useState(!linked); const [activeNav,setActiveNav]=useState('overview'); const toggleTask=async(id:number)=>{try{await api(`/tasks/${id}/toggle`,{method:'PATCH'},token);await refresh()}catch(e){notify(e instanceof Error?e.message:'Could not update task')}}; const go=(id:string)=>{setActiveNav(id);document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'center'})}; const navItems=[[Home,'Overview','overview'],[Activity,'Health & activity','activity'],[Pill,'Medications','medications'],[CalendarDays,'Appointments','appointments'],[ClipboardList,'Care tasks','tasks'],[Users,'Family circle','family']] as const; return <main className="dashboard"><aside className="sidebar"><Logo/><div className="profile"><span>AO</span><div><b>Family caregiver</b><small>{linked?'Connected to senior':'Not linked yet'}</small></div></div><nav>{navItems.map(([Icon,label,id])=><button onClick={()=>go(id)} className={activeNav===id?'selected':''} key={id}><Icon/>{label}</button>)}</nav><div className="privacy"><ShieldCheck/><b>Privacy protected</b><small>The senior controls who joins their circle.</small></div></aside>
    <div className="dash-content" id="overview"><div className="dash-head"><div><span className="eyebrow">CARE OVERVIEW</span><h1>Good morning, Amara.</h1><p>Here’s how Grace is doing today.</p></div><button className="outline" onClick={()=>setTaskModal(true)}><Plus/> Add care task</button><button className="mobile-menu" onClick={()=>notify('Use the page sections below on mobile')}><Menu/></button></div>
    {!linked&&<div className="urgent-alert"><Users/><div><b>Connect to a senior</b><p>Enter the invitation code shown in the senior’s account.</p></div><button onClick={()=>setLinkModal(true)}>Enter code</button></div>}
    {alerts.filter(a=>!a.resolved).map(a=><div className="urgent-alert" key={a.id}><AlertTriangle/><div><b>Senior requested help</b><p>{a.contact} was alerted at {a.time}. Please contact them now.</p></div><button onClick={async()=>{try{await api(`/alerts/${a.id}/resolve`,{method:'PATCH'},token);await refresh();notify('Alert marked as resolved')}catch(e){notify(e instanceof Error?e.message:'Could not resolve alert')}}}>Resolve</button></div>)}
    <div className="status-banner" id="family"><span className="large-avatar">GO<i/></span><div><b>Grace is doing well</b><p>Last active 12 minutes ago · At home · Family circle: Amara and David</p></div><span className="status"><CheckCircle2/> All okay</span></div>
    <div className="stats" id="appointments"><div><span className="green-box"><CheckCircle2/></span><p><b>{checked?'Checked in':'Awaiting check-in'}</b><small>{checked?(mood?`Feeling ${mood.toLowerCase()}`:'Completed today'):'No response yet today'}</small></p></div><div><span className="coral-box"><Pill/></span><p><b>{meds.filter(m=>m.taken).length} of {meds.length} taken</b><small>{meds.find(m=>!m.taken)?`Next at ${meds.find(m=>!m.taken)?.time}`:'All complete today'}</small></p></div><div><span className="blue-box"><CalendarDays/></span><p><b>{appointments.length} appointment</b><small>Physiotherapy · {appointments[0].time}</small></p></div></div>
    <div className="dash-grid"><section className="panel" id="medications"><div className="section-title"><div><span className="eyebrow">MEDICATIONS</span><h2>Today’s schedule</h2></div><button onClick={()=>notify('Medication management is shown here')}>Manage <ChevronRight/></button></div>{meds.map(m=><div className="med-row" key={m.name}><span className={m.taken?'med-icon taken':'med-icon'}>{m.taken?<Check/>:<Pill/>}</span><div><b>{m.name}</b><small>{m.detail}</small></div><time>{m.time}</time><span className={m.taken?'pill-tag done':'pill-tag'}>{m.taken?'Taken':'Upcoming'}</span></div>)}</section>
    <section className="panel" id="tasks"><div className="section-title"><div><span className="eyebrow">CARE TASKS</span><h2>Family to-do</h2></div><button onClick={()=>setTaskModal(true)}>Add <Plus/></button></div>{tasks.map(t=><div className="task-row" key={t.id}><button onClick={()=>toggleTask(t.id)} className={t.done?'checkbox checked':'checkbox'}>{t.done&&<Check/>}</button><div><b className={t.done?'strike':''}>{t.title}</b><small>{t.owner} · {t.due}</small></div></div>)}</section></div>
    <section className="panel activity-panel" id="activity"><div className="section-title"><div><span className="eyebrow">RECENT ACTIVITY</span><h2>Care updates</h2></div><button onClick={()=>notify('You are viewing the complete demo history')}>View history <ChevronRight/></button></div><div className="updates"><div><span className="green-box"><CheckCircle2/></span><p><b>Morning medication taken</b><small>Grace confirmed · 8:12 AM</small></p></div><div><span className="blue-box"><MessageCircle/></span><p><b>Daily check-in {checked?'completed':'waiting'}</b><small>{mood||'No answer yet'} · Today</small></p></div><div><span className="neutral-box"><UserRound/></span><p><b>David accepted a care task</b><small>Call Mum after lunch · Yesterday</small></p></div></div></section>
    </div>{taskModal&&<TaskForm onClose={()=>setTaskModal(false)} onAdd={async(task)=>{try{await api('/tasks',{method:'POST',body:JSON.stringify(task)},token);await refresh();setTaskModal(false);notify('Care task added')}catch(e){notify(e instanceof Error?e.message:'Could not add task')}}}/>} {linkModal&&<LinkSenior token={token} onClose={()=>setLinkModal(false)} onLinked={async()=>{await refresh();setLinkModal(false);notify('Care circle connected. Sign in again to refresh your account link.')}}/>}</main> }

function VoiceAssistant({token,meds,onClose}:{token:string,meds:Medicine[],onClose:()=>void}) {
  const [answer,setAnswer]=useState('Tap a question below or type your own question.')
  const [question,setQuestion]=useState('')
  const respond=async(raw:string)=>{try{const data=await api<{answer:string}>('/assistant',{method:'POST',body:JSON.stringify({question:raw})},token);setAnswer(data.answer);if('speechSynthesis' in window){window.speechSynthesis.cancel();window.speechSynthesis.speak(new SpeechSynthesisUtterance(data.answer))}}catch(e){setAnswer(e instanceof Error?e.message:'The assistant is unavailable')}}
  return <Modal onClose={onClose}><div className="voice"><div className="voice-ring"><Mic size={38}/></div><small>CARECIRCLE ASSISTANT · DEMO AI</small><h2>How can I help you, Grace?</h2><p className="assistant-answer" aria-live="polite">{answer}</p><form className="assistant-form" onSubmit={e=>{e.preventDefault();if(question.trim()){respond(question);setQuestion('')}}}><input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask about medicine or appointments" aria-label="Ask CareCircle"/><button aria-label="Send question"><Send/></button></form><div className="quick-questions"><button onClick={()=>respond('medicine')}>What medicine is next?</button><button onClick={()=>respond('appointment')}>What is planned today?</button></div><small className="ai-note">This offline demo uses safe, pre-programmed care answers. Connect an approved AI service and secure backend for open-ended conversations.</small><button className="secondary" onClick={onClose}>Close assistant</button></div></Modal>
}

function Checkin({onClose,onComplete}:{onClose:()=>void,onComplete:(mood:string)=>void}) { return <Modal onClose={onClose}><div className="form-modal"><span className="eyebrow">DAILY CHECK-IN</span><h2>How are you feeling?</h2><p>Choose the answer that feels closest right now.</p><div className="moods">{['Great','Good','Not well'].map(m=><button key={m} onClick={()=>onComplete(m)}>{m==='Great'?'😊':m==='Good'?'🙂':'😟'}<b>{m}</b></button>)}</div></div></Modal> }

function TaskForm({onClose,onAdd}:{onClose:()=>void,onAdd:(t:Omit<CareTask,'id'|'done'>)=>void}) { const [title,setTitle]=useState(''); const [owner,setOwner]=useState('Amara'); const [due,setDue]=useState('Today'); return <Modal onClose={onClose}><form className="form-modal" onSubmit={e=>{e.preventDefault();if(title.trim())onAdd({title:title.trim(),owner,due})}}><span className="eyebrow">NEW CARE TASK</span><h2>Add something to the family to-do</h2><label>Task<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Pick up groceries" required autoFocus/></label><label>Assign to<select value={owner} onChange={e=>setOwner(e.target.value)}><option>Amara</option><option>David</option></select></label><label>Due<input value={due} onChange={e=>setDue(e.target.value)}/></label><button className="primary" type="submit">Add care task</button></form></Modal> }

function LinkSenior({token,onClose,onLinked}:{token:string,onClose:()=>void,onLinked:()=>void}) { const [code,setCode]=useState(''); const [error,setError]=useState(''); return <Modal onClose={onClose}><form className="form-modal" onSubmit={async e=>{e.preventDefault();try{await api('/care-circle/link',{method:'POST',body:JSON.stringify({invite_code:code})},token);onLinked()}catch(err){setError(err instanceof Error?err.message:'Could not link account')}}}><span className="eyebrow">JOIN A CARE CIRCLE</span><h2>Enter the senior’s invitation code</h2><p>The senior can find this six-character code under “My Circle.”</p><label>Invitation code<input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} maxLength={6} placeholder="ABC123" required autoFocus/></label>{error&&<p className="form-error">{error}</p>}<button className="primary">Connect securely</button></form></Modal> }

function Modal({children,onClose}:{children:React.ReactNode,onClose:()=>void}) { return <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="modal"><button className="close" onClick={onClose} aria-label="Close"><X/></button>{children}</div></div> }

export default App
