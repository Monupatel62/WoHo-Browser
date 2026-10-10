# Telemetry and Product Measurement Policy

Status: Off by default; this document authorizes no telemetry implementation.

Browsing history, URLs, page contents, prompts, cookies, credentials, and form values must not be collected as product analytics.

Use local test results and opt-in tester feedback where practical. Crash and update success can be measured in controlled CI/release test runs without production browsing tracking.

Before any remote diagnostics, publish exact fields, purpose, destination, retention, access controls, and deletion path; obtain clear opt-in; provide opt-out; exclude sensitive content by default; and test that opt-out stops collection.

Weekly active testers should be measured through voluntary study participation or privacy-preserving aggregate measurement only after approval. Do not add hidden tracking to populate metrics.