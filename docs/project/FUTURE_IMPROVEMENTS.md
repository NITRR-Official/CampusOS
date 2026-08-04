# Future Architectural Improvements

This document tracks technical debt, scaling strategies, and security upgrades that should be implemented as CampusOS grows into a larger, enterprise-grade system.

## Authentication & Security

### 1. Upgrade JWT to Asymmetric Cryptography (RS256)

**Current State:** The system uses `HS256` (symmetric cryptography) for JWT generation and verification in `jwt-authenticator.js`. The same secret is used to sign and verify tokens.
**The Risk/Limitation:** As we split the backend into microservices, or if the Next.js frontend needs to verify tokens independently without calling the backend, sharing the symmetric secret becomes a security risk.
**The Upgrade Path:**

- Generate an RSA Private/Public key pair.
- Update `jwt-authenticator.js` to sign tokens using the Private Key (`RS256`).
- Expose a `.well-known/jwks.json` endpoint so other services and clients can fetch the Public Key to verify tokens independently.
- This creates a zero-trust architecture where services can verify identity without needing access to the signing secret.

## Core Architecture (Pub/Sub)

### 2. Event Bus Persistence (Message Broker)

**Current State:** The system uses an in-memory Node.js `EventEmitter` (`backend/src/core/event-bus.js`) for cross-plugin communication.

- **Resolved**: We recently wrapped emissions in `setImmediate` (to fix synchronous blocking) and `structuredClone` (to fix payload mutability).
  **The Risks/Limitations:**
- **No Persistence:** If the server crashes, unprocessed events in the event loop are lost forever. We lack guaranteed delivery across distributed instances.

**The Upgrade Path:**

- **Long-Term (Message Broker):** As the monolith scales or breaks into microservices, replace the internal `EventEmitter` with a distributed message broker (e.g., Redis Pub/Sub, RabbitMQ, or Kafka). This provides guaranteed delivery, asynchronous processing, horizontal scaling, and persistence.

## V2 Enterprise Features (Post V1 Launch)

### 3. The "Enterprise Engine" (Node-Based Workflows)

- **Visual Workflow Builder:** Integrate `React Flow` to allow club admins to build custom drag-and-drop operational pipelines (e.g., Custom Recruitment Drives).
- **FSM Backend:** Build a Finite State Machine backend that executes workflows and handles conditional branches securely.
- **Node-Level RBAC:** Allow admins to hide specific workflow nodes from certain roles to ensure strict atomic privacy.

### 4. The "Fintech Expansion"

- **Payment Gateway Integration:** Allow the `event` plugin to handle ticket sales natively and collect platform fees (2-5% cut).

### 5. The "Corporate Connection" (Placements)

- **Verifiable Co-Curricular Transcripts:** Because CampusOS atomically tracks RBAC roles and completed tasks, generate cryptographically secure PDFs proving a student's leadership and soft skills.
- **Recruiter B2B Portal:** Allow corporate recruiters to headhunt top talent directly from the platform, creating a highly lucrative monetization stream.
