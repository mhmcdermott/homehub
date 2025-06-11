# Email Document Processing Setup

HomeHub now supports automatic document processing via email! Here's how to set it up:

## How It Works

1. **Email Forwarding**: Forward any email with document attachments to your unique HomeHub email address
2. **AI Processing**: Documents are automatically:
   - Categorized (Insurance, Warranty, Contract, etc.)
   - Tagged with relevant keywords
   - Given smart descriptions
   - Assigned expiry dates when applicable
3. **Instant Upload**: Documents appear in your HomeHub within seconds

## Supported Email Services

### SendGrid Inbound Parse (Recommended)
1. Sign up for SendGrid (free tier available)
2. Configure Inbound Parse webhook:
   - URL: `https://yourdomain.com/api/email/inbound`
   - Add your domain to SendGrid
   - Point MX records to SendGrid

### Alternative: Email Forwarding Services
- **Cloudflare Email Routing** (Free)
- **Gmail Filters** (Forward to webhook)
- **IFTTT Email Integration**

## Smart Document Recognition

The AI recognizes documents by:
- **Filename patterns**: "insurance_policy_2024.pdf" → Insurance category
- **Date extraction**: "MOT_Certificate_15-06-2024.pdf" → Sets expiry to June 2025
- **Content keywords**: Warranty, contract, medical, etc.

### Examples of Smart Recognition:
- `car_insurance_policy_2024.pdf` → Category: Insurance, Expiry: 1 year
- `warranty_macbook_pro.pdf` → Category: Warranty, Tags: [warranty, electronics]
- `tenancy_agreement_2024.pdf` → Category: Contract, Expiry: 1 year
- `blood_test_results_jan_2024.pdf` → Category: Medical, Tags: [health, medical, 2024]

## Security

- Only emails from your registered email addresses are accepted
- Documents are encrypted and stored securely
- Failed emails are logged but attachments are discarded

## Testing

Send a test email with a PDF attachment to your HomeHub email address. The document should appear in your dashboard within 30 seconds!

## Production Setup

For production deployment:
1. Set up a proper email receiving service (SendGrid, AWS SES, etc.)
2. Configure your domain's MX records
3. Update the webhook URL in your email service
4. Enable HTTPS for secure webhook reception