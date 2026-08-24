/**
 * Ringtone (synthesized via Web Audio — no static asset to ship/host) and
 * the permission prompts that must fire when the agent goes "available",
 * not on page load (docs/FRONTEND-SPEC.md §2.6).
 */
class CallAudio {
  private audioCtx: AudioContext | null = null
  private ringInterval: ReturnType<typeof setInterval> | null = null

  startRinging() {
    if (typeof window === 'undefined' || this.ringInterval) return
    this.audioCtx = new AudioContext()
    const beep = () => {
      if (!this.audioCtx) return
      const osc = this.audioCtx.createOscillator()
      const gain = this.audioCtx.createGain()
      osc.frequency.value = 440
      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime)
      osc.connect(gain).connect(this.audioCtx.destination)
      osc.start()
      osc.stop(this.audioCtx.currentTime + 0.4)
    }
    beep()
    this.ringInterval = setInterval(beep, 1000)
  }

  stopRinging() {
    if (this.ringInterval) clearInterval(this.ringInterval)
    this.ringInterval = null
    this.audioCtx?.close()
    this.audioCtx = null
  }

  async requestMicPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
      return true
    } catch {
      return false
    }
  }

  async requestNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission === 'default') await Notification.requestPermission()
  }

  notifyDesktop(title: string, body: string) {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission === 'granted') {
      new Notification(title, { body })
    }
  }
}

let instance: CallAudio | null = null

export function useCallAudio() {
  if (!instance) instance = new CallAudio()
  return instance
}
