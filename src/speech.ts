let voices: SpeechSynthesisVoice[] = []

function refreshVoices() {
  voices = window.speechSynthesis.getVoices()
}

if ('speechSynthesis' in window) {
  refreshVoices()
  window.speechSynthesis.addEventListener('voiceschanged', refreshVoices)
}

export function speakEnglish(text: string): void {
  if (!('speechSynthesis' in window)) return
  const synth = window.speechSynthesis
  synth.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  const voice =
    voices.find((v) => v.lang === 'en-US') ??
    voices.find((v) => v.lang.startsWith('en'))
  if (voice) utterance.voice = voice
  utterance.rate = 0.95
  synth.speak(utterance)
}
