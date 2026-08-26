import { callService } from '~/services/call-service'

export type SoftphoneState
  = | 'disconnected'
    | 'idle'
    | 'connecting'
    | 'active'
    | 'ending'

/**
 * Single source of truth for the softphone state: components only read it,
 * only this composable writes it. Call useSignaling/useWebRTC/useCallAudio only from here.
 */
export function useSoftphone() {
  const state = useState<SoftphoneState>('softphone-state', () => 'disconnected')
  const activeWacid = useState<string | null>('softphone-active-wacid', () => null)
  const answeredAt = useState<number | null>('softphone-answered-at', () => null)
  const lastTakenBy = useState<string | null>('softphone-last-taken-by', () => null)
  const micDenied = useState<boolean>('softphone-mic-denied', () => false)

  const signaling = useSignaling()
  const webrtc = useWebRTC()
  const audio = useCallAudio()
  const toast = useToast()
  const { t } = useI18n()

  const initialized = useState<boolean>('softphone-initialized', () => false)
  // Local bookkeeping only — which wacids are still ringing somewhere, so the ringtone
  // knows when to stop. The call board (useCallBoard) owns the actual queue/ongoing/history
  // lists; this composable doesn't need to duplicate that.
  const ringingWacids = new Set<string>()

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

    // Broadcast to every connected agent (routing is broadcast-to-all) — this is purely
    // the "something needs picking up" signal now, not a personal ring. No modal: a toast
    // plus the shared call board (useCallBoard) is where an agent actually answers from.
    signaling.on('incoming_call', (packet) => {
      if (!packet.wacid) {
        console.error('incoming_call packet missing wacid, dropping', packet)
        return
      }
      const data = packet.data as { waId?: string, contactName?: string | null, profileName?: string | null } | undefined
      ringingWacids.add(packet.wacid)
      if (state.value === 'idle') audio.startRinging()
      audio.notifyDesktop(
        t('components.softphone.incoming.notifyTitle'),
        data?.contactName || data?.profileName || data?.waId || ''
      )
      toast.add({
        title: t('components.softphone.incoming.notifyTitle'),
        description: data?.contactName || data?.profileName || data?.waId || '',
        icon: 'i-lucide-phone-incoming',
        color: 'primary'
      })
    })

    // Fired for every status change, system-wide (see useCallBoard) — used here only to know
    // when a call stops ringing, so the shared ringtone can stop.
    signaling.on('call_board', (packet) => {
      const call = packet.data as { wacid?: string, status?: string } | undefined
      if (!call?.wacid || call.status === 'ringing') return
      ringingWacids.delete(call.wacid)
      if (ringingWacids.size === 0) audio.stopRinging()
    })

    signaling.on('call_taken', (packet) => {
      lastTakenBy.value = (packet.data?.byEmail as string) ?? null
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

  /** Answers any ringing call by wacid — used by the call board's "Answer" action. */
  async function answerCall(wacid: string): Promise<boolean> {
    if (state.value !== 'idle') return false // already on/connecting to another call

    audio.stopRinging()
    state.value = 'connecting'
    activeWacid.value = wacid

    try {
      const offerSdp = await webrtc.start()
      if (!signaling.connected.value) throw new Error('Signaling socket is not connected')
      signaling.send({ type: 'answer_call', wacid, data: { sdp: offerSdp } })
      return true
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
      return false
    }
  }

  /**
   * Places an outbound call. Permission is pre-checked by the caller UI;
   * the backend re-checks. Unlike answerCall(), a failure here doesn't strand
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
    activeWacid,
    answeredAt,
    lastTakenBy,
    micDenied,
    wsConnected: signaling.connected,
    init,
    answerCall,
    callOutbound,
    hangup,
    setMuted
  }
}
