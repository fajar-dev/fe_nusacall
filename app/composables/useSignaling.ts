export interface WsPacket {
  type: string
  id?: string
  callId?: number
  wacid?: string
  data?: Record<string, unknown>
  ts: number
}

type WsHandler = (packet: WsPacket) => void

class SignalingClient {
  private ws: WebSocket | null = null
  private readonly handlers = new Map<string, Set<WsHandler>>()
  private pingTimer: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectDelayMs = 1000
  private manuallyClosed = false
  private token: string | null = null

  readonly connected = ref(false)

  connect(token: string) {
    if (typeof window === 'undefined') return
    this.manuallyClosed = false
    this.token = token

    const config = useRuntimeConfig()
    const url = `${config.public.wsUrl}?token=${encodeURIComponent(token)}`

    try {
      this.ws = new WebSocket(url)
    } catch (err) {
      console.error(`Failed to open signaling socket at "${config.public.wsUrl}". An HTTPS page requires wss://.`, err)
      this.connected.value = false
      this.ws = null
      return
    }

    this.ws.onopen = () => {
      this.connected.value = true
      this.reconnectDelayMs = 1000
      this.pingTimer = setInterval(() => this.send({ type: 'ping', ts: Date.now() }), 30000)
    }

    this.ws.onmessage = (evt) => {
      let packet: WsPacket
      try {
        packet = JSON.parse(evt.data)
      } catch {
        return
      }
      this.handlers.get(packet.type)?.forEach(h => h(packet))
    }

    this.ws.onclose = () => {
      this.connected.value = false
      if (this.pingTimer) clearInterval(this.pingTimer)
      if (!this.manuallyClosed) this.scheduleReconnect()
    }
  }

  private scheduleReconnect() {
    if (!this.token) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectDelayMs = Math.min(this.reconnectDelayMs * 2, 30000)
      if (this.token) this.connect(this.token)
    }, this.reconnectDelayMs)
  }

  disconnect() {
    this.manuallyClosed = true
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (this.pingTimer) clearInterval(this.pingTimer)
    this.ws?.close()
    this.ws = null
  }

  send(packet: Omit<WsPacket, 'ts'> & { ts?: number }) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ ...packet, ts: packet.ts ?? Date.now() }))
    }
  }

  on(type: string, handler: WsHandler): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set())
    this.handlers.get(type)!.add(handler)
    return () => this.handlers.get(type)?.delete(handler)
  }
}

let instance: SignalingClient | null = null

export function useSignaling() {
  if (!instance) instance = new SignalingClient()
  return instance
}
