import { useEffect, useRef, useState } from 'react'
import {
  FiActivity,
  FiCalendar,
  FiMic,
  FiMicOff,
  FiPhone,
  FiPhoneOff,
  FiSearch,
  FiVideo,
  FiVolume2,
  FiX,
} from 'react-icons/fi'

const API = '/api'

function formatPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  return phone
}

function StatusDot({ online = true }) {
  return <span className={`status-dot ${online ? '' : 'offline'}`} />
}

export default function App() {
  const [doctors, setDoctors] = useState([])
  const [appointments, setAppointments] = useState([])
  const [slots, setSlots] = useState([])
  const [callOpen, setCallOpen] = useState(false)
  const [callState, setCallState] = useState('idle')
  const [muted, setMuted] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [transcript, setTranscript] = useState([
    { role: 'assistant', text: 'Hi, I’m Maya. How can I help you schedule a visit today?' },
  ])
  const [draft, setDraft] = useState('')
  const [highlightId, setHighlightId] = useState(null)
  const recognitionRef = useRef(null)
  const transcriptRef = useRef(null)
  const sessionIdRef = useRef(globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}-${Math.random()}`)

  async function refresh() {
    const [doctorRes, appointmentRes, slotRes] = await Promise.all([
      fetch(`${API}/doctors`),
      fetch(`${API}/appointments`),
      fetch(`${API}/slots`),
    ])
    setDoctors(await doctorRes.json())
    setAppointments(await appointmentRes.json())
    setSlots(await slotRes.json())
  }

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    if (!callOpen || callState !== 'connected') return
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => clearInterval(timer)
  }, [callOpen, callState])

  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [transcript])

  function speak(text) {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    window.speechSynthesis.speak(utterance)
  }

  async function startCall() {
    setCallOpen(true)
    setCallState('ringing')
    setElapsed(0)
    setTranscript([{ role: 'assistant', text: 'Hi, I’m Maya. How can I help you schedule a visit today?' }])
    window.setTimeout(() => setCallState('connected'), 900)
  }

  function endCall() {
    recognitionRef.current?.stop()
    window.speechSynthesis?.cancel()
    setCallState('ended')
    setMuted(false)
  }

  async function sendMessage(text) {
    const cleanText = text.trim()
    if (!cleanText) return
    setTranscript((items) => [...items, { role: 'caller', text: cleanText }])
    setDraft('')

    const response = await fetch(`${API}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: cleanText, session_id: sessionIdRef.current }),
    })
    const data = await response.json()
    setTranscript((items) => [...items, { role: 'assistant', text: data.reply }])
    speak(data.reply)
    await refresh()
    if (data.appointment) {
      setHighlightId(data.appointment.id)
      window.setTimeout(() => setHighlightId(null), 4000)
    }
  }

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setTranscript((items) => [
        ...items,
        { role: 'assistant', text: 'Voice input is not supported in this browser. Please use the text field.' },
      ])
      return
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
      setMuted(true)
      return
    }
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.onresult = (event) => sendMessage(event.results[0][0].transcript)
    recognition.onend = () => {
      recognitionRef.current = null
      setMuted(false)
    }
    recognition.start()
    recognitionRef.current = recognition
    setMuted(false)
  }

  const timer = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand">
            <span className="brand-mark"><FiActivity /></span>
            <span>Careline</span>
          </div>
          <nav className="nav-list" aria-label="Primary navigation">
            <button className="nav-item active"><FiCalendar />Overview</button>
            <button className="nav-item"><FiVideo />Calls</button>
            <button className="nav-item"><FiCalendar />Appointments</button>
          </nav>
        </div>
        <div className="profile">
          <div className="avatar">MK</div>
          <div><strong>Maya K.</strong><span>Care coordinator</span></div>
          <button aria-label="Search"><FiSearch /></button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">TUESDAY, NOVEMBER 24</p>
            <h1>Good morning, Maya</h1>
          </div>
          <button className="primary-button" onClick={startCall}>
            <FiPhone />Try call
          </button>
        </header>

        <div className="stats">
          <article><span>Available doctors</span><strong>{doctors.length}</strong><small><StatusDot />3 accepting calls</small></article>
          <article><span>Appointments today</span><strong>{appointments.length}</strong><small>{appointments.filter((item) => item.status === 'confirmed').length} confirmed</small></article>
          <article><span>Open slots</span><strong>{slots.length}</strong><small>Across all specialists</small></article>
        </div>

        <div className="content-grid">
          <section className="panel doctors-panel">
            <div className="panel-heading">
              <div><p className="eyebrow">CLINICAL TEAM</p><h2>Doctors</h2></div>
              <button aria-label="Search doctors"><FiSearch /></button>
            </div>
            <div className="doctor-list">
              {doctors.map((doctor) => (
                <article className="doctor-row" key={doctor.id}>
                  <div className="doctor-avatar" style={{ background: doctor.color }}>{doctor.initials}</div>
                  <div className="doctor-info">
                    <strong>{doctor.name}</strong>
                    <span>{doctor.speciality}</span>
                  </div>
                  <div className="doctor-slots">
                    {doctor.slots.slice(0, 3).map((slot) => (
                      <button key={slot} onClick={() => sendMessage(`Book ${doctor.name} at ${slot}`)}>{slot}</button>
                    ))}
                  </div>
                  <StatusDot />
                </article>
              ))}
            </div>
          </section>

          <section className="panel appointments-panel">
            <div className="panel-heading">
              <div><p className="eyebrow">TODAY</p><h2>Appointments</h2></div>
              <span className="count-badge">{appointments.length}</span>
            </div>
            <div className="appointment-list">
              {appointments.length === 0 ? (
                <div className="empty-state">
                  <FiCalendar />
                  <strong>No appointments yet</strong>
                  <span>New bookings will appear here.</span>
                </div>
              ) : appointments.map((appointment) => (
                <article
                  className={`appointment-row ${highlightId === appointment.id ? 'highlight' : ''}`}
                  key={appointment.id}
                >
                  <time>{appointment.time}</time>
                  <div>
                    <strong>{appointment.doctorName}</strong>
                    <span>{formatPhone(appointment.phone)}</span>
                  </div>
                  <span className={`pill ${appointment.status}`}>{appointment.status}</span>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>

      {callOpen && (
        <div className="call-overlay" role="dialog" aria-modal="true" aria-label="Voice call">
          <section className="phone-card">
            <header className="phone-header">
              <span className={`live-indicator ${callState}`}><i /> {callState}</span>
              <button aria-label="Close call" onClick={() => setCallOpen(false)}><FiX /></button>
            </header>
            <div className="caller">
              <div className="caller-avatar">M<span>✦</span></div>
              <h2>Maya AI</h2>
              <p>{callState === 'ringing' ? 'Connecting…' : callState === 'ended' ? 'Call ended' : timer}</p>
            </div>

            {callState === 'connected' && (
              <div className="waveform" aria-hidden="true">
                {[36, 52, 68, 44, 76, 58, 84, 48, 66, 38, 72, 52].map((height, index) => (
                  <i key={index} style={{ height }} />
                ))}
              </div>
            )}

            <div className="transcript" ref={transcriptRef}>
              {transcript.map((item, index) => (
                <div className={`message ${item.role}`} key={`${item.role}-${index}`}>
                  <span>{item.role === 'caller' ? 'You' : 'Maya'}</span>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>

            {callState === 'connected' && (
              <>
                <form className="message-form" onSubmit={(event) => { event.preventDefault(); sendMessage(draft) }}>
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Type a response…"
                    aria-label="Message Maya"
                  />
                  <button type="submit" aria-label="Send"><FiPhone /></button>
                </form>
                <div className="call-controls">
                  <button className={muted ? 'control muted' : 'control'} onClick={startListening}>
                    {muted ? <FiMicOff /> : <FiMic />}<span>{muted ? 'Muted' : 'Speak'}</span>
                  </button>
                  <button className="control"><FiVolume2 /><span>Speaker</span></button>
                  <button className="control end" onClick={endCall}><FiPhoneOff /><span>End</span></button>
                </div>
              </>
            )}
            {callState === 'ended' && (
              <button className="restart-button" onClick={startCall}>Call again</button>
            )}
          </section>
        </div>
      )}
    </main>
  )
}
