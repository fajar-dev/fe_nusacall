import { callService } from '~/services/call-service'

export type SoftphoneState
  = | 'disconnected'
    | 'idle'
    | 'ringing'
    | 'connecting'
    | 'active'
    | 'ending'

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
 * Single source of truth for the softphone state: components only read it,
 * only this composable writes it. Call useSignaling/useWebRTC/useCallAudio only from here.
 */
export function useSoftphone() {
  const state = useState<SoftphoneState>('softphone-state', () => 'disconnected')
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

    signaling.on('connected', async () => {
      if (state.value === 'disconnected') state.value = 'idle'
      // Being connected IS being available now (no manual toggle), so
      // request mic/notification permission as soon as the socket connects.
      const granted = await audio.requestMicPermission()
      micDenied.value = !granted
      if (granted) await audio.requestNotificationPermission()
    })

    signaling.on('incoming_call', (packet) => {
      if (state.value !== 'idle') return // already ringing/on a call
      // wacid lives on the packet envelope, not packet.data — the backend
      // never puts it there. Without this merge, answer()/reject() send
      // no wacid and the server can't match the call.
      if (!packet.wacid) {
        console.error('incoming_call packet missing wacid, dropping', packet)
        return
      }
      const data = { ...(packet.data as unknown as IncomingCall), wacid: packet.wacid }
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
        lastTakenBy.value = (packet.data?.byEmail as string) ?? null
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
      // getUserMedia/ICE failures have no server-side signal, and a closed
      // socket send() silently no-ops — without this catch the call would
      // hang until the backend's answer-timeout. No answer_call was sent,
      // so there's nothing to undo server-side.
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

  /**
   * Places an outbound call. Permission is pre-checked by the caller UI;
   * the backend re-checks. Unlike answer(), a failure here doesn't strand
   * a waiting caller, so a plain error toast is enough.
   */
  async function callOutbound(phoneNumberId: string, waId: string): Promise<boolean> {
    if (state.value !== 'idle') return false
    state.value = 'connecting'

    try {
      const offerSdp = await webrtc.start()
      const { data } = await callService.placeOutboundCall(phoneNumberId, waId, offerSdp)
      activeWacid.value = data.wacid
      await webrtc.applyAnswer(data.answerSdp)
      return true
    } catch (err) {
      console.error('Failed to place outbound call', err)
      webrtc.close()
      activeWacid.value = null
      state.value = 'idle'
      return false
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
    incomingCall,
    activeWacid,
    answeredAt,
    lastTakenBy,
    micDenied,
    wsConnected: signaling.connected,
    init,
    answer,
    callOutbound,
    reject,
    hangup,
    setMuted
  }
}
