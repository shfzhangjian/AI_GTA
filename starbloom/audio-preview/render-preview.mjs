import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SFX_SCORES, BIOME_SPECS, renderSfxPCM, renderAmbiencePCM } from '../audio.js';
const directory = path.dirname(fileURLToPath(import.meta.url));
const rate = 44100;
function writeWav(name, pcm) {
  const output = Buffer.alloc(44 + pcm.length * 2);
  output.write('RIFF', 0); output.writeUInt32LE(output.length - 8, 4); output.write('WAVEfmt ', 8);
  output.writeUInt32LE(16, 16); output.writeUInt16LE(1, 20); output.writeUInt16LE(1, 22);
  output.writeUInt32LE(rate, 24); output.writeUInt32LE(rate * 2, 28); output.writeUInt16LE(2, 32); output.writeUInt16LE(16, 34);
  output.write('data', 36); output.writeUInt32LE(pcm.length * 2, 40);
  let peak = 0, square = 0;
  for (let i = 0; i < pcm.length; i++) {
    const sample = Math.max(-1, Math.min(1, pcm[i]));
    output.writeInt16LE(Math.round(sample * 32767), 44 + i * 2); peak = Math.max(peak, Math.abs(sample)); square += sample * sample;
  }
  fs.writeFileSync(path.join(directory, name), output);
  return { file: name, durationSeconds: pcm.length / rate, sampleRate: rate, channels: 1, bits: 16, peak, rms: Math.sqrt(square / pcm.length), bytes: output.length };
}
const cues = [], parts = [];
let frame = Math.round(.25 * rate);
for (const event of Object.keys(SFX_SCORES)) {
  const pcm = renderSfxPCM(event, rate);
  cues.push({ event, startsAtSeconds: frame / rate, durationSeconds: pcm.length / rate });
  parts.push({ pcm, frame }); frame += pcm.length + Math.round(.6 * rate);
}
const sfx = new Float32Array(frame);
for (const part of parts) for (let i = 0; i < part.pcm.length; i++) sfx[part.frame + i] = part.pcm[i] * .7;
const ambience = new Float32Array(rate * 30), ambientCues = [];
for (let biome = 0; biome < BIOME_SPECS.length; biome++) {
  const pcm = renderAmbiencePCM(biome, rate), start = biome * rate * 6;
  ambientCues.push({ biome, name: BIOME_SPECS[biome].name, startsAtSeconds: start / rate, durationSeconds: 6 });
  for (let i = 0; i < 6 * rate; i++) {
    const fade = Math.min(1, i / (rate * .12), (6 * rate - i) / (rate * .2));
    ambience[start + i] = pcm[i] * .25 * Math.max(0, fade);
  }
}
const result = {
  label: 'Offline synthesis preview from the exact same immutable scores and PCM renderers used by GameAudio. Not a browser or speaker audition.',
  mix: 'SFX .70; ambience .25. Live browser compressor is not modeled; these sparse previews remain below its -9 dB threshold except short attack peaks.',
  files: [writeWav('starbloom-original-sfx-preview.wav', sfx), writeWav('starbloom-original-biomes-preview.wav', ambience)],
  sfxCues: cues, ambienceCues: ambientCues,
};
fs.writeFileSync(path.join(directory, 'preview-cues.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result.files, null, 2));
