/** Deterministic WebAudio-shaped fixture. Tests scheduling/resources, not speaker output. */
export class FakeAudioParam {
  constructor(value = 0) { this.value = value; this.calls = []; }
  setValueAtTime(value, time) { this.value = value; this.calls.push(['set', value, time]); }
  cancelScheduledValues(time) { this.calls.push(['cancel', time]); }
}
class FakeNode {
  constructor(context, kind) { this.context = context; this.kind = kind; this.connections = new Set(); this.disconnectCalls = 0; context.nodes.push(this); }
  connect(node) { this.connections.add(node); return node; }
  disconnect() { this.connections.clear(); this.disconnectCalls++; }
}
class FakeSource extends FakeNode {
  constructor(context) {
    super(context, 'source'); this.buffer = null; this.loop = false;
    this.playbackRate = new FakeAudioParam(1); this.onended = null;
    this.started = false; this.stopped = false; this.startCalls = 0; this.stopCalls = 0;
  }
  start(when = this.context.currentTime) {
    if (this.started) throw new Error('A source is one-shot');
    this.started = true; this.startCalls++; this.startTime = when;
    this.endTime = when + this.buffer.duration / this.playbackRate.value;
  }
  stop() { this.stopped = true; this.stopCalls++; }
  finish() { if (!this.stopped) { this.stopped = true; this.onended?.(); } }
}
export class FakeAudioContext {
  constructor({ sampleRate = 12000, state = 'suspended', resumeMode = 'auto' } = {}) {
    this.sampleRate = sampleRate; this.state = state; this.currentTime = 0;
    this.resumeMode = resumeMode; this.resumeCalls = 0; this.closeCalls = 0;
    this.nodes = []; this.resumeWaiters = []; this.destination = { kind: 'destination' };
  }
  createGain() { const node = new FakeNode(this, 'gain'); node.gain = new FakeAudioParam(1); return node; }
  createDynamicsCompressor() {
    const node = new FakeNode(this, 'compressor');
    for (const key of ['threshold', 'knee', 'ratio', 'attack', 'release']) node[key] = new FakeAudioParam();
    return node;
  }
  createBuffer(channels, length, sampleRate) {
    const data = Array.from({ length: channels }, () => new Float32Array(length));
    return { length, sampleRate, numberOfChannels: channels, duration: length / sampleRate,
      getChannelData: index => data[index], copyToChannel: (input, index) => data[index].set(input) };
  }
  createBufferSource() { return new FakeSource(this); }
  resume() {
    this.resumeCalls++;
    if (this.resumeMode === 'reject') return Promise.reject(new Error('Autoplay denied'));
    if (this.resumeMode === 'manual') return new Promise((resolve, reject) => this.resumeWaiters.push({ resolve, reject }));
    this.allowResume(); return Promise.resolve();
  }
  allowResume() { this.state = 'running'; for (const waiter of this.resumeWaiters.splice(0)) waiter.resolve(); }
  suspend() { this.state = 'suspended'; return Promise.resolve(); }
  close() { this.state = 'closed'; this.closeCalls++; return Promise.resolve(); }
  advance(seconds) {
    this.currentTime += seconds;
    for (const source of this.nodes.filter(n => n.kind === 'source')) {
      if (source.started && !source.stopped && !source.loop && source.endTime <= this.currentTime) source.finish();
    }
  }
  get liveSources() { return this.nodes.filter(n => n.kind === 'source' && n.started && !n.stopped); }
  get connectedNodes() { return this.nodes.filter(n => n.connections.size > 0); }
}
export class MemoryStorage {
  constructor(initial = {}) { this.values = new Map(Object.entries(initial)); this.writes = 0; }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); this.writes++; }
}
