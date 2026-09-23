# Runtime Environment Contract

Runtime authority: `.agents/contracts/runtime-environment-contract.md`

This contract defines local runtime defaults for BaWe execution. It does not
change product scope and must not be copied into client delivery.

## Workspace Runtime

Use the workspace runtime directory for shared tool dependencies:

```text
[WORKSPACE_ROOT]/.bawe-runtime/
```

Do not install shared browser/runtime dependencies inside client project folders
unless the project itself declares them as product dependencies.

## Package Manager Commands

Use plain `npm` and `npx` resolved from PATH.

This workspace runs on Linux: there is no PowerShell `.ps1` shim resolution
issue here, so `npm.cmd`/`npx.cmd` do not exist and are not needed.

## Playwright Browsers

Before running Playwright browser automation, set:

```text
PLAYWRIGHT_BROWSERS_PATH=[WORKSPACE_ROOT]/.bawe-runtime/ms-playwright
```

Prefer Chromium from that path; `npx playwright install` resolves the correct
binary for the current OS/arch automatically. On Debian/Ubuntu, headless
Chromium needs system libraries that are not bundled with the browser
download — run:

```text
npx playwright install --with-deps chromium
```

Verified end-to-end on Ubuntu 24.04.5 (launch, load a page, read content,
close): `--with-deps` installs everything needed via apt with no manual step.
This is the confirmed default path — prefer it over the system-browser
fallback below.

If the shared Chromium binary is unavailable, fall back to an installed
system browser:

```text
/usr/bin/google-chrome
/usr/bin/chromium-browser
/usr/bin/chromium
```

None of these ship by default on a stock Ubuntu image — verified on 24.04.5,
none of the three resolve on a fresh install. Only rely on this fallback if
one of these packages was explicitly `apt install`-ed; do not assume it is
present.

If neither shared Chromium nor a system browser is usable, then install browser
dependencies into `[WORKSPACE_ROOT]/.bawe-runtime/`, not into a client project.

## Protected Zip Tool

For password-protected delivery zips, prefer an installed `7z` command when
available. If `7z` is not on PATH, resolve the workspace runtime's bundled
binary through the `7zip-bin` package's JS API instead of a hardcoded path —
it ships separate binaries per OS/arch:

```js
require('7zip-bin').path7za
```

On a Linux x64 runtime this resolves to
`[WORKSPACE_ROOT]/.bawe-runtime/node_modules/7zip-bin/linux/x64/7za` (no
`.exe`). Verified on Ubuntu 24.04.5: the API call resolves to that exact path,
the binary exists, and it runs via `execFileSync` with no permission errors
(no `chmod` needed).

Do not rely on a `Compress-Archive`-style tool for final delivery packages
that require a password; use an AES-capable zip command
(`7z a -tzip -mem=AES256 -p<password> ...`) instead.

## Docker

Docker CLI and Docker Compose may require elevated permissions on Windows.
If Docker is required for validation and the daemon or config is inaccessible,
record the exact permission failure and rerun with the allowed elevated path
when available.

Do not treat host Node checks as equivalent to Docker runtime readiness for an
executable product.
