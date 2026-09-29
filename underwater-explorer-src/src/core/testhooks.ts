/**
 * 测试自动化钩子（仅 ?test=1 时安装）：暴露键盘注入接口，供无头运行时验证。
 * 不属于游戏功能，只服务测试。
 */
export interface TestHooks {
  press(code: string): void;
  release(code: string): void;
}

export function installTestHooks(): void {
  const hooks: TestHooks = {
    press(code) {
      window.dispatchEvent(new KeyboardEvent('keydown', { code }));
    },
    release(code) {
      window.dispatchEvent(new KeyboardEvent('keyup', { code }));
    },
  };
  (window as unknown as { __UE_TEST__: TestHooks }).__UE_TEST__ = hooks;
}
