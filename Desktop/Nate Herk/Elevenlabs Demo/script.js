// Build waveform bars
const wf = document.getElementById('waveform');
const N = 30;
for (let i = 0; i < N; i++) {
  const bar = document.createElement('div');
  bar.className = 'w-bar';
  const t = i / (N - 1);
  const center = Math.sin(t * Math.PI);
  const lo = (3 + Math.random() * 4).toFixed(1);
  const hi = (8 + center * 30 + Math.random() * 10).toFixed(1);
  const d  = (0.55 + Math.random() * 0.7).toFixed(2) + 's';
  const dl = '-' + (Math.random() * 1.4).toFixed(2) + 's';
  bar.style.cssText = `--lo:${lo}px;--hi:${hi}px;--d:${d};--dl:${dl};`;
  wf.appendChild(bar);
}

// Forward orb click to ElevenLabs widget button
document.getElementById('voice-btn').addEventListener('click', () => {
  const widget = document.querySelector('elevenlabs-convai');
  if (!widget) return;
  const btn = widget.shadowRoot?.querySelector('button');
  if (btn) btn.click();
});
