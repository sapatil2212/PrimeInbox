// Native Node fetch will be used.

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("🚀 Starting PrimeInbox REST API Verification Suite...");

  let standardCookie = "";
  let adminCookie = "";

  // 1a. Standard Tenant Login
  try {
    console.log("\n🔑 [TEST 1a] Logging in via standard auth (Tenant mode)...");
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "contact.primeinbox@gmail.com",
        password: "primeinbox@2026"
      })
    });

    if (!loginRes.ok) {
      const err = await loginRes.json();
      throw new Error(`Login failed: ${JSON.stringify(err)}`);
    }

    const loginData = await loginRes.json();
    console.log("✅ [TEST 1a] Login successful!", loginData.message);

    const setCookieHeader = loginRes.headers.get("set-cookie");
    if (setCookieHeader) {
      standardCookie = setCookieHeader.split(";")[0];
      console.log(`🍪 [TEST 1a] Standard Session token resolved.`);
    } else {
      throw new Error("No session cookie returned.");
    }
  } catch (e: any) {
    console.error("❌ [TEST 1a] Failed:", e.message);
    process.exit(1);
  }

  // 1b. Super Admin Login
  try {
    console.log("\n🔑 [TEST 1b] Logging in via Super Admin auth (Admin mode)...");
    const loginRes = await fetch(`${BASE_URL}/api/auth/superadmin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "contact.primeinbox@gmail.com",
        password: "primeinbox@2026",
        securityKey: "primeinbox@2026"
      })
    });

    if (!loginRes.ok) {
      const err = await loginRes.json();
      throw new Error(`Login failed: ${JSON.stringify(err)}`);
    }

    const loginData = await loginRes.json();
    console.log("✅ [TEST 1b] Super Admin Login successful!", loginData.message);

    const setCookieHeader = loginRes.headers.get("set-cookie");
    if (setCookieHeader) {
      adminCookie = setCookieHeader.split(";")[0];
      console.log(`🍪 [TEST 1b] Admin Session token resolved.`);
    } else {
      throw new Error("No session cookie returned.");
    }
  } catch (e: any) {
    console.error("❌ [TEST 1b] Failed:", e.message);
    process.exit(1);
  }

  const tenantHeaders = {
    "Content-Type": "application/json",
    "Cookie": standardCookie
  };

  const adminHeaders = {
    "Content-Type": "application/json",
    "Cookie": adminCookie
  };

  // 2. Fetch Dashboard Stats
  try {
    console.log("\n📊 [TEST 2] Fetching Dashboard stats...");
    const res = await fetch(`${BASE_URL}/api/dashboard/stats`, { headers: tenantHeaders });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data = await res.json();
    console.log("✅ [TEST 2] Stats fetched successfully:", {
      totalSends: data.stats.totalSends,
      openRate: data.stats.openRate,
      activeCampaigns: data.stats.activeCampaigns,
      recentActivities: data.recentActivity.length
    });
  } catch (e: any) {
    console.error("❌ [TEST 2] Failed:", e.message);
  }

  // 3. Fetch Reports Telemetry
  try {
    console.log("\n📈 [TEST 3] Fetching Reports data...");
    const res = await fetch(`${BASE_URL}/api/reports`, { headers: tenantHeaders });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data = await res.json();
    console.log("✅ [TEST 3] Reports fetched successfully:", {
      totalSent: data.summary.sent,
      openedCount: data.summary.opened,
      campaignsListCount: data.campaigns.length,
      smtpPoolCount: data.smtp.length,
      chartDataPointsCount: data.dailySends.length
    });
  } catch (e: any) {
    console.error("❌ [TEST 3] Failed:", e.message);
  }

  // 4. Fetch Billing Info
  try {
    console.log("\n💳 [TEST 4] Fetching Billing details...");
    const res = await fetch(`${BASE_URL}/api/billing`, { headers: tenantHeaders });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data = await res.json();
    console.log("✅ [TEST 4] Billing info fetched successfully:", {
      activePlan: data.plan,
      subscriptionStatus: data.subscription.status,
      invoicesCount: data.invoices.length
    });
  } catch (e: any) {
    console.error("❌ [TEST 4] Failed:", e.message);
  }

  // 5. Simulate Premium Plan Upgrade
  try {
    console.log("\n⚡ [TEST 5] Simulating Plan Upgrade to 'PRO' ($79/mo)...");
    const upgradeRes = await fetch(`${BASE_URL}/api/billing`, {
      method: "POST",
      headers: tenantHeaders,
      body: JSON.stringify({ plan: "PRO", amount: 79 })
    });
    if (!upgradeRes.ok) throw new Error(`HTTP Error ${upgradeRes.status}`);
    const upgradeData = await upgradeRes.json();
    console.log("✅ [TEST 5] Plan upgraded successfully:", upgradeData.message);

    // Verify upgrade persisted in DB
    const verifyRes = await fetch(`${BASE_URL}/api/billing`, { headers: tenantHeaders });
    const verifyData = await verifyRes.json();
    console.log("✅ [TEST 5] Verification check:", {
      updatedPlan: verifyData.plan,
      invoicesRegisteredInDB: verifyData.invoices.length,
      latestInvoiceNumber: verifyData.invoices[0].invoiceNumber,
      latestInvoiceAmount: `$${verifyData.invoices[0].amount}`
    });
  } catch (e: any) {
    console.error("❌ [TEST 5] Failed:", e.message);
  }

  // 6. Create CRM Contact
  try {
    console.log("\n💼 [TEST 6] Adding new CRM Contact...");
    const crmRes = await fetch(`${BASE_URL}/api/crm/contacts`, {
      method: "POST",
      headers: tenantHeaders,
      body: JSON.stringify({
        firstName: "Verification",
        lastName: "Robot",
        email: "bot@primeinbox.com",
        phone: "+1-555-0199",
        title: "QA Engineer",
        companyName: "PrimeInbox Testing Corp",
        status: "PROSPECT",
        notes: "Automated API health verification run."
      })
    });
    if (!crmRes.ok) throw new Error(`HTTP Error ${crmRes.status}`);
    const crmData = await crmRes.json();
    console.log("✅ [TEST 6] CRM Contact added successfully:", {
      id: crmData.contact.id,
      name: `${crmData.contact.firstName} ${crmData.contact.lastName}`,
      company: crmData.contact.crmCompany?.name
    });
  } catch (e: any) {
    console.error("❌ [TEST 6] Failed:", e.message);
  }

  // 7. Fetch CRM List
  try {
    console.log("\n📋 [TEST 7] Listing CRM Contacts...");
    const res = await fetch(`${BASE_URL}/api/crm/contacts`, { headers: tenantHeaders });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data = await res.json();
    console.log(`✅ [TEST 7] CRM list retrieved successfully. Total contacts: ${data.contacts.length}`);
  } catch (e: any) {
    console.error("❌ [TEST 7] Failed:", e.message);
  }

  // 8. Super Admin System Telemetry Stats
  try {
    console.log("\n🛡️ [TEST 8] Fetching Super Admin system metrics...");
    const res = await fetch(`${BASE_URL}/api/admin/stats`, { headers: adminHeaders });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data = await res.json();
    console.log("✅ [TEST 8] System stats resolved:", {
      companiesCount: data.stats.companiesCount,
      usersCount: data.stats.usersCount,
      campaignsCount: data.stats.campaignsCount,
      smtpCount: data.stats.smtpCount,
      dbLatencyCheck: data.health.database.latency,
      redisConnectionCheck: data.health.redis.status
    });
  } catch (e: any) {
    console.error("❌ [TEST 8] Failed:", e.message);
  }

  // 9. Super Admin Logs Telemetry Stream
  try {
    console.log("\n📜 [TEST 9] Fetching Super Admin log stream...");
    const res = await fetch(`${BASE_URL}/api/admin/logs`, { headers: adminHeaders });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data = await res.json();
    console.log(`✅ [TEST 9] Logs stream retrieved. Streamed logs size: ${data.logs.length}`);
  } catch (e: any) {
    console.error("❌ [TEST 9] Failed:", e.message);
  }

  console.log("\n🏁 All API verification runs complete.");
}

runTests();
