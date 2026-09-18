#!/usr/bin/env python3
"""
hermes-delegate — connects a sandboxed Hermes instance on this VPS to the
LaVerdi Portal's delegation bridge, so work the sandbox can't or shouldn't
do itself (a blocked package install, a heavier local command, a render
job) can be handed off to that instance's paired local companion app.

Runs on the HOST (this process is invoked by a systemd-run Hermes agent
process or its pre_tool_call shell hook, both of which run directly on the
VPS host, unsandboxed) — never inside the per-command Docker sandbox that
Step 1 locked down, so it reaches the Portal over plain loopback HTTP
rather than through that sandbox's egress proxy.

Two subcommands:
  submit  — create a job and poll it to completion/timeout. For manual
            testing and for anything that wants a blocking call.
  hook    — read a Hermes pre_tool_call shell-hook JSON payload on stdin,
            decide whether the command should be delegated, and print the
            hook's JSON response on stdout. See config.yaml's `hooks:`
            block and website/docs/user-guide/features/hooks.md.
"""
import json
import re
import sys
import time
import urllib.error
import urllib.request

PORTAL_URL = "http://127.0.0.1:3001"
SECRET_FILE = "/root/laverdi-portal/.env"

INSTALL_PATTERN = re.compile(
    r"^\s*(sudo\s+)?(pip3?\s+install|pip3?\s+-m\s+pip\s+install|"
    r"apt(-get)?\s+install|npm\s+(i|install)\s+(-g|--global)|"
    r"yarn\s+global\s+add|brew\s+install)\b"
)


def _read_secret():
    with open(SECRET_FILE) as f:
        for line in f:
            if line.startswith("PROVISION_CALLBACK_SECRET="):
                return line.strip().split("=", 1)[1]
    raise RuntimeError(f"PROVISION_CALLBACK_SECRET not found in {SECRET_FILE}")


def _request(method, path, body=None, timeout=10):
    url = f"{PORTAL_URL}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {_read_secret()}")
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode())


def submit_and_wait(instance_id, kind, payload, timeout_s=90, poll_interval=2):
    try:
        created = _request(
            "POST", f"/api/agents/{instance_id}/companion/jobs",
            {"kind": kind, "payload": payload},
        )
    except urllib.error.HTTPError as e:
        try:
            detail = json.loads(e.read().decode()).get("error", str(e))
        except Exception:
            detail = str(e)
        return {"status": "error", "resultSummary": f"Could not create delegated job: {detail}"}
    except Exception as e:
        return {"status": "error", "resultSummary": f"Could not reach delegation bridge: {e}"}

    job_id = created["id"]
    deadline = time.time() + timeout_s
    last_status = created.get("status", "pending")
    while time.time() < deadline:
        time.sleep(poll_interval)
        try:
            job = _request("GET", f"/api/agents/{instance_id}/companion/jobs/{job_id}")
        except Exception as e:
            return {"status": "error", "resultSummary": f"Lost contact with delegation bridge: {e}"}
        last_status = job["status"]
        if last_status in ("completed", "failed"):
            return {"status": last_status, "resultSummary": job.get("resultSummary") or ""}

    if last_status == "pending":
        return {"status": "timeout", "resultSummary": "Still awaiting human approval (delegationPolicy=ask)."}
    return {"status": "timeout", "resultSummary": "No paired companion app picked this job up in time."}


def cmd_submit(args):
    instance_id = None
    kind = None
    payload = {}
    timeout_s = 90
    it = iter(args)
    for a in it:
        if a == "--instance":
            instance_id = next(it)
        elif a == "--kind":
            kind = next(it)
        elif a == "--payload":
            payload = json.loads(next(it))
        elif a == "--timeout":
            timeout_s = int(next(it))
    if not instance_id or not kind:
        print("Usage: hermes-delegate submit --instance <id> --kind <kind> [--payload '<json>'] [--timeout <secs>]", file=sys.stderr)
        return 2
    result = submit_and_wait(instance_id, kind, payload, timeout_s=timeout_s)
    print(json.dumps(result))
    return 0 if result["status"] == "completed" else 1


def cmd_hook(args):
    if not args:
        print("Usage: hermes-delegate hook <instance_id>", file=sys.stderr)
        return 2
    instance_id = args[0]
    try:
        payload_in = json.load(sys.stdin)
    except Exception:
        print("{}")
        return 0

    if payload_in.get("tool_name") != "terminal":
        print("{}")
        return 0

    command = (payload_in.get("tool_input") or {}).get("command", "")
    if not INSTALL_PATTERN.match(command or ""):
        print("{}")
        return 0

    result = submit_and_wait(instance_id, "install_package", {"command": command}, timeout_s=90)

    if result["status"] == "completed":
        message = f"This install was delegated to your local companion app and completed:\n{result['resultSummary']}"
    elif result["status"] == "failed":
        message = f"This install was delegated to your local companion app but failed:\n{result['resultSummary']}"
    elif result["status"] == "error":
        message = f"Package installs on this instance go through a paired local companion app, and it couldn't be reached: {result['resultSummary']}"
    else:
        message = f"This install was delegated to your local companion app, but it hasn't finished yet: {result['resultSummary']}"

    print(json.dumps({"action": "block", "message": message}))
    return 0


def main():
    if len(sys.argv) < 2 or sys.argv[1] not in ("submit", "hook"):
        print("Usage: hermes-delegate <submit|hook> ...", file=sys.stderr)
        return 2
    if sys.argv[1] == "submit":
        return cmd_submit(sys.argv[2:])
    return cmd_hook(sys.argv[2:])


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        # Never crash uncaught inside a pre_tool_call hook -- always emit
        # valid hook JSON so Hermes doesn't silently fail-open past a bug.
        print(json.dumps({"action": "block", "message": f"hermes-delegate internal error: {e}"}))
        sys.exit(0)
