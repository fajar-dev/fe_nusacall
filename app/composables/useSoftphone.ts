import { callService } from '~/services/call-service'
import type { SoftphoneState } from '~/enums/softphone-state'

export type { SoftphoneState }
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

  const initializedForToken = useState<string | null>('softphone-initialized-token', () => null)
  const ringingWacids = new Set<string>()
  const incomingToasts = new Map<string, string | number>()
  const unsubscribers: Array<() => void> = []

  function listen(type: string, handler: Parameters<typeof signaling.on>[1]) {
    unsubscribers.push(signaling.on(type, handler))
  }

  /** Sesi sebelumnya dilepas agar pengguna berikutnya tidak mewarisi koneksi dan handler lama. */
  function teardown() {
    while (unsubscribers.length) unsubscribers.pop()!()
    signaling.disconnect()
    audio.stopRinging()
    for (const wacid of [...incomingToasts.keys()]) dismissIncomingToast(wacid)
    ringingWacids.clear()
    state.value = 'disconnected'
    activeWacid.value = null
    answeredAt.value = null
    initializedForToken.value = null
  }

  function dismissIncomingToast(wacid: string) {
    const id = incomingToasts.get(wacid)
    if (!id) return
    toast.remove(id)
    incomingToasts.delete(wacid)
  }

  function init() {
    if (typeof window === 'undefined') return
    const { state: authState } = useAuth()

    if (!authState.token) {
      if (initializedForToken.value) teardown()
      return
    }
    if (initializedForToken.value === authState.token) return
    if (initializedForToken.value) teardown()
    initializedForToken.value = authState.token

    signaling.connect(authState.token)

    listen('connected', async () => {
      if (state.value === 'disconnected') state.value = 'idle'
      const granted = await audio.requestMicPermission()
      micDenied.value = !granted
      if (granted) await audio.requestNotificationPermission()
    })

    listen('incoming_call', (packet) => {
      if (!packet.wacid) {
        console.error('incoming_call packet missing wacid, dropping', packet)
        return
      }
      const wacid = packet.wacid
      const data = packet.data as { phoneNumber?: string | null, name?: string | null } | undefined
      const name = data?.name || ''
      const number = data?.phoneNumber || ''
      ringingWacids.add(wacid)
      if (state.value === 'idle') audio.startRinging()
      audio.notifyDesktop(t('components.softphone.incoming.notifyTitle'), name || number)
      const created = toast.add({
        title: name || number,
        description: name ? number : undefined,
        icon: 'i-lucide-phone-incoming',
        color: 'primary',
        duration: 0,
        actions: [
          {
            label: t('components.softphone.incoming.answer'),
            icon: 'i-lucide-phone',
            color: 'success',
            onClick: () => { answerCall(wacid) }
          },
          {
            label: t('components.softphone.incoming.reject'),
            icon: 'i-lucide-phone-off',
            color: 'error',
            variant: 'outline',
            onClick: () => rejectCall(wacid)
          }
        ]
      })
      incomingToasts.set(wacid, created.id)
    })

    listen('call_board', (packet) => {
      const call = packet.data as { wacid?: string, status?: string } | undefined
      if (!call?.wacid || call.status === 'ringing') return
      ringingWacids.delete(call.wacid)
      dismissIncomingToast(call.wacid)
      if (ringingWacids.size === 0) audio.stopRinging()
    })

    listen('call_taken', (packet) => {
      lastTakenBy.value = (packet.data?.byEmail as string) ?? null
    })

    listen('webrtc_answer', async (packet) => {
      if (packet.wacid !== activeWacid.value) return
      await webrtc.applyAnswer(packet.data?.sdp as string)
    })

    listen('call_state', (packet) => {
      if (packet.wacid !== activeWacid.value) return
      if (packet.data?.status === 'active') {
        state.value = 'active'
        answeredAt.value = Date.now()
      }
    })

    listen('call_ended', (packet) => {
      if (packet.wacid !== activeWacid.value) return
      teardownActiveCall()
    })
  }

  async function answerCall(wacid: string): Promise<boolean> {
    if (state.value !== 'idle') return false

    dismissIncomingToast(wacid)
    audio.stopRinging()
    state.value = 'connecting'
    activeWacid.value = wacid

    try {
      const offerSdp = await webrtc.start()
      if (!signaling.connected.value) throw new Error('Signaling socket is not connected')
      signaling.send({ type: 'answer_call', wacid, data: { sdp: offerSdp } })
      return true
    } catch (err) {
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

  function rejectCall(wacid: string) {
    dismissIncomingToast(wacid)
    ringingWacids.delete(wacid)
    if (ringingWacids.size === 0) audio.stopRinging()
    signaling.send({ type: 'reject_call', wacid })
  }

  async function callOutbound(phoneNumberId: string, contactId: number): Promise<boolean> {
    if (state.value !== 'idle') return false
    state.value = 'connecting'

    try {
      const offerSdp = await webrtc.start()
      const { data } = await callService.placeOutboundCall(phoneNumberId, contactId, offerSdp)
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
    rejectCall,
    callOutbound,
    hangup,
    setMuted
  }
}
