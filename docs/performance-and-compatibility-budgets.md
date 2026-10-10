# Performance and Website Compatibility Budgets

Status: Candidate targets only; measure on documented reference hardware before making them release gates.

Record CPU, RAM, storage, GPU/driver, Windows build, power mode, Electron version, and network for every benchmark.

| Metric | Initial target to validate | Method |
|---|---|---|
| Cold launch to usable chrome | p95 under 5 seconds | 20 clean launches |
| Warm launch | p95 under 3 seconds | 20 launches |
| Navigation feedback | under 150 ms | Instrumented test |
| Idle tab switch | p95 under 100 ms | Repeatable script |
| Idle CPU | Establish baseline first | Five-minute idle run |
| Memory | Record baseline and per-tab growth | 1, 5, 10 representative tabs |
| Smoke stability | All defined scenarios pass | CI and clean-machine tests |

These are hypotheses, not measured results. Maintain at least 20 representative sites covering redirects, OAuth, media, downloads, forms, SPAs, and documentation. Use authorized test accounts only.

Test renderer crash recovery, GPU failure behavior where supported, HiDPI, zoom, keyboard navigation, Narrator/NVDA, and offline/TLS/network failures. Record scripts, hardware, results, regressions, and exceptions per release.