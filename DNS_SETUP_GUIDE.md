# 🌐 DNS Configuration Step-by-Step Guide

## Overview
This guide will walk you through setting up SPF, DKIM, and DMARC records to ensure your emails land in the inbox.

**Time Required:** 30-45 minutes  
**Difficulty:** Beginner-friendly  
**Impact:** Moves emails from Spam → Inbox ✅

---

## Prerequisites

Before you start, you need:
- [ ] Access to your domain registrar account (GoDaddy, Namecheap, Cloudflare, etc.)
- [ ] Your SMTP provider chosen (Gmail, SendGrid, AWS SES, etc.)
- [ ] Admin access to email provider dashboard (for DKIM setup)

---

## Part 1: Add SPF Record (10 minutes) 🔴 CRITICAL

### What is SPF?
SPF (Sender Policy Framework) tells receiving mail servers which IP addresses are allowed to send emails from your domain.

### Step-by-Step Instructions

#### For Gmail Users:

1. **Log in to your domain registrar** (where you bought your domain)

2. **Navigate to DNS Management**
   - GoDaddy: "DNS" → "Manage Zones"
   - Namecheap: "Domain List" → "Manage" → "Advanced DNS"
   - Cloudflare: "DNS" → "Records"

3. **Add a new TXT record**
   - **Type:** TXT
   - **Name/Host:** @ (or leave blank, or use your domain name)
   - **Value/Content:** `v=spf1 include:_spf.google.com ~all`
   - **TTL:** 3600 (or Auto)

4. **Click Save/Add Record**

#### For SendGrid Users:

```
Type: TXT
Name: @
Value: v=spf1 include:sendgrid.net ~all
TTL: 3600
```

#### For Amazon SES Users:

```
Type: TXT
Name: @
Value: v=spf1 include:amazonses.com ~all
TTL: 3600
```

#### For Mailgun Users:

```
Type: TXT
Name: @
Value: v=spf1 include:mailgun.org ~all
TTL: 3600
```

#### For Multiple Providers (Advanced):

If you use multiple email services:

```
Type: TXT
Name: @
Value: v=spf1 include:_spf.google.com include:sendgrid.net ~all
TTL: 3600
```

### Verification

After adding, verify your SPF record:

1. Wait 5-10 minutes for propagation
2. Visit: https://mxtoolbox.com/spf.aspx
3. Enter your domain name
4. Check that it shows "PASS"

**Common Issues:**
- Multiple SPF records (only one allowed) - combine them
- Wrong syntax - copy exactly as shown above
- Takes time to propagate - wait 15-30 minutes

---

## Part 2: Configure DKIM (15 minutes) 🔴 CRITICAL

### What is DKIM?
DKIM (DomainKeys Identified Mail) adds a digital signature to your emails to verify they haven't been tampered with.

### For Gmail/Google Workspace:

1. **Go to Google Admin Console**
   - Visit: https://admin.google.com
   - Login with admin account

2. **Navigate to Gmail Authentication**
   - Apps → Google Workspace → Gmail
   - Click "Authenticate email"

3. **Generate DKIM Key**
   - Click "Generate New Record"
   - Select "2048-bit key" (recommended)
   - Copy the TXT record details

4. **Add to DNS**
   ```
   Type: TXT
   Name: google._domainkey
   Value: (paste the long string Google provided)
   TTL: 3600
   ```

5. **Activate in Google**
   - Return to Google Admin Console
   - Click "Start Authentication"

### For SendGrid:

1. **Login to SendGrid Dashboard**
   - Visit: https://app.sendgrid.com

2. **Navigate to Sender Authentication**
   - Settings → Sender Authentication
   - Click "Authenticate Your Domain"

3. **Follow the Wizard**
   - Enter your domain name
   - Select your DNS provider
   - SendGrid will generate 3 CNAME records

4. **Add ALL 3 Records to DNS**
   ```
   Type: CNAME
   Name: s1._domainkey
   Value: (provided by SendGrid)
   TTL: 3600

   Type: CNAME
   Name: s2._domainkey
   Value: (provided by SendGrid)
   TTL: 3600

   Type: CNAME
   Name: em1234
   Value: (provided by SendGrid)
   TTL: 3600
   ```

5. **Verify in SendGrid**
   - Click "Verify" after adding records
   - Wait for green checkmarks

### For Amazon SES:

1. **Go to AWS SES Console**
   - Visit: https://console.aws.amazon.com/ses/

2. **Verify Domain**
   - Configuration → Verified identities
   - Click "Create identity"
   - Select "Domain"

3. **Add DNS Records**
   - AWS will show 3 CNAME records
   - Add all of them to your DNS

   ```
   Type: CNAME
   Name: _domainkey.yourdomain.com
   Value: (provided by AWS)
   TTL: 3600
   
   (Add all 3 records AWS provides)
   ```

4. **Wait for Verification**
   - Status will change to "Verified" (can take up to 72 hours)

### For Mailgun:

1. **Login to Mailgun**
   - Visit: https://app.mailgun.com

2. **Go to Sending Domains**
   - Sending → Domains
   - Click your domain

3. **View DNS Records**
   - Mailgun shows required DKIM records

4. **Add to DNS**
   ```
   Type: TXT
   Name: mailo._domainkey
   Value: (provided by Mailgun)
   TTL: 3600
   ```

### Verification

After adding DKIM records:

1. Wait 15-30 minutes for propagation
2. Use provider's verification button
3. Or test at: https://dkimcore.org/tools/

---

## Part 3: Add DMARC Record (5 minutes) 🟡 IMPORTANT

### What is DMARC?
DMARC (Domain-based Message Authentication, Reporting & Conformance) tells receiving servers what to do if SPF or DKIM checks fail.

### Step-by-Step:

1. **Go to DNS Management** (same place as SPF)

2. **Add a new TXT record**

   **For Production (Strict):**
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=quarantine; rua=mailto:contact.primeinbox@gmail.com; ruf=mailto:contact.primeinbox@gmail.com; fo=1; pct=100; adkim=s; aspf=s
   TTL: 3600
   ```

   **For Testing (Relaxed):**
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:contact.primeinbox@gmail.com; ruf=mailto:contact.primeinbox@gmail.com; fo=1
   TTL: 3600
   ```

3. **Replace the email address**
   - Change `contact.primeinbox@gmail.com` to your actual email
   - This is where DMARC reports will be sent

4. **Click Save/Add Record**

### DMARC Policy Levels:

- **p=none** - Monitor only (good for testing)
- **p=quarantine** - Send to spam if fail (recommended)
- **p=reject** - Reject email completely if fail (strict)

**Recommendation:** Start with `p=none` for 1-2 weeks to monitor, then change to `p=quarantine`

### Verification

1. Wait 5-10 minutes
2. Visit: https://mxtoolbox.com/dmarc.aspx
3. Enter your domain
4. Check for PASS status

---

## Part 4: Verify Everything (5 minutes) ✅

### Quick Verification Checklist

1. **Check SPF**
   - Visit: https://mxtoolbox.com/spf.aspx
   - Enter: yourdomain.com
   - Should see: ✅ "SPF record found"

2. **Check DKIM**
   - Use your email provider's verification tool
   - Or visit: https://dkimcore.org/tools/
   - Should see: ✅ "DKIM signature valid"

3. **Check DMARC**
   - Visit: https://mxtoolbox.com/dmarc.aspx
   - Enter: yourdomain.com
   - Should see: ✅ "DMARC record found"

4. **Comprehensive Check**
   - Visit: https://mxtoolbox.com/SuperTool.aspx
   - Enter: yourdomain.com
   - Run all email tests
   - All should be green ✅

5. **Send Test Email**
   - Send OTP email to your personal email
   - Check: Primary inbox or Spam?
   - Send to: https://www.mail-tester.com
   - Aim for: 9/10 or 10/10 score

---

## Common DNS Providers - Where to Find DNS Settings

### GoDaddy
1. Login → My Products
2. Click DNS next to your domain
3. Scroll to "Records" section
4. Click "Add" to add new records

### Namecheap
1. Login → Domain List
2. Click "Manage" next to domain
3. Click "Advanced DNS" tab
4. Click "Add New Record"

### Cloudflare
1. Login → Select domain
2. Click "DNS" in top menu
3. Click "Add record"

### Google Domains
1. Login → My domains
2. Click domain name
3. Click "DNS" in left menu
4. Scroll to "Custom records"
5. Click "Create new record"

### AWS Route 53
1. Go to Route 53 Console
2. Click "Hosted zones"
3. Select your domain
4. Click "Create record"

---

## Troubleshooting

### SPF Not Working

**Problem:** SPF record not found

**Solutions:**
- Check host/name field: use `@` or leave blank (not `yourdomain.com`)
- Ensure no duplicate SPF records (only one allowed)
- Wait 15-30 minutes for DNS propagation
- Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)

### DKIM Not Working

**Problem:** DKIM signature invalid

**Solutions:**
- Ensure all DKIM records added (SendGrid needs 3!)
- Check for typos in the long value string
- Verify selector matches (e.g., `google._domainkey`)
- Wait longer - DKIM can take up to 48 hours
- Click "Verify" button in your email provider dashboard

### DMARC Not Working

**Problem:** DMARC record not found

**Solutions:**
- Host/name must be exactly `_dmarc`
- Ensure it's a TXT record (not CNAME)
- Check for typos in the value
- Wait 15-30 minutes for propagation

### Still Going to Spam After DNS Setup

**Checklist:**
- [ ] Wait 24-48 hours after DNS changes
- [ ] Verify all 3 records (SPF, DKIM, DMARC) pass
- [ ] Check domain isn't blacklisted: https://mxtoolbox.com/blacklists.aspx
- [ ] Test email score: https://www.mail-tester.com (aim for 9/10+)
- [ ] Review email content for spam triggers
- [ ] Warm up domain (send small volumes first)

---

## DNS Propagation Times

| DNS Change | Typical Time | Max Time |
|------------|-------------|----------|
| SPF (TXT) | 5-15 min | 2 hours |
| DKIM (TXT/CNAME) | 15-30 min | 48 hours |
| DMARC (TXT) | 5-15 min | 2 hours |
| Full Propagation | 1-4 hours | 72 hours |

**Pro Tip:** Use low TTL (3600 seconds) for faster updates

---

## After DNS Setup - What's Next?

### Immediate (Day 1):
- ✅ Send test emails
- ✅ Verify inbox placement
- ✅ Check mail-tester.com score

### Short Term (Week 1):
- 📧 Monitor delivery rates
- 📧 Check DMARC reports
- 📧 Adjust if needed

### Long Term (Month 1+):
- 📊 Build sender reputation
- 📊 Monitor bounce rates
- 📊 Keep complaint rate low (<0.1%)

---

## Quick Copy-Paste DNS Templates

### Complete DNS Records for Gmail

```
# SPF Record
Type: TXT
Name: @
Value: v=spf1 include:_spf.google.com ~all
TTL: 3600

# DMARC Record
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:your-email@gmail.com; fo=1
TTL: 3600

# DKIM Record (get from Google Admin Console)
Type: TXT
Name: google._domainkey
Value: (get from Google)
TTL: 3600
```

### Complete DNS Records for SendGrid

```
# SPF Record
Type: TXT
Name: @
Value: v=spf1 include:sendgrid.net ~all
TTL: 3600

# DMARC Record
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:your-email@gmail.com; fo=1
TTL: 3600

# DKIM Records (3 CNAME records from SendGrid)
Type: CNAME
Name: s1._domainkey
Value: (get from SendGrid)
TTL: 3600

Type: CNAME
Name: s2._domainkey
Value: (get from SendGrid)
TTL: 3600

Type: CNAME
Name: em[####]
Value: (get from SendGrid)
TTL: 3600
```

---

## Success Criteria

You've successfully completed DNS setup when:

- ✅ SPF check passes on MXToolbox
- ✅ DKIM signature validates
- ✅ DMARC policy is active
- ✅ Mail-tester.com score: 9/10 or higher
- ✅ Test emails land in Primary inbox
- ✅ No errors in email provider dashboard

---

## Getting Help

If you're stuck:

1. **DNS Provider Support**
   - Contact your domain registrar's support
   - Most have live chat or phone support

2. **Email Provider Support**
   - Gmail: https://support.google.com
   - SendGrid: https://support.sendgrid.com
   - AWS SES: AWS Support Console

3. **Testing Tools**
   - MXToolbox: https://mxtoolbox.com
   - Mail-tester: https://www.mail-tester.com
   - DKIM Validator: https://dkimcore.org/tools/

4. **Community Help**
   - Stack Overflow (tag: email-authentication)
   - Reddit: r/webdev, r/sysadmin

---

**Remember:** DNS changes can take time to propagate. Don't panic if it doesn't work immediately. Wait 24 hours before troubleshooting.

🎉 **Good luck! You're about to have perfect email deliverability!**
