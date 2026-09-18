'use strict';

// Executes a DelegatedJob the bridge handed us in a heartbeat's
// pendingJobs, and reports the outcome back via
// POST /api/agents/[id]/companion/jobs/[jobId]/result (Step 4/5 of the
// hybrid architecture build-out).
//
// Supported kinds today:
//   install_package, run_command -- payload.command is run as a shell
//     command on this machine, with a bounded timeout. This is real
//     execution with the user's own privileges: it only happens because
//     the server-side delegationPolicy for this instance allowed it
//     (auto_trusted/auto_all), or a human approved it on the dashboard
//     (ask policy) -- see hermes-hybrid-companion-design.md section 6.
//   render_job -- not implemented yet; reported back as failed so the
//     sandbox side doesn't hang waiting on it.

const { exec } = require('child_process');

const EXEC_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const MAX_OUTPUT_CHARS = 4000; // matches the server's resultSummary cap

function truncate(text) {
  if (!text) return '';
  return text.length > MAX_OUTPUT_CHARS
    ? `${text.slice(0, MAX_OUTPUT_CHARS)}\n...(truncated)`
    : text;
}

function runCommand(command) {
  return new Promise((resolve) => {
    exec(
      command,
      { timeout: EXEC_TIMEOUT_MS, windowsHide: true, maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        const combined = [stdout, stderr].filter(Boolean).join('\n').trim();
        if (error) {
          const reason = error.killed
            ? `Timed out after ${EXEC_TIMEOUT_MS / 1000}s`
            : `Exit code ${error.code ?? 'unknown'}`;
          resolve({
            status: 'failed',
            resultSummary: truncate(`${reason}\n${combined}`.trim()),
          });
          return;
        }
        resolve({
          status: 'completed',
          resultSummary: truncate(combined || '(command produced no output)'),
        });
      }
    );
  });
}

async function runJob(job) {
  const { kind, payload } = job;

  if (kind === 'install_package' || kind === 'run_command') {
    const command = payload && payload.command;
    if (!command || typeof command !== 'string') {
      return { status: 'failed', resultSummary: `No command in job payload: ${JSON.stringify(payload)}` };
    }
    return runCommand(command);
  }

  if (kind === 'render_job') {
    return {
      status: 'failed',
      resultSummary: 'render_job execution is not implemented in this companion app yet.',
    };
  }

  return { status: 'failed', resultSummary: `Unknown job kind: ${kind}` };
}

module.exports = { runJob };
