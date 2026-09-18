'use strict';

// Calls to the bridge built in Steps 2/4:
//   sendHeartbeat -- POST /api/agents/[id]/companion/heartbeat. Also
//     returns any DelegatedJob rows ready for us to run (pendingJobs).
//   sendJobResult -- POST /api/agents/[id]/companion/jobs/[jobId]/result,
//     reporting the outcome of a job we ran (see jobs.js).

async function postJson({ baseUrl, path, body, timeoutMs = 10000 }) {
  const url = `${baseUrl.replace(/\/$/, '')}${path}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    let parsedBody = null;
    try {
      parsedBody = await res.json();
    } catch {
      // non-JSON error page etc. -- fall through with body = null
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: (parsedBody && parsedBody.error) || `HTTP ${res.status}`,
      };
    }

    return { ok: true, status: res.status, body: parsedBody };
  } catch (err) {
    const reason = err.name === 'AbortError' ? 'timed out' : err.message;
    return { ok: false, status: null, error: reason };
  } finally {
    clearTimeout(timer);
  }
}

function sendHeartbeat({ baseUrl, instanceId, pairingToken, timeoutMs }) {
  return postJson({
    baseUrl,
    path: `/api/agents/${instanceId}/companion/heartbeat`,
    body: { pairingToken },
    timeoutMs,
  });
}

function sendJobResult({ baseUrl, instanceId, jobId, pairingToken, status, resultSummary, timeoutMs }) {
  return postJson({
    baseUrl,
    path: `/api/agents/${instanceId}/companion/jobs/${jobId}/result`,
    body: { pairingToken, status, resultSummary },
    timeoutMs,
  });
}

module.exports = { sendHeartbeat, sendJobResult };
