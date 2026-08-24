import type { AgentAvailability } from '~/types/agent'

export type SoftphoneState
  = | 'disconnected' // WebSocket not yet connected
    | 'idle' // ready
    | 'ringing' // an incoming call
    | 'connecting' // answering, negotiating media
    | 'active' // in a call
    | 'ending' // hanging up

export interface IncomingCall {
  wacid: string
  callId: number
  waId: string
  displayWaId?: string
  contactName: string | null // null = nusawa unreachable, a normal degradation
  profileName: string | null
  phoneNumberLabel?: string
  phoneNumberId?: string
  displayPhoneNumber?: string | null
  inboxId?: string | null
  lastMessage?: string | null
  tags?: string[]
  nusawaThreadUrl?: string | null
  isPicMatch?: boolean
  expiresAt?: number
}

/**
 * Single source of truth for the softphone (docs/FRONTEND-SPEC.md §2.2-2.3).
 * Components only READ this state — only this composable may write it.
 * Layers underneath: useSignaling() (WebSocket), useWebRTC() (media),
 * useCallAudio() (ringtone/permissions). Components must not call those directly.
 */
export function useSoftphone() {
  const state = useState<SoftphoneState>('softphone-state', () => 'disconnected')
  const availability = useState<AgentAvailability>('softphone-availability', () => 'offline')
  const incomingCall = useState<IncomingCall | null>('softphone-incoming-call', () => null)
  const activeWacid = useState<string | null>('softphone-active-wacid', () => null)
  const answeredAt = useState<number | null>('softphone-answered-at', () => null)
  const lastTakenBy = useState<string | null>('softphone-last-taken-by', () => null)
  const micDenied = useState<boolean>('softphone-mic-denied', () => false)

  const signaling = useSignaling()
  const webrtc = useWebRTC()
  const audio = useCallAudio()
  const { t } = useI18n()

  const initialized = useState<boolean>('softphone-initialized', () => false)

  function init() {
    if (initialized.value || typeof window === 'undefined') return
    const { state: authState } = useAuth()
    if (!authState.token) return
    initialized.value = true

    signaling.connect(authState.token)

    signaling.on('connected', () => {
      if (state.value === 'disconnected') state.value = 'idle'
      // Backend's presence registry is wiped on disconnect and re-created
      // with a hardcoded "available" default (signaling.gateway.ts) — resend
      // whatever this tab currently holds so a fresh page load (availability
      // defaults to "offline") and a mid-session reconnect (availability
      // already "available"/"busy"/etc.) both land on the correct value
      // instead of silently drifting to the backend's default.
      signaling.send({ type: 'set_availability', data: { availability: availability.value } })
    })

    signaling.on('incoming_call', (packet) => {
      if (state.value !== 'idle') return // already ringing/on a call
      const data = packet.data as unknown as IncomingCall
      incomingCall.value = data
      state.value = 'ringing'
      audio.startRinging()
      audio.notifyDesktop(
        'Panggilan masuk',
        data.contactName || data.profileName || data.waId
      )
    })

    signaling.on('call_taken', (packet) => {
      if (incomingCall.value?.wacid === packet.wacid) {
        audio.stopRinging()
        lastTakenBy.value = (packet.data?.byUsername as string) ?? null
        incomingCall.value = null
        state.value = 'idle'
      }
    })

    signaling.on('webrtc_answer', async (packet) => {
      if (packet.wacid !== activeWacid.value) return
      await webrtc.applyAnswer(packet.data?.sdp as string)
    })

    signaling.on('call_state', (packet) => {
      if (packet.wacid !== activeWacid.value) return
      if (packet.data?.status === 'active') {
        state.value = 'active'
        answeredAt.value = Date.now()
      }
    })

    signaling.on('call_ended', (packet) => {
      if (packet.wacid !== activeWacid.value) return
      teardownActiveCall()
    })
  }

  async function setAvailability(next: AgentAvailability): Promise<boolean> {
    if (next === 'available' && availability.value !== 'available') {
      const granted = await audio.requestMicPermission()
      micDenied.value = !granted
      if (!granted) return false
      await audio.requestNotificationPermission()
    }
    availability.value = next
    signaling.send({ type: 'set_availability', data: { availability: next } })
    return true
  }

  async function answer() {
    if (!incomingCall.value) return
    const wacid = incomingCall.value.wacid
    audio.stopRinging()
    state.value = 'connecting'
    activeWacid.value = wacid
    incomingCall.value = null

    try {
      const offerSdp = await webrtc.start()
      if (!signaling.connected.value) throw new Error('Signaling socket is not connected')
      signaling.send({ type: 'answer_call', wacid, data: { sdp: offerSdp } })
    } catch (err) {
      // getUserMedia/ICE can fail for reasons with zero server-side signal
      // (mic permission revoked, device busy, insecure context), and
      // signaling.send() silently no-ops on a closed socket instead of
      // throwing — without this, the agent sees the modal vanish and
      // nothing else, and the call just sits there until the backend's own
      // answer-timeout closes it. We never sent answer_call, so there's
      // nothing to undo server-side: another ringing agent (if any) can
      // still pick it up, and the existing timeout naturally releases this
      // one.
      console.error('Failed to answer call', err)
      useToast().add({
        title: t('components.softphone.answerFailedTitle'),
        description: t('components.softphone.answerFailedDescription'),
        color: 'error',
        icon: 'i-lucide-phone-off'
      })
      webrtc.close()
      activeWacid.value = null
      state.value = 'idle'
    }
  }

  function reject(reason?: string) {
    if (!incomingCall.value) return
    audio.stopRinging()
    signaling.send({ type: 'reject_call', wacid: incomingCall.value.wacid, data: { reason } })
    incomingCall.value = null
    state.value = 'idle'
  }

  function hangup() {
    if (!activeWacid.value) return
    signaling.send({ type: 'hangup', wacid: activeWacid.value })
    teardownActiveCall()
  }

  function teardownActiveCall() {
    webrtc.close()
    activeWacid.value = null
    answeredAt.value = null
    state.value = 'idle'
  }

  function setMuted(muted: boolean) {
    webrtc.setMuted(muted)
  }

  return {
    state,
    availability,
    incomingCall,
    activeWacid,
    answeredAt,
    lastTakenBy,
    micDenied,
    wsConnected: signaling.connected,
    init,
    setAvailability,
    answer,
    reject,
    hangup,
    setMuted
  }
}
