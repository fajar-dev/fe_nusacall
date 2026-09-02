import type { Inviter } from 'sip.js'
import { Invitation, Registerer, SessionState, UserAgent } from 'sip.js'
import { authService } from '~/services/auth-service'

interface SipCredentials {
  username: string
  password: string
  wsUrl: string
  domain: string
}

class SipPhone {
  private ua: UserAgent | null = null
  private registerer: Registerer | null = null
  private session: Invitation | Inviter | null = null
  private remoteAudio: HTMLAudioElement | null = null
  private registeredFor: string | null = null

  readonly registered = ref(false)

  private onEstablished: (() => void) | null = null
  private onTerminated: (() => void) | null = null

  async register(credentials: SipCredentials): Promise<void> {
    if (typeof window === 'undefined') return
    if (this.registeredFor === credentials.username && this.registered.value) return

    await this.unregister()

    const uri = UserAgent.makeURI(`sip:${credentials.username}@${credentials.domain}`)
    if (!uri) throw new Error('Invalid SIP URI')

    this.ua = new UserAgent({
      uri,
      authorizationUsername: credentials.username,
      authorizationPassword: credentials.password,
      transportOptions: { server: credentials.wsUrl },
      delegate: {
        onInvite: invitation => this.handleInvite(invitation)
      }
    })

    await this.ua.start()
    this.registerer = new Registerer(this.ua)
    await this.registerer.register()
    this.registeredFor = credentials.username
    this.registered.value = true
  }

  async unregister(): Promise<void> {
    try {
      await this.registerer?.unregister()
      await this.ua?.stop()
    } catch {
      // sudah putus — tidak ada yang perlu dibereskan
    }
    this.registerer = null
    this.ua = null
    this.registeredFor = null
    this.registered.value = false
  }

  /**
   * Backend selalu yang memutuskan siapa menerima panggilan, jadi INVITE dari
   * Asterisk langsung dijawab. Panggilan tidak akan pernah sampai ke sini kecuali
   * agent sudah menekan angkat atau memulai panggilan keluar.
   */
  private async handleInvite(invitation: Invitation): Promise<void> {
    this.session = invitation
    this.watchSession(invitation)
    await invitation.accept({
      sessionDescriptionHandlerOptions: { constraints: { audio: true, video: false } }
    })
  }

  private watchSession(session: Invitation | Inviter): void {
    session.stateChange.addListener((newState) => {
      if (newState === SessionState.Established) {
        this.attachRemoteAudio(session)
        this.onEstablished?.()
      }
      if (newState === SessionState.Terminated) {
        this.detachRemoteAudio()
        if (this.session === session) this.session = null
        this.onTerminated?.()
      }
    })
  }

  private attachRemoteAudio(session: Invitation | Inviter): void {
    const sdh = session.sessionDescriptionHandler as unknown as { peerConnection?: RTCPeerConnection } | undefined
    const pc = sdh?.peerConnection
    if (!pc) return

    const stream = new MediaStream()
    for (const receiver of pc.getReceivers()) {
      if (receiver.track) stream.addTrack(receiver.track)
    }

    this.remoteAudio = new Audio()
    this.remoteAudio.autoplay = true
    this.remoteAudio.srcObject = stream
    void this.remoteAudio.play().catch(() => {
      // autoplay bisa ditolak browser sampai ada interaksi pengguna
    })
  }

  private detachRemoteAudio(): void {
    if (!this.remoteAudio) return
    this.remoteAudio.srcObject = null
    this.remoteAudio = null
  }

  onCallEstablished(handler: () => void): void {
    this.onEstablished = handler
  }

  onCallTerminated(handler: () => void): void {
    this.onTerminated = handler
  }

  hangup(): void {
    const session = this.session
    if (!session) return

    if (session.state === SessionState.Established) {
      void session.bye().catch(() => {})
    } else if (session instanceof Invitation) {
      void session.reject().catch(() => {})
    } else {
      void session.cancel().catch(() => {})
    }
    this.session = null
  }

  setMuted(muted: boolean): void {
    const sdh = this.session?.sessionDescriptionHandler as unknown as { peerConnection?: RTCPeerConnection } | undefined
    const pc = sdh?.peerConnection
    if (!pc) return
    for (const sender of pc.getSenders()) {
      if (sender.track?.kind === 'audio') sender.track.enabled = !muted
    }
  }

  get hasActiveSession(): boolean {
    return this.session !== null
  }
}

const phone = new SipPhone()

export function useSipPhone() {
  return {
    registered: phone.registered,
    register: async () => {
      const { data } = await authService.getSipCredentials()
      await phone.register(data)
    },
    unregister: () => phone.unregister(),
    onCallEstablished: (handler: () => void) => phone.onCallEstablished(handler),
    onCallTerminated: (handler: () => void) => phone.onCallTerminated(handler),
    hangup: () => phone.hangup(),
    setMuted: (muted: boolean) => phone.setMuted(muted)
  }
}
