# Update and Signing Design Requirements

**Status:** Signing automation is implemented as a guarded tag-triggered draft-release workflow. A production auto-updater is not implemented and remains a separate release blocker.

## Signing workflow

Workflow: `.github/workflows/signed-release.yml`. Pushing a `v*` tag starts a legal preflight, signs the Windows installer and Android APK/AAB, verifies their signatures, produces SHA-256 manifests, and creates a **draft GitHub release** for inspection. It does not publish the release automatically.

The workflow intentionally fails closed when the project `LICENSE` is absent, package-license review remains unresolved, or Electron/Chromium bundled notices are missing. Do not bypass these checks or publish an artifact with unresolved license notices.

## Required GitHub Actions secrets

Configure these in **Repository → Settings → Secrets and variables → Actions**. Never commit key files, PFX files, passwords, or base64 contents.

| Secret | Purpose |
|---|---|
| `WIN_CSC_LINK` | Base64-encoded CA-issued Windows code-signing `.pfx` certificate |
| `WIN_CSC_KEY_PASSWORD` | Password for the Windows signing certificate |
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded Android release keystore |
| `ANDROID_KEYSTORE_PASSWORD` | Android keystore password |
| `ANDROID_KEY_ALIAS` | Alias for the Android release key |
| `ANDROID_KEY_PASSWORD` | Android release-key password |

For Windows code signing, obtain a trusted code-signing certificate from a suitable provider (or an available trusted signing service). A self-signed certificate can prove a signature technically but does not establish a trusted publisher identity for users.

For Android, generate and securely back up the release key once. Example command, run on the owner's trusted computer:

```sh
keytool -genkeypair -v -keystore woho-browser-release.jks \
  -alias woho-browser-release -keyalg RSA -keysize 4096 -validity 10000
```

Convert the keystore/certificate files to base64 locally and add the resulting strings as GitHub Actions secrets. Keep an offline secure backup of the Android keystore. Losing the signing key can prevent compatible future Android updates. Do not paste private keys or passwords into this chat.

## Release guarantees

- Android Gradle release packaging fails if release signing credentials are missing.
- Workflow verifies the Windows installer with Authenticode and verifies the Android AAB/APK signatures.
- Both platforms' packages receive version metadata derived from the release tag / CI run.
- SHA-256 manifests, signing evidence, third-party notices and license inventory are included with draft release assets.
- Release workflow uses least-privilege `contents: write` and creates a draft release; a person must inspect and publish it.

## Remaining non-automation decisions

- MIT is selected for original project code in ADR-0005 and a root `LICENSE` file is present. Before publication, verify copyright/contributor rights and finish all flagged third-party license reviews; this does not alter upstream component licenses.
- Any dependency packages flagged by the generated license inventory must be reviewed, and the shipped Electron/Chromium license HTML must be located and included before release.
- An authenticated updater, anti-downgrade policy, key rotation and rollback/failed-update behavior are not implemented. Do not claim automatic updates or a production-ready update channel until these tests and design decisions are complete.

The signing credentials are intentionally not generated or added by CI. Secrets and certificate ownership must remain under the project's owner-controlled accounts.
