import urllib.request, json

data = json.dumps({
    "model": "llama3.3-70b-instruct",
    "messages": [{"role": "user", "content": "Say hi in one word"}]
}).encode()

req = urllib.request.Request(
    "https://inference.do-ai.run/v1/chat/completions",
    data=data,
    headers={
        "Content-Type": "application/json",
        "Authorization": "Bearer sk-do-REDACTED_DO_INFERENCE_KEY"
    }
)

try:
    resp = urllib.request.urlopen(req)
    print(resp.read().decode()[:500])
except urllib.error.HTTPError as e:
    print(f"HTTP {e.code}: {e.read().decode()}")
