# Third-party character asset / 角色素材说明

## Vanguard / Soldier

The AI opponents use the complete Vanguard character from the Three.js Soldier example, credited there to Mixamo. The original mesh, skin, textures, and Idle/Walk/Run animation clips are preserved. SUNFALL adds weapon attachment, procedural arm IK, stair foot placement, recoil, hit reaction, and a non-physical death pose.

- Official example and attribution: https://threejs.org/examples/webgl_animation_skinning_blending.html
- Official source asset location: https://threejs.org/examples/models/gltf/Soldier.glb
- Adobe Mixamo usage FAQ: https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html
- Download verified 2026-10-03. SHA-256: dfb230fc1f942f259dd00281a1186953ad602fc5d69067ce63e24b2aa439736b
- Required local runtime path: dist/assets/vanguard.glb

Adobe's FAQ permits characters and animations in personal, commercial and nonprofit projects, including video games and rendered art. This asset is included in the deployed game only as needed to run the game. It is not offered as a standalone download, assigned an open-source license, or included in the downloadable source-code ZIP. Three.js's MIT license applies to its software, not automatically to separately credited character art.

To run the source ZIP locally, obtain the model through its official source under the applicable usage terms, then save it at the runtime path above. Do not redistribute the raw model as a standalone asset or imply it is original SUNFALL artwork. If your intended distribution requires independently redistributable art, replace the character with a model you have permission to redistribute and adapt the rig mappings in vanguard.js.

## Three.js

Three.js r180 and its matching GLTFLoader, SkeletonUtils and helper modules are distributed under MIT. See dist/vendor/THREE-LICENSE.txt. Addon import paths are changed to use the locally bundled Three module; no runtime CDN is required.

## Original SUNFALL work

Environment geometry, weapons and first-person hands are original code-defined assets. Concrete, brick, asphalt and painted-metal textures were generated for this project. Audio is synthesized locally. These are separate from the Mixamo character.
