# WoHo Browser

WoHo Browser is a planned WoHoTech desktop browser focused on dependable browsing, privacy-conscious design, and an optional AI assistant.

## Project status

**Planning and specification stage.** Features in the roadmap are proposals until implementation and test evidence confirms them. The repository does not yet contain the actual browser implementation.

## Master plan

- [Master product plan](docs/WOHO_BROWSER_MASTER_PLAN.md)
- [Feature requirements and acceptance criteria](docs/feature-requirements.md)
- [Proposed architecture](docs/architecture.md)
- [Security model](docs/security-model.md)
- [Threat model](docs/threat-model.md)
- [Privacy requirements](docs/privacy.md)
- [Testing and release gates](docs/testing-and-release.md)
- [Business validation plan](docs/monetization-and-validation.md)

## Proposed initial stack

- Electron + TypeScript + React, subject to a documented technical decision
- Chromium-based rendering through the selected framework
- Optional AI integration through a controlled broker
- GitHub Actions for CI and security checks

## Important

This repository is in planning. The README does not claim that the browser or listed features have been implemented. Do not treat the product as production-ready until implementation, security review, tests, packaging, update verification, and release checks are complete.
