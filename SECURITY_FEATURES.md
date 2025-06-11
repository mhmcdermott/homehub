# HomeHub Security Features

## Email Processing Security

### ✅ Authorized Senders Only
- **Whitelist**: Only emails from `mark@markmcdermott.me.uk` and `unturatatiana11@gmail.com` are processed
- **Automatic Rejection**: Any email from unauthorized senders is immediately deleted
- **No Data Retention**: Unauthorized emails are permanently removed from the Gmail inbox

### 🔒 Security Process Flow

1. **Email Arrives** at `homehub@markmcdermott.me.uk`
2. **Sender Verification**: Check if sender is in authorized list
3. **If Unauthorized**:
   - 🏷️ Label email as "HomeHub/Unauthorized" (audit trail)
   - 🗑️ Permanently delete email from Gmail
   - 📝 Log security event
   - ❌ No processing or data storage
4. **If Authorized**:
   - ✅ Extract attachments securely
   - 🤖 AI categorization and processing
   - 🏷️ Label as "HomeHub/Processed"
   - 📊 Store documents in secure database

### 🛡️ Security Logging

All email processing includes security monitoring:
- Count of unauthorized emails deleted
- Audit trail of all processing activities
- Error tracking and monitoring
- No sensitive data in logs

### 🔐 Data Protection

- **Gmail Service Account**: Read-only access with domain-wide delegation
- **Encryption**: All document storage is encrypted
- **Access Control**: Only authenticated users can access their documents
- **No Webhooks**: Direct Gmail API access (more secure than email forwarding)

### 🚨 Security Alerts

The system provides real-time security information:
- Processing summaries include security status
- UI shows "Only accepts emails from approved addresses"
- Clear indication that unauthorized emails are deleted
- No notification to unauthorized senders (silent deletion)

## Additional Security Measures

### Authentication
- Google OAuth2 with restricted email access
- NextAuth.js session management
- Secure JWT tokens

### File Handling
- File type validation
- Size limits (10MB per file)
- Secure file storage with user isolation
- No executable file processing

### Database Security
- Parameterized queries (no SQL injection)
- User data isolation
- Encrypted connections
- Regular backup procedures

## Privacy Compliance

- **GDPR Ready**: User consent for document processing
- **Data Minimization**: Only necessary data is stored
- **Right to Deletion**: Users can delete their data
- **No Third-Party Sharing**: Documents stay within HomeHub

## Monitoring & Auditing

### Real-time Monitoring
- Processing success/failure rates
- Security event logging
- Performance metrics
- Error tracking

### Audit Trail
- All document uploads logged
- Email processing history
- User authentication events
- Security incidents recorded

This security model ensures that HomeHub is enterprise-grade secure while remaining simple to use for authorized family members.