import { callService } from '~/services/call-service'

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
      // The backend marks this connection "available" automatically on
      // connect — there's no manual toggle to resend. What used to gate
      // behind clicking "available" in PresenceToggle now happens right
      // here instead: ask for mic/notification permission as soon as the
      // socket comes up, since being connected IS being available now.
      const granted = await audio.requestMicPermission()
      micDenied.value = !granted
      if (granted) await audio.requestNotificationPermission()
    })

    signaling.on('incoming_call', (packet) => {
      if (state.value !== 'idle') return // already ringing/on a call
      // wacid rides on the packet envelope (packet.wacid), not inside
      // packet.data — the backend never puts it in data. Reading
      // incomingCall.value.wacid without this merge is always undefined,
      // so answer()/reject() silently send answer_call with no wacid at
      // all (JSON.stringify drops the undefined key), which the server
      // can't match to any call or session.
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

  /**
   * Fase 3 (BIC) — places an outbound call. Permission is assumed already
   * checked by the caller (the "Telepon" button only renders once
   * permission-checking UI confirms it) — the backend re-checks anyway and
   * this surfaces that as a normal toast on failure (unlike answer(), a
   * failure here has no waiting caller to silently strand, so
   * handleServiceError's toast is exactly the right amount of noise).
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
