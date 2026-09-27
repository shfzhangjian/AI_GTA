/** Asset types shared by manager + consumers. */

export interface LoadedModel {
  /** Scene root to clone per instance. */
  template: THREEObject3DLike;
  /** Animation clips found in the file (may be empty => fallback anims). */
  clips: { name: string; clip: AnimationClipLike }[];
  fromFile: boolean;
}

// Structural types so we don't leak three types everywhere if swapped later.
export interface THREEObject3DLike {
  clone: () => THREEObject3DLike;
}
export type AnimationClipLike = { name: string; duration: number };
