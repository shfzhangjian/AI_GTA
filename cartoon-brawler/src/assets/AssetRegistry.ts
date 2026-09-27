/** Asset registry: logical ids -> local files + metadata. */

export interface RegisteredAsset {
  id: string;
  /** Local URL under /assets/... — never a remote CDN. */
  url?: string;
  kind: 'model' | 'audio';
  optional: boolean; // if true, missing file => procedural fallback (TODO Replace Asset)
}

export const ASSET_REGISTRY: Record<string, RegisteredAsset> = {
  heroModel: { id: 'heroModel', url: './assets/characters/soldier.glb', kind: 'model', optional: true },
  enemyModel: { id: 'enemyModel', url: './assets/enemies/soldier.glb', kind: 'model', optional: true },
};
