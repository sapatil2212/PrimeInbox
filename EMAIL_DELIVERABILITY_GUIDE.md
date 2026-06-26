# Email Deliverability Guide for PrimeInbox OTP Emails

## Overview
This guide helps you configure your email sending to ensure OTP emails land in the primary inbox instead of spam.

---

## 🚨 Critical Issues Fixed

### 1. **Subject Line Optimization**
- ✅ **Before:** "Verify Your PrimeInbox Account - Action Required"
- ✅ **After:** "{OTP} is your PrimeInbox verification code"
- **Why:** Gmail and other providers prefer OTP codes in subject lines for transactional emails

### 2. **Email Headers Cleaned**
- ❌ **Removed:** `Precedence: bulk` (marks email as marketing)
- ❌ **Removed:** `List-Unsubscribe` headers (not needed for OTP emails)
- ✅ **Added:** Proper transactional headers
- ✅ **Added:** Domain-specific Message-ID

### 3. **HTML Template Simplified**
- Removed complex gradients and shadows that trigger spam filters
- Added MSO (Microsoft Outlook) compatibility
- Improved mobile responsiveness
- Cleaner, more professional design

---

## 📧 DNS Records Configuration (CRITICAL!)

Without proper DNS records, your emails WILL go to spam regardless of content.

### For Gmail SMTP Users

Add these TXT records to your domain DNS:

#### SPF Record
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.google.com ~all
TTL: 3600
```

#### DKIM Record
1. Go to Google Admin Console → Apps → Gmail → Authenticate Email
2. Generate DKIM key
3. Add the provided CNAME record to your DNS

#### DMARC Record
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; pct=100; rua=mailto:contact.primeinbox@gmail.com; sp=quarantine; aspf=s;
TTL: 3600
```

---

### For SendGrid Users (Recommended for Production)

#### SPF Record
```
Type: TXT
Name: @
Value: v=spf1 include:sendgrid.net ~all
TTL: 3600
```

#### DKIM Records (SendGrid provides 3 CNAME records)
```
# Example - Get actual values from SendGrid dashboard
Type: CNAME
Name: s1._domainkey
Value: s1.domainkey.u12345678.wl123.sendgrid.net
TTL: 3600

Type: CNAME
Name: s2._domainkey
Value: s2.domainkey.u12345678.wl123.sendgrid.net
TTL: 3600

Type: CNAME
Name: em1234
Value: u12345678.wl123.sendgrid.net
TTL: 3600
```

#### DMARC Record
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; pct=100; rua=mailto:contact.primeinbox@gmail.com; sp=quarantine; aspf=s;
TTL: 3600
```

---

### For AWS SES Users

#### SPF Record
```
Type: TXT
Name: @
Value: v=spf1 include:amazonses.com ~all
TTL: 3600
```

#### DKIM Records (AWS SES provides 3 CNAME records)
Get these from AWS SES Console → Verified Identities → Your Domain → DKIM

#### DMARC Record
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; pct=100; rua=mailto:contact.primeinbox@gmail.com; sp=quarantine; aspf=s;
TTL: 3600
```

---

## 🔧 SMTP Configuration Best Practices

### Environment Variables (.env)

```bash
# Use a professional sender name (no emojis, no ALL CAPS)
SMTP_FROM="PrimeInbox"

# Use proper SMTP credentials
SMTP_HOST=smtp.gmail.com  # or your SMTP provider
SMTP_PORT=587  # TLS port (recommended)
SMTP_USER=noreply@yourdomain.com  # Use your actual domain
SMTP_PASS=your-app-specific-password

# Optional: BCC for monitoring
SMTP_BCC=

# Application URL (for links in emails)
APP_URL=https://yourdomain.com
```

### Important Notes:

1. **Never use free email providers for sending** (e.g., @gmail.com, @yahoo.com)
   - Use your own domain: noreply@yourdomain.com
   
2. **Enable 2FA and use App Passwords** (for Gmail)
   - Go to: https://myaccount.google.com/apppasswords
   
3. **Warm up your sending domain**
   - Start with low volume (10-20 emails/day)
   - Gradually increase over 2-4 weeks
   
4. **Monitor your sender reputation**
   - Check: https://www.mail-tester.com
   - Check: https://mxtoolbox.com/blacklists.aspx

---

## 📊 Testing Your Configuration

### 1. DNS Records Verification
```bash
# Check SPF
nslookup -type=TXT yourdomain.com

# Check DKIM
nslookup -type=TXT default._domainkey.yourdomain.com

# Check DMARC
nslookup -type=TXT _dmarc.yourdomain.com
```

### 2. Email Testing Tools

Visit **https://www.mail-tester.com**:
1. Send a test OTP email to the provided address
2. Check your spam score (aim for 8/10 or higher)
3. Review and fix any issues reported

### 3. Gmail Postmaster Tools

Sign up at: https://postmaster.google.com
- Monitor spam rate
- Check domain reputation
- Track authentication rates

---

## 🎯 Quick Wins for Immediate Improvement

### 1. ✅ Use Your Own Domain
Replace: `noreply@primeinbox.dev` or generic email
With: `noreply@youractual-domain.com`

### 2. ✅ Set Up DNS Records (Most Important!)
- SPF: Authorizes servers to send email
- DKIM: Cryptographic signature verification
- DMARC: Policy for handling failed authentication

### 3. ✅ Use a Reputable SMTP Provider
Recommended order:
1. **SendGrid** (best for production, free 100/day)
2. **AWS SES** (scalable, cheap, requires approval)
3. **Gmail SMTP** (good for development, 500/day limit)

### 4. ✅ Keep Content Simple
- Avoid spammy words: "FREE", "URGENT", "ACT NOW"
- No excessive styling or large images
- Include plain text version (already done)
- No URL shorteners or suspicious links

### 5. ✅ Enable HTTPS for Your Website
Email providers check if your domain has HTTPS

---

## 🚀 Deployment Checklist

Before going to production:

- [ ] Own domain purchased and configured
- [ ] DNS records (SPF, DKIM, DMARC) added and verified
- [ ] SMTP provider selected and configured
- [ ] Environment variables updated in production
- [ ] Test emails sent and checked with mail-tester.com
- [ ] Score 8/10 or higher on mail-tester
- [ ] Domain warmed up (gradual increase in sending volume)
- [ ] Monitoring set up (Gmail Postmaster, bounce tracking)

---

## 📞 Troubleshooting

### Emails still going to spam?

1. **Check DNS propagation** (can take 24-48 hours)
   ```bash
   nslookup -type=TXT yourdomain.com
   ```

2. **Verify SPF alignment**
   - Sending domain must match SPF record domain

3. **Check DKIM signing**
   - View email source in Gmail
   - Look for `DKIM: PASS`

4. **Review email content**
   - Run through mail-tester.com
   - Check spam score

5. **Monitor blacklists**
   - Check if your IP is blacklisted: https://mxtoolbox.com/blacklists.aspx

6. **Contact your SMTP provider**
   - They can check for delivery issues
   - May need to verify your domain

---

## 📚 Additional Resources

- [Google Email Sender Guidelines](https://support.google.com/mail/answer/81126)
- [SendGrid Deliverability Guide](https://sendgrid.com/blog/email-deliverability-guide/)
- [AWS SES Best Practices](https://docs.aws.amazon.com/ses/latest/dg/best-practices.html)
- [DMARC.org](https://dmarc.org/)

---

## 🎓 Understanding the Changes

### What We Fixed:

1. **Subject Line:** OTP codes in subject improve recognition as transactional emails
2. **Headers:** Removed bulk email markers that flag emails as marketing
3. **HTML:** Simplified design reduces spam trigger points
4. **Message-ID:** Domain-specific IDs improve sender reputation
5. **Content:** Clear, concise messaging without spam trigger words

### Why Emails Go to Spam:

- ❌ Missing/incorrect DNS records (SPF, DKIM, DMARC)
- ❌ Using free email addresses (gmail.com, yahoo.com)
- ❌ Bulk email headers on transactional emails
- ❌ Poor sender reputation
- ❌ Spammy content or excessive styling
- ❌ New/unwarmed domain
- ❌ Shared IP with bad reputation

---

## 💡 Pro Tips

1. **Use a dedicated IP** for high-volume sending (10k+ emails/day)
2. **Separate domains** for marketing vs transactional emails
3. **Monitor bounce rates** - high bounces hurt reputation
4. **Implement feedback loops** with email providers
5. **Keep a clean mailing list** - remove invalid addresses
6. **Set realistic expectations** - even with perfect setup, 1-2% may go to spam

---

**Need help?** Contact: contact.primeinbox@gmail.com

**Last Updated:** June 2026
