/** FPS 统计（写入 window.__UE_DEBUG__.fps） */
export function attachFpsCounter(getFpsTarget: () => { fps: number }): void {
  let frames = 0;
  let last = performance.now();
  function tick(now: number): void {
    requestAnimationFrame(tick);
    frames++;
    if (now - last >= 500) {
      getFpsTarget().fps = Math.round((frames * 1000) / (now - last));
      frames = 0;
      last = now;
    }
  }
  requestAnimationFrame(tick);
}
