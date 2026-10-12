# ADR-0005: Project License and Third-Party Notices

**Status:** Selected — MIT License for original WoHo Browser code.  
**Decision date:** 2026-10-12.

## Decision

Use the MIT License for original project code that the copyright holder is entitled to license. It is a permissive license suitable for a public project and permits commercial reuse subject to retaining the required copyright and permission notice.

The root `LICENSE` file records the project copyright notice. This selection does **not** relicense Electron/Chromium, npm packages, Android libraries, fonts, icons, codecs, or other third-party material; their own license terms and notices continue to apply.

## Release conditions

- Audit the generated runtime dependency inventory, resolve every unresolved license/notice item, and include the exact packaged Electron/Chromium notice.
- Keep third-party license text and the SBOM with release evidence.
- Confirm that the copyright holder has the rights needed for original code and that any outside contributions can be distributed under MIT before publishing a public release.
- This ADR is a project decision record, not legal advice for third-party materials.
