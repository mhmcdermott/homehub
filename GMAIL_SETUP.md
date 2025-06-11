# Gmail Integration Setup

## Step 1: Create Gmail Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Enable the Gmail API:
   - Go to "APIs & Services" → "Library"
   - Search for "Gmail API"
   - Click "Enable"

4. Create a service account:
   - Go to "IAM & Admin" → "Service Accounts"
   - Click "Create Service Account"
   - Name: "HomeHub Gmail Processor"
   - Click "Create and Continue"
   - Skip roles for now
   - Click "Done"

5. Create credentials:
   - Click on your service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Select "JSON"
   - Download the key file

## Step 2: Enable Domain-Wide Delegation

1. In your service account settings:
   - Check "Enable Google Workspace Domain-wide Delegation"
   - Note the "Client ID" (you'll need this)

2. In Google Workspace Admin Console:
   - Go to Security → API Controls → Domain-wide Delegation
   - Click "Add new"
   - Enter the Client ID from your service account
   - OAuth Scopes:
     ```
     https://www.googleapis.com/auth/gmail.readonly,https://www.googleapis.com/auth/gmail.modify
     ```
   - Click "Authorize"

## Step 3: Configure Environment Variables

From your downloaded JSON key file, copy the private key and update .env.local:

```bash
GMAIL_SERVICE_EMAIL="homehub@markmcdermott.me.uk"
GMAIL_SERVICE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
GMAIL_PROCESSOR_API_KEY="generate-a-secure-random-string"
```

## Step 4: Test the Integration

1. Send an email with PDF attachments to `homehub@markmcdermott.me.uk`
2. In HomeHub, go to Documents page
3. Click "Check Now" button
4. Documents should appear automatically!

## Step 5: Automated Processing (Optional)

Set up a cron job to check emails every 5 minutes:

```bash
# Add to your server's crontab
*/5 * * * * curl -X POST -H "x-api-key: YOUR_API_KEY" https://yourdomain.com/api/email/process-gmail
```

## How It Works

1. **Email Monitoring**: Service checks for unread emails with attachments
2. **Smart Processing**: AI categorizes documents based on filename and content
3. **Auto-filing**: Documents are automatically tagged and organized
4. **Email Management**: Processed emails are marked as read and labeled

## Security Notes

- Service account has read-only access to Gmail
- Only emails from authorized senders are processed
- Attachments are processed locally and securely stored
- Failed emails are logged but not stored

## Troubleshooting

- **"Access denied"**: Check domain-wide delegation is enabled
- **"Scope not authorized"**: Verify OAuth scopes in Admin Console
- **"Key error"**: Ensure private key is properly formatted in .env.local