> **Current scope notice (2026-10-11): OUT OF SCOPE / DESIGN REFERENCE ONLY.** The current WoHo Browser release does not implement or authorize AI assistant, AI broker, agent, model, or AI service integration. Do not add dependencies, UI controls, or runtime code from this document as part of the current audit. Any future scope change requires an explicit product decision and a separate security/dependency review.

# WoHo AI DevKit Integration Specification

Status: Discovery/design only; no dependency review has been completed in this repository.

## Inventory before integration
Inspect the actual DevKit repository and package manifests. Record package names/versions, runtime, license, transitive dependencies, tools, filesystem/network capabilities, MCP behavior, and maintenance policy. Do not infer capabilities from the project name.

## Execution boundary
Never run the DevKit inside the privileged browser main process. Prefer a separate utility process or service with least privilege; a process boundary alone is not a sandbox. Route network access through a controlled broker.

## Tool manifest
Every tool needs a versioned identifier, JSON input/output schema, timeout, cancellation behavior, declared capabilities, and risk level. Unknown tools are denied. Browser policy, not model output, authorizes capabilities.

## Prohibited in initial integration
Raw cookie/password/token access, arbitrary shell, unrestricted filesystem access, silent network requests, or executing downloaded code. Exclude or replace such tools if the DevKit provides them.

Treat all MCP servers and tool results as untrusted. Pin and review versions, restrict destinations, validate schemas, and limit time and output. Integration is blocked until dependency/license review, tool manifest, process boundary, and regression tests are approved.