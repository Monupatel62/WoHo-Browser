# Android release signing

The Android debug APK is built on every CI run. A signed release AAB is built only when all release-signing secrets are configured; CI never creates an unsigned release bundle and never stores the keystore in the repository.

## Configure GitHub Actions secrets

Open **Settings → Secrets and variables → Actions → New repository secret** and add:

- `ANDROID_KEYSTORE_BASE64`: the Base64-encoded bytes of your existing Android upload/release keystore.
- `ANDROID_KEYSTORE_PASSWORD`: the keystore password.
- `ANDROID_KEY_ALIAS`: the private-key alias inside the keystore.
- `ANDROID_KEY_PASSWORD`: the private-key password.

Encode the keystore locally without uploading the original file to the repository. For example, on Linux/macOS:

```sh
base64 -w 0 woho-release.jks
```

On macOS, where `base64 -w` is unavailable:

```sh
base64 < woho-release.jks | tr -d '\\n'
```

Paste the resulting Base64 text into the `ANDROID_KEYSTORE_BASE64` secret. Do not paste the keystore or passwords into issues, pull requests, workflow files, or chat. Keep a secure offline backup of the keystore.

The CI job decodes the keystore into the runner's temporary directory, restricts file permissions, builds `bundleRelease`, verifies the AAB signature, and uploads the AAB as `woho-browser-android-release-aab`. The temporary keystore is not uploaded as an artifact.

If these secrets are absent, CI reports the release bundle as skipped and still runs debug build/tests. The Gradle build itself continues to reject release packaging without a valid keystore and all four required values.

**Important:** use the same signing key for updates to an already-published app. Do not generate a new key if the existing app has already been published with a different upload key without checking the Play Console signing setup first.
