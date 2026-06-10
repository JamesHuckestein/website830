# AWS Email Setup — KoC Council 830

This document covers the one-time AWS steps required to enable real email delivery from the website.

## Architecture

```
Frontend  →  FastAPI backend  →  API Gateway  →  Lambda  →  SES  →  recipient
```

The backend calls the API Gateway endpoint with `{ "to", "subject", "body" }`. Lambda forwards the message through SES using a verified sender address.

---

## Step 1: Verify a sender address in SES

1. Open the [SES console](https://console.aws.amazon.com/ses/home?region=us-east-1) in us-east-1.
2. Go to **Verified identities** → **Create identity**.
3. Choose **Email address** and enter the address the council will send from (e.g. `noreply@koc830.org` or a Gmail you control for testing).
4. Click the verification link that arrives in that inbox.

> **Sandbox note:** New SES accounts start in sandbox mode, where you can only send *to* verified addresses. To send to council members' real addresses, submit a production access request via **Account dashboard → Request production access**.

---

## Step 2: Create the Lambda function

1. Open the [Lambda console](https://console.aws.amazon.com/lambda/home?region=us-east-1) in us-east-1.
2. Click **Create function** → Author from scratch.
   - **Function name:** `koc830-email-handler`
   - **Runtime:** Python 3.12
   - **Architecture:** x86_64
3. After creation, paste the contents of `backend/lambda/email_handler.py` into the inline code editor (or deploy as a zip — see below).
4. Under **Configuration → Environment variables**, add:
   - `FROM_ADDRESS` = the address you verified in Step 1 (e.g. `noreply@koc830.org`)
5. Under **Configuration → Permissions**, ensure the execution role has the `ses:SendEmail` permission. Add this inline policy to the role:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Action": "ses:SendEmail",
       "Resource": "*"
     }]
   }
   ```

### Deploying as a zip (alternative to inline editor)

```bash
cd backend/lambda
zip email_handler.zip email_handler.py
aws lambda update-function-code \
  --function-name koc830-email-handler \
  --zip-file fileb://email_handler.zip \
  --region us-east-1
```

---

## Step 3: Create the API Gateway endpoint

1. Open the [API Gateway console](https://console.aws.amazon.com/apigateway/home?region=us-east-1).
2. Click **Create API** → **HTTP API** → **Build**.
3. Add an integration:
   - **Integrations:** Lambda
   - **Lambda function:** `koc830-email-handler`
4. Configure routes:
   - **Method:** POST
   - **Path:** `/send-email`
5. Click **Next** through stages (use `$default`), then **Create**.
6. Copy the **Invoke URL** shown on the API detail page. It looks like:
   `https://abc123xyz.execute-api.us-east-1.amazonaws.com/send-email`

---

## Step 4: Configure the backend

Set the `EMAIL_GATEWAY_URL` environment variable to the invoke URL from Step 3.

**For local dev** (`.env` or shell):
```bash
export EMAIL_GATEWAY_URL=https://abc123xyz.execute-api.us-east-1.amazonaws.com/send-email
```

**For production** (EC2 / ECS / systemd service), add it to the environment of the process running uvicorn.

When `EMAIL_GATEWAY_URL` is not set, the backend logs the email to stdout instead of sending it (safe default for local development).

---

## Step 5: Update member email addresses

The `docs/schema.json` file currently uses placeholder `@koc830.org` addresses for members. Update each member's `email` field with their actual email address before enabling email delivery in production.

---

## Step 6: Test end-to-end

1. Start both servers: `./scripts/start.sh`
2. Log in as an officer (member `8301002` / `charity830`).
3. Go to **Members → Officers** and send a message to the Grand Knight.
4. Verify the email arrives at the Grand Knight's address.
5. Go to **Members → Member List → Email Members** and send a test message.
6. Verify all members receive the email.

---

## Email subjects by endpoint

| Endpoint | Subject |
|---|---|
| `POST /emails/officer` | `Message from {sender name}` |
| `POST /nominations` | `Knight and Family of the Month Nomination` |
| `POST /emails/all-members` | `Message from Council 830 Officers` |
