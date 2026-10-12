'use strict';

// Executes a DelegatedJob the bridge handed us in a heartbeat's
// pendingJobs, and reports the outcome back via
// POST /api/agents/[id]/companion/jobs/[jobId]/result.
//
// Supported kinds today:
//   install_package, run_command -- payload.command is run as a shell
//     command on this machine, with a bounded timeout.
//   render_job -- a generated video, ready to download from the
//     provider's own transient CDN link (never a Vultr-hosted one -- see
//     the media add-on scoping doc's Architecture section). Saved to a
//     local "LaVerdi Media" folder. Images never reach here -- they're
//     resolved server-side and never delegated to the companion app.

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const http = require('http');

const EXEC_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const DOWNLOAD_TIMEOUT_MS = 10 * 60 * 1000; // generous -- video files, maybe a slow link
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

// Where generated media lands. Not configurable yet (Bones-stage note,
// same spirit as config.js) -- a real release should let the user pick
// this from the companion app's status screen.
function mediaDir() {
  return path.join(os.homedir(), 'LaVerdi Media');
}

function extFromUrl(url, mediaType) {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname);
    if (ext && ext.length <= 6) return ext;
  } catch {
    // fall through to default below
  }
  return mediaType === 'video' ? '.mp4' : '.bin';
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function downloadToFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const request = client.get(url, { timeout: DOWNLOAD_TIMEOUT_MS }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // One redirect hop -- fal.ai CDN links don't usually need this, but cheap to handle.
        res.resume();
        downloadToFile(res.headers.location, destPath).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`Download failed: HTTP ${res.statusCode} (the link may have expired)`));
        return;
      }

      const tmpPath = `${destPath}.part`;
      const fileStream = fs.createWriteStream(tmpPath);
      let bytes = 0;
      res.on('data', (chunk) => {
        bytes += chunk.length;
      });
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close((closeErr) => {
          if (closeErr) {
            reject(closeErr);
            return;
          }
          fs.rename(tmpPath, destPath, (renameErr) => {
            if (renameErr) reject(renameErr);
            else resolve(bytes);
          });
        });
      });
      fileStream.on('error', (err) => {
        fs.unlink(tmpPath, () => {});
        if (err.code === 'ENOSPC') {
          reject(new Error('Out of disk space -- free some space and the next job will try again.'));
        } else {
          reject(err);
        }
      });
    });

    request.on('timeout', () => {
      request.destroy(new Error('Download timed out'));
    });
    request.on('error', reject);
  });
}

async function runRenderJob(payload) {
  const { mediaType, downloadUrl, mediaJobId } = payload || {};

  if (mediaType !== 'video' || !downloadUrl) {
    return { status: 'failed', resultSummary: `render_job payload missing downloadUrl: ${JSON.stringify(payload)}` };
  }

  const dir = mediaDir();
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    return { status: 'failed', resultSummary: `Could not create ${dir}: ${err.message}` };
  }

  const filename = `laverdi-${mediaJobId || Date.now()}${extFromUrl(downloadUrl, 'video')}`;
  const destPath = path.join(dir, filename);

  try {
    const bytes = await downloadToFile(downloadUrl, destPath);
    return { status: 'completed', resultSummary: `Saved video to ${destPath} (${formatBytes(bytes)})` };
  } catch (err) {
    return { status: 'failed', resultSummary: `Could not save video: ${err.message}` };
  }
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
    return runRenderJob(payload);
  }

  return { status: 'failed', resultSummary: `Unknown job kind: ${kind}` };
}

module.exports = { runJob, mediaDir };
