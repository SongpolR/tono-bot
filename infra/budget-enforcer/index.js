// Cloud Functions (Gen2) - Node.js 18
const { google } = require('googleapis');

/**
 * Pub/Sub trigger for billing budget alerts.
 * Env:
 *   TARGET_PROJECT_ID = project to disable billing for
 *   DRY_RUN = "true" to log only (no changes)
 *   MIN_RATIO = number like 1.0 (require cost >= MIN_RATIO * budget to act)
 */
exports.onBudgetAlert = async (message, context) => {
  const dataStr = Buffer.from(message.data, 'base64').toString('utf8');
  let payload = {};
  try {
    payload = JSON.parse(dataStr);
  } catch (e) {
    console.error('Invalid JSON in Pub/Sub message:', dataStr);
    return;
  }

  const targetProject = process.env.TARGET_PROJECT_ID;
  if (!targetProject) {
    console.error('Missing env TARGET_PROJECT_ID');
    return;
  }

  // Extract numbers defensively
  const cost = num(payload.costAmount) || micros(payload.costAmountMicros);
  const budget =
    num(payload.budgetAmount) || micros(payload.budgetAmountMicros);
  const ratio = budget > 0 ? cost / budget : 0;
  const minRatio = Number(process.env.MIN_RATIO || '1.0');

  console.log('Budget alert:', {
    budgetDisplayName: payload.budgetDisplayName,
    cost,
    budget,
    ratio,
    minRatio,
  });

  // If your budget is configured to fire at 100%, this check is redundant.
  if (!cost || !budget || ratio < minRatio) {
    console.log('Condition not met; no action.');
    return;
  }

  if ((process.env.DRY_RUN || '').toLowerCase() === 'true') {
    console.log(`[DRY_RUN] Would disable billing for project ${targetProject}`);
    return;
  }

  try {
    // Auth with Cloud Billing API
    const auth = await google.auth.getClient({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const cloudbilling = google.cloudbilling({ version: 'v1', auth });

    const name = `projects/${targetProject}/billingInfo`;

    // Disable billing by clearing billingAccountName
    const res = await cloudbilling.projects.updateBillingInfo({
      name,
      requestBody: { billingAccountName: '' },
    });

    console.log('Billing disabled result:', {
      project: targetProject,
      billingEnabled: res.data.billingEnabled,
      billingAccountName: res.data.billingAccountName || '(none)',
    });
  } catch (err) {
    console.error('Failed to disable billing:', err?.response?.data || err);
  }
};

function num(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function micros(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n / 1e6 : 0;
}
