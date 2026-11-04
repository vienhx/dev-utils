# client-privacy Specification

## Purpose

Guarantees that the tool runs entirely in the user's browser, so pasted data never leaves the device and no usage is tracked.

## Requirements

### Requirement: All processing in the browser
Every step SHALL run in the browser. The app SHALL have no backend endpoints, and user input, outputs, and templates SHALL never be sent over the network.

#### Scenario: No requests while transforming
- **WHEN** the page has loaded and the user edits input, chains, and templates
- **THEN** the browser network log shows no new requests

### Requirement: Runtime requests blocked by policy
The site SHALL be served with a Content Security Policy that forbids script-initiated network connections and allows scripts, styles, fonts, and images only from the site's own origin (plus inline data images).

#### Scenario: Script tries to send data
- **WHEN** any script on the page calls `fetch` or opens an XHR, WebSocket, or beacon to any URL
- **THEN** the browser blocks the request under the Content Security Policy

#### Scenario: Third-party script blocked
- **WHEN** the page contains a script tag pointing to another origin
- **THEN** the browser refuses to load it

### Requirement: No tracking or third-party assets
The site SHALL include no analytics, telemetry, or third-party tracking, and SHALL load every asset, including fonts, from its own origin.

#### Scenario: Page load requests
- **WHEN** the page is loaded with an empty cache
- **THEN** every request in the network log goes to the site's own origin

### Requirement: Works offline after load
Once the page has loaded, all steps and templates SHALL keep working with the network disconnected.

#### Scenario: Network disconnected
- **WHEN** the page is loaded, the network is disconnected, and the user runs a chain
- **THEN** the output is computed normally
