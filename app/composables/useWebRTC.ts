class WebRTCClient {
  private pc: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteAudio: HTMLAudioElement | null = null

  async start(): Promise<string> {
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true })

    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })

    for (const track of this.localStream.getAudioTracks()) {
      this.pc.addTrack(track, this.localStream)
    }

    this.remoteAudio = new Audio()
    this.remoteAudio.autoplay = true
    this.pc.ontrack = (evt) => {
      if (this.remoteAudio && evt.streams[0]) this.remoteAudio.srcObject = evt.streams[0]
    }

    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(offer)
    await this.waitIceGatheringComplete()

    return this.pc.localDescription!.sdp
  }

  async applyAnswer(sdp: string) {
    await this.pc?.setRemoteDescription({ type: 'answer', sdp })
  }

  setMuted(muted: boolean) {
    this.localStream?.getAudioTracks().forEach((t) => {
      t.enabled = !muted
    })
  }

  close() {
    this.pc?.close()
    this.pc = null
    this.localStream?.getTracks().forEach(t => t.stop())
    this.localStream = null
    if (this.remoteAudio) this.remoteAudio.srcObject = null
    this.remoteAudio = null
  }

  private waitIceGatheringComplete(): Promise<void> {
    const pc = this.pc!
    if (pc.iceGatheringState === 'complete') return Promise.resolve()
    return new Promise((resolve) => {
      const timeout = setTimeout(resolve, 3000)
      pc.addEventListener('icegatheringstatechange', () => {
        if (pc.iceGatheringState === 'complete') {
          clearTimeout(timeout)
          resolve()
        }
      })
    })
  }
}

let instance: WebRTCClient | null = null

export function useWebRTC() {
  if (!instance) instance = new WebRTCClient()
  return instance
}
