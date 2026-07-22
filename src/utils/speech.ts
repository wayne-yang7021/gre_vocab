export function speakWord(text: string) {
  if (!('speechSynthesis' in window)) {
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.9; // Slightly slower for clear pronunciation

  // Find an en-US voice if available
  const voices = window.speechSynthesis.getVoices();
  const usVoice = voices.find((v) => v.lang.includes('en-US') || v.lang.includes('en_US'));
  if (usVoice) {
    utterance.voice = usVoice;
  }

  window.speechSynthesis.speak(utterance);
}
