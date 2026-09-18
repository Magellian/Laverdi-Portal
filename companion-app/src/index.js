#!/usr/bin/env node
'use strict';

// LaVerdi local companion app (Steps 3-4-5 of the hybrid architecture
// build-out; see hermes-hybrid-companion-design.md).
//
// What this is: a minimal CLI/background process that pairs with one
// hosted Hermes agent instance, sends it periodic heartbeats, and now
// executes any delegated jobs the server hands back (install_package /
// run_command; render_job is not implemented yet) -- see jobs.js.
//
// What this is NOT yet:
//   - no Windows service / tray icon / installer packaging
//   - no encryption at rest for the saved pairing token

const config = require('./config');
const { sendHeartbeat, sendJobResult } = require('./heartbeat');
const { runJob } = require('./jobs');

const DEFAULT_BASE_URL = 'https://laverdi.tech';
const DEFAULT_INTERVAL_SECONDS = 60;

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      args._.push(arg);
    }
  }
  return args;
}

function timestamp() {
  return new Date().toISOString();
}

function maskToken(token) {
  if (!token) return '(none)';
  if (token.length <= 8) return '****';
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

async function cmdPair(args) {
  const instanceId = args.instance;
  const pairingToken = args.token;
  const baseUrl = args['base-url'] || DEFAULT_BASE_URL;

  if (!instanceId || !pairingToken) {
    console.error(
      'Usage: laverdi-companion pair --instance <instanceId> --token <pairingToken> [--base-url https://laverdi.tech]\n' +
      '\n' +
      'Get <instanceId> and <pairingToken> from the dashboard\'s Companion App page\n' +
      '(under "Pairing" -- Generate/Rotate Token).'
    );
    process.exitCode = 1;
    return;
  }

  console.log(`[${timestamp()}] Verifying pairing token against ${baseUrl} ...`);
  const result = await sendHeartbeat({ baseUrl, instanceId, pairingToken });

  if (!result.ok) {
    console.error(`[${timestamp()}] Pairing failed: ${result.error} (status ${result.status})`);
    console.error('Not saving these credentials. Double-check the instance id and token.');
    process.exitCode = 1;
    return;
  }

  config.save({ instanceId, pairingToken, baseUrl });
  console.log(`[${timestamp()}] Paired. Saved to ${config.configPath()}`);
  console.log(`  instanceId: ${instanceId}`);
  console.log(`  pairingToken: ${maskToken(pairingToken)}`);
  console.log(`  baseUrl: ${baseUrl}`);
  console.log(`  delegationPolicy (from server): ${result.body?.delegationPolicy ?? 'unknown'}`);
  console.log('\nRun `laverdi-companion start` to begin sending heartbeats and running delegated jobs.');
}

async function cmdStatus() {
  const saved = config.load();
  if (!saved) {
    console.log('Not paired yet. Run `laverdi-companion pair --instance <id> --token <token>` first.');
    return;
  }

  console.log(`Paired instance: ${saved.instanceId}`);
  console.log(`Server: ${saved.baseUrl}`);
  console.log(`Pairing token: ${maskToken(saved.pairingToken)}`);
  console.log(`Config file: ${config.configPath()}`);

  console.log(`\n[${timestamp()}] Sending a live heartbeat to check connectivity...`);
  const result = await sendHeartbeat({
    baseUrl: saved.baseUrl,
    instanceId: saved.instanceId,
    pairingToken: saved.pairingToken,
  });

  if (result.ok) {
    console.log(`[${timestamp()}] OK -- server sees us as paired.`);
    console.log(`  delegationPolicy: ${result.body?.delegationPolicy ?? 'unknown'}`);
    console.log(`  pendingJobs: ${(result.body?.pendingJobs ?? []).length} (run \`start\` to execute them)`);
  } else {
    console.log(`[${timestamp()}] FAILED -- ${result.error} (status ${result.status})`);
  }
}

async function runPendingJobs(saved, pendingJobs) {
  for (const job of pendingJobs) {
    console.log(`[${timestamp()}] Running delegated job ${job.id} (${job.kind}): ${JSON.stringify(job.payload)}`);
    let outcome;
    try {
      outcome = await runJob(job);
    } catch (err) {
      outcome = { status: 'failed', resultSummary: `Companion app crashed running this job: ${err.message}` };
    }

    console.log(`[${timestamp()}] Job ${job.id} -> ${outcome.status}`);

    const posted = await sendJobResult({
      baseUrl: saved.baseUrl,
      instanceId: saved.instanceId,
      jobId: job.id,
      pairingToken: saved.pairingToken,
      status: outcome.status,
      resultSummary: outcome.resultSummary,
    });

    if (!posted.ok) {
      console.log(`[${timestamp()}] Failed to report result for job ${job.id}: ${posted.error} (status ${posted.status})`);
    }
  }
}

async function cmdStart(args) {
  const saved = config.load();
  if (!saved) {
    console.error('Not paired yet. Run `laverdi-companion pair --instance <id> --token <token>` first.');
    process.exitCode = 1;
    return;
  }

  const intervalSeconds = Number(args.interval) || DEFAULT_INTERVAL_SECONDS;
  console.log(`[${timestamp()}] Starting companion for instance ${saved.instanceId}`);
  console.log(`  server: ${saved.baseUrl}`);
  console.log(`  heartbeat interval: ${intervalSeconds}s`);
  console.log('  (Ctrl+C to stop -- this is a foreground skeleton, not a service yet)\n');

  let stopping = false;
  let ticking = false;
  process.on('SIGINT', () => {
    console.log(`\n[${timestamp()}] Stopping.`);
    stopping = true;
    process.exit(0);
  });

  async function tick() {
    if (stopping || ticking) return;
    ticking = true;
    try {
      const result = await sendHeartbeat({
        baseUrl: saved.baseUrl,
        instanceId: saved.instanceId,
        pairingToken: saved.pairingToken,
      });

      if (!result.ok) {
        console.log(`[${timestamp()}] heartbeat FAILED: ${result.error} (status ${result.status})`);
        return;
      }

      const pendingJobs = result.body?.pendingJobs ?? [];
      console.log(`[${timestamp()}] heartbeat ok (pendingJobs: ${pendingJobs.length})`);
      if (pendingJobs.length > 0) {
        await runPendingJobs(saved, pendingJobs);
      }
    } finally {
      ticking = false;
    }
  }

  await tick();
  const handle = setInterval(tick, intervalSeconds * 1000);
  // Keep the process alive; SIGINT handler above exits explicitly.
  handle.unref?.(); // don't let the timer alone keep a *packaged* service process pinned oddly
}

async function main() {
  const [, , command, ...rest] = process.argv;
  const args = parseArgs(rest);

  switch (command) {
    case 'pair':
      await cmdPair(args);
      break;
    case 'status':
      await cmdStatus(args);
      break;
    case 'start':
      await cmdStart(args);
      break;
    default:
      console.log(
        'LaVerdi Companion\n\n' +
        'Commands:\n' +
        '  pair --instance <id> --token <token> [--base-url <url>]   Pair with a hosted instance\n' +
        '  start [--interval <seconds>]                               Run the heartbeat + job loop\n' +
        '  status                                                     Show pairing + live connectivity\n'
      );
      if (command && command !== 'help') process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exitCode = 1;
});
