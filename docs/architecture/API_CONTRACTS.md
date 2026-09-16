# API contracts — RakshAI MVP

Interns: use these shapes to build UI with mock data **before** the real endpoints land. When the real route ships, swap your mock for a `fetch`. This means no one is ever blocked.

---

## Auth

Handled by NextAuth. Sign in from the client with:

```ts
import { signIn } from "next-auth/react";
await signIn("credentials", { email, password, redirect: false });
```

Session on the client:

```ts
import { useSession } from "next-auth/react";
const { data: session } = useSession();
// session.user.role -> "BUYER" | "VENDOR"
```

---

## POST /api/register

Create a new user.

**Request**
```json
{
  "name": "Priya Sharma",
  "email": "priya@acme.com",
  "password": "atleast8chars",
  "role": "BUYER",
  "company": "Acme Corp"
}
```

**Responses**
- `201` → `{ "ok": true }`
- `409` → `{ "error": "An account with this email already exists" }`
- `400` → `{ "error": "Validation failed", "details": { ... } }`

---

## GET /api/vendors

List all vendors. Buyer only.

**Response `200`**
```json
{
  "vendors": [
    {
      "id": "clx...",
      "name": "CloudFlow Systems",
      "domain": "cloudflow.io",
      "category": "Cloud Infrastructure",
      "riskTier": "HIGH",
      "aiExposure": 78,
      "status": "PENDING_REVIEW",
      "updatedAt": "2026-07-03T10:00:00.000Z",
      "nda": { "accepted": false },
      "questionnaire": { "submitted": false }
    }
  ]
}
```

`riskTier` ∈ `LOW | MEDIUM | HIGH | CRITICAL`
`status` ∈ `DISCOVERED | INVITED | NDA_SIGNED | QUESTIONNAIRE_SENT | PENDING_REVIEW | APPROVED | REMEDIATION | OFFBOARDED`

---

## POST /api/vendors

Create a vendor. Buyer only.

**Request**
```json
{
  "name": "New Vendor Inc",
  "domain": "newvendor.com",
  "category": "SaaS",
  "riskTier": "MEDIUM",
  "aiExposure": 40
}
```
Only `name` is required.

**Response `201`** → `{ "vendor": { ... } }`

---

## GET /api/vendors/[id]

Vendor detail, including nested nda, questionnaire, riskSummary.

**Response `200`** → `{ "vendor": { ...full object } }`
**Response `404`** → `{ "error": "Vendor not found" }`

---

## PATCH /api/vendors/[id]

Update a vendor (e.g. change status after approval). Buyer only.

**Request** (any subset)
```json
{ "status": "APPROVED", "riskTier": "LOW" }
```

**Response `200`** → `{ "vendor": { ...updated } }`

---

## Mock data snippet

Drop this into any component while the API is being built:

```ts
const MOCK_VENDORS = [
  { id: "1", name: "CloudFlow Systems", domain: "cloudflow.io", category: "Cloud Infrastructure", riskTier: "HIGH", aiExposure: 78, status: "PENDING_REVIEW", updatedAt: new Date().toISOString() },
  { id: "2", name: "DataMint Analytics", domain: "datamint.com", category: "Data & Analytics", riskTier: "MEDIUM", aiExposure: 45, status: "APPROVED", updatedAt: new Date().toISOString() },
  { id: "3", name: "SecurePay Gateway", domain: "securepay.com", category: "Payments", riskTier: "CRITICAL", aiExposure: 22, status: "QUESTIONNAIRE_SENT", updatedAt: new Date().toISOString() },
];
```
