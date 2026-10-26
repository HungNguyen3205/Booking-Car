# Cleanup and AI context

The previous README described a procedural Three.js paper-ticket architecture while the live homepage had moved to image layers. Source also contained an alternate legacy hero selected by URL, duplicated scenery/vehicle registries, 28 procedural 3D files, old reports, debug screenshots and scripts. Those are concrete sources of ambiguity and unnecessary reading for an AI assistant.

Removed:

- Entire src/components/danava-go/3d (28 files); there were no GLB/GLTF model files.
- three, @react-three/fiber, @types/three dependencies and obsolete Vite chunk configuration.
- Legacy hero and its unused scene/vehicle components and configuration registries.
- Unused template assets/styles, historical QA screenshot copies, obsolete capture/generation scripts, unreferenced runtime images. One current verification script remains.
- Old conflicting docs replaced with this report and hero.md; README now describes current code.

Added root AGENTS.md with a narrow source map and invariants; .rgignore excludes binary image folders and generated output from default text search. Explicit asset audits can use rg --no-ignore. User-local installed skills and global Antigravity settings were not changed.

Before cleanup, tracked src/public/docs/scripts contained about 72.3 MB, including 51 docs/screenshots (~39.9 MB) and 79 source files. After cleanup, runtime/public has 15 files (~11.2 MB), source 37 files (~420 KB), one QA script and two concise docs. The old code and screenshots remain recoverable in Git history. No history rewrite was performed; these figures do not mean the full Git clone history shrank.

No Antigravity timing/token telemetry was available. It is therefore not possible to prove exact latency savings or claim reading files was the only cause. These changes reduce current checkout size and remove conflicting architectural instructions. Long chats, provider/network delays and agent settings can still affect latency. Avoid asking an AI to reread the entire repository and every installed skill each step; refer it to AGENTS.md and the affected component.


The visual refinement replaces the two original miniature-landmark atlases with one panoramic city-bank atlas and one separate HCM bank with a complete tower crown. Asset count stays the same; this revision prioritizes natural scale and continuous city context. No 3D dependency was restored.
