/**
 * AnimationController: single entry point for animation playback.
 * Gameplay code only calls play()/crossFade() — never clipAction directly.
 * Merges file clips (GLB) with procedural clips; fires normalized-time events.
 */
import * as THREE from 'three';
import { EventCursor, getTrack } from './AnimationEvents';

export interface AnimControllerOptions {
  root: THREE.Object3D;           // mixer root (armature or group)
  fileClips: THREE.AnimationClip[];
  proceduralClips: THREE.AnimationClip[];
  speedScale?: number;
}

export class AnimationController {
  private mixer: THREE.AnimationMixer;
  private actions = new Map<string, THREE.AnimationAction>();
  private clips = new Map<string, THREE.AnimationClip>();
  private current: string | null = null;
  private cursor = new EventCursor();
  private speedScale: number;

  /** normalized time of the currently playing animation (0..1) */
  normalizedTime = 0;
  /** elapsed seconds in current animation */
  elapsedInAnim = 0;
  /** true once current animation reached its end (non-looping) */
  finished = false;

  constructor(opts: AnimControllerOptions) {
    this.mixer = new THREE.AnimationMixer(opts.root);
    this.speedScale = opts.speedScale ?? 1;
    for (const c of opts.proceduralClips) this.clips.set(c.name, c);
    // file clips win over procedural ones with same name
    for (const c of opts.fileClips) this.clips.set(c.name, c);
  }

  has(name: string): boolean {
    return this.clips.has(name);
  }

  /** Play an animation immediately (no fade). */
  play(name: string, opts: { loop?: boolean; speed?: number; restart?: boolean } = {}): void {
    const clip = this.clips.get(name);
    if (!clip) {
      // fall back to idle so nothing breaks on a missing anim
      const fallback = this.clips.get('Idle');
      if (!fallback || name === 'Idle') return;
      return this.play('Idle', opts);
    }
    let action = this.actions.get(name);
    if (!action) {
      action = this.mixer.clipAction(clip);
      this.actions.set(name, action);
    }
    const loop = opts.loop ?? (clip.name === 'Idle' || clip.name === 'Walk' || clip.name === 'Run' || clip.name === 'Fall');
    action.reset();
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, 0);
    action.clampWhenFinished = !loop;
    action.enabled = true;
    action.timeScale = (opts.speed ?? 1) * this.speedScale;
    action.play();

    // stop all other actions (stale-loop guards prevent double playback too)
    for (const [n, a] of this.actions) {
      if (n !== name) a.stop();
    }
    this.current = name;
    this.cursor.reset();
    this.normalizedTime = 0;
    this.elapsedInAnim = 0;
    this.finished = false;
  }

  /** Cross-fade from current to another animation. */
  crossFade(name: string, duration = 0.15, loop?: boolean): void {
    const prevName = this.current;
    if (prevName === name) return; // already playing it — never restart/clear events
    this.play(name, { loop });
    if (prevName) {
      const prev = this.actions.get(prevName);
      const next = this.actions.get(name);
      if (prev && next) {
        // play() already reset+played `next`; crossFadeTo resets the fade-out source weight
        prev.crossFadeTo(next, duration, false);
      }
    }
  }

  setSpeedScale(scale: number): void {
    this.speedScale = scale;
  }

  /** Advance mixer; returns fired animation events for the current animation. */
  update(dt: number): string[] {
    this.mixer.update(dt);
    const fired: string[] = [];
    if (!this.current) return fired;
    const action = this.actions.get(this.current);
    const clip = this.clips.get(this.current);
    if (!action || !clip) return fired;

    this.elapsedInAnim += dt * Math.max(action.timeScale, 0);
    const dur = Math.max(clip.duration, 1e-4);
    this.normalizedTime = Math.min(this.elapsedInAnim / dur, 1);

    const track = getTrack(this.current);
    if (track) {
      this.cursor.notifyLoop(this.normalizedTime);
      for (const e of this.cursor.advance(track, this.normalizedTime)) fired.push(e);
    }
    if (!action.isRunning()) this.finished = true;
    else if (this.normalizedTime >= 1 && action.loop === THREE.LoopOnce) this.finished = true;
    return fired;
  }

  get currentAnim(): string | null {
    return this.current;
  }

  setRootMotionEnabled(): void {
    /* root motion is intentionally disabled; movement is code-driven */
  }

  dispose(): void {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.mixer.getRoot());
  }
}
