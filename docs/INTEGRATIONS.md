# NEXUS AI — Integrations Configuration Guide

NEXUS AI coordinates three external services:
1. **Lyzr Agent Studio** (Orchestration Manager & Specialists)
2. **Qdrant Cloud** (Shared Vector Memory)
3. **Omi Application** (Speech & Voice Intelligence Webhooks)

---

## 1. Lyzr Agent Studio Integration

Lyzr Agent Studio provides autonomous LLM agent execution and orchestration management.

### Configuration
1. Obtain your API Key from [studio.lyzr.ai](https://studio.lyzr.ai).
2. Create or copy your Manager Agent ID from the Lyzr dashboard.
3. Configure `backend/.env`:
   ```env
   LYZR_API_KEY=lyzr-prod-xyz...
   LYZR_AGENT_ID=your-agent-id-here
   LYZR_BASE_URL=https://agent-prod.lyzr.ai
   ```
4. Verify connectivity:
   Navigate to the **Integrations** tab in NEXUS AI and click **Test Lyzr API Ping**.

---

## 2. Qdrant Vector Cloud Integration

Qdrant powers long-term semantic memory retrieval for the swarm.

### Configuration
1. Create a cluster at [cloud.qdrant.io](https://cloud.qdrant.io).
2. Configure `backend/.env`:
   ```env
   QDRANT_URL=https://d99af7c1-3fa8-40d0-84c3-8212924e8fe6.eu-west-1-0.aws.cloud.qdrant.io
   QDRANT_API_KEY=your_qdrant_jwt_key
   QDRANT_COLLECTION=nexus_memory
   ```
3. NEXUS AI automatically initializes the `nexus_memory` collection with a 384-dimensional vector space and Cosine metric.
4. Test Qdrant connectivity directly in the **Integrations** or **Shared Memory** pages.

---

## 3. Omi Voice Intelligence & Webhooks

The Omi wearable / mobile companion streams speech transcriptions to NEXUS AI.

### Webhook Endpoints
- **Conversation Webhook**: `POST /api/v1/integrations/omi/conversation`
- **Real-time Webhook**: `POST /api/v1/integrations/omi/realtime`

### Security Verification
Incoming requests must include the secret header:
```http
x-omi-secret: nexus_omi_webhook_secret_key
```

### Local Testing with ngrok
```bash
ngrok http 8000
```
In your Omi dashboard, set the webhook URL to:
`https://<your-ngrok-subdomain>.ngrok-free.app/api/v1/integrations/omi/conversation`
