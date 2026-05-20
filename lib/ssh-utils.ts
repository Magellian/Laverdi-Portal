/**
 * SSH Utilities for Portal Provisioning
 * Handles SSH key management, authentication, and secure command execution
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SSHConfig {
  host: string;
  port: number;
  user: string;
  privateKeyPath: string;
  strictHostKeyChecking?: boolean;
}

export interface SSHCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Execute a command on a remote server via SSH
 */
export async function executeSSHCommand(
  config: SSHConfig,
  command: string
): Promise<SSHCommandResult> {
  const keyPath = path.resolve(config.privateKeyPath);
  
  if (!fs.existsSync(keyPath)) {
    throw new Error(`Private key not found: ${keyPath}`);
  }

  const strictHost = config.strictHostKeyChecking !== false ? 'yes' : 'no';
  const sshCmd = `ssh -i "${keyPath}" -p ${config.port} -o StrictHostKeyChecking=${strictHost} ${config.user}@${config.host}`;
  
  try {
    const { stdout, stderr } = await execAsync(`${sshCmd} "${command}"`);
    return { stdout, stderr, exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || error.message || '',
      exitCode: error.code || 1
    };
  }
}

/**
 * Copy a file to a remote server via SCP
 */
export async function copyFileToRemote(
  config: SSHConfig,
  localPath: string,
  remotePath: string
): Promise<void> {
  const keyPath = path.resolve(config.privateKeyPath);
  
  if (!fs.existsSync(localPath)) {
    throw new Error(`Local file not found: ${localPath}`);
  }

  if (!fs.existsSync(keyPath)) {
    throw new Error(`Private key not found: ${keyPath}`);
  }

  const strictHost = config.strictHostKeyChecking !== false ? 'yes' : 'no';
  const scpCmd = `scp -i "${keyPath}" -P ${config.port} -o StrictHostKeyChecking=${strictHost} "${localPath}" ${config.user}@${config.host}:"${remotePath}"`;
  
  try {
    await execAsync(scpCmd);
  } catch (error: any) {
    throw new Error(`SCP failed: ${error.message}`);
  }
}

/**
 * Copy a file from a remote server via SCP
 */
export async function copyFileFromRemote(
  config: SSHConfig,
  remotePath: string,
  localPath: string
): Promise<void> {
  const keyPath = path.resolve(config.privateKeyPath);
  
  if (!fs.existsSync(keyPath)) {
    throw new Error(`Private key not found: ${keyPath}`);
  }

  const strictHost = config.strictHostKeyChecking !== false ? 'yes' : 'no';
  const scpCmd = `scp -i "${keyPath}" -P ${config.port} -o StrictHostKeyChecking=${strictHost} ${config.user}@${config.host}:"${remotePath}" "${localPath}"`;
  
  try {
    await execAsync(scpCmd);
  } catch (error: any) {
    throw new Error(`SCP failed: ${error.message}`);
  }
}

/**
 * Verify SSH connectivity to a remote server
 */
export async function verifySSHConnection(
  config: SSHConfig
): Promise<boolean> {
  try {
    const result = await executeSSHCommand(config, 'echo "SSH connection OK"');
    return result.exitCode === 0;
  } catch (error) {
    return false;
  }
}

/**
 * Get the auth token from the remote server environment
 */
export async function getRemoteAuthToken(
  config: SSHConfig,
  tokenEnvVar: string = 'AUTH_TOKEN'
): Promise<string> {
  const result = await executeSSHCommand(config, `echo $${tokenEnvVar}`);
  
  if (result.exitCode !== 0) {
    throw new Error(`Failed to retrieve auth token: ${result.stderr}`);
  }

  const token = result.stdout.trim();
  if (!token) {
    throw new Error(`Auth token environment variable ${tokenEnvVar} is not set on remote server`);
  }

  return token;
}
