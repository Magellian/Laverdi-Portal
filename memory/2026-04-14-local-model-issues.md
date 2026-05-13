# Local Model Issues & Diagnostics - 2026-04-14

## Summary
Both LM Studio instances have connectivity but response/format issues.

## Gemma-4-26b (192.168.50.151:11434)

**Status:** Connected ✓ | Slow ⚠️ | No errors ✓

**Issue:** Very slow inference
- 26B parameters on network LM Studio
- Direct API call takes 2+ minutes per token
- OpenClaw might timeout waiting for response
- Expected: 30-60+ seconds per completion

**Solution:**
- Option A: Accept slow speed, increase timeout in OpenClaw config
- Option B: Use only as emergency fallback
- Option C: Check if GPU acceleration is enabled on 192.168.50.151

**Test Result:**
```
curl http://192.168.50.151:11434/v1/chat/completions \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"model":"google/gemma-4-26b-a4b","messages":[{"role":"user","content":"hello"}],"max_tokens":10}'
  
Status: 200 (OK)
Response Time: 120+ seconds
Output: "hello" (eventually succeeds)
```

---

## Qwen-3.5-9b (192.168.50.220:11434)

**Status:** Connected ✓ | Auth works ✓ | Empty response ⚠️

**Issue:** Returns empty `content` field
- API requires Bearer token (working)
- Response includes `reasoning_content` (thinking process)
- But `content` (actual completion) is empty
- Possible: Qwen model expects different format or is misconfigured

**Test Result:**
```
curl http://192.168.50.220:11434/v1/chat/completions \
  -X POST \
  -H "Authorization: Bearer sk-lm-YzqByRwU:qIvNOVxI1uJ7Nah2OCU6" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen/qwen3.5-9b","messages":[{"role":"user","content":"hello"}],"max_tokens":20}'

Status: 200 (OK)
Response:
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "",
        "reasoning_content": "Thinking Process: ..."
      }
    }
  ]
}
```

**Possible Causes:**
1. Qwen model loaded with different chat format
2. Token limit too low (max_tokens=20 might cut off actual response)
3. LM Studio config issue on .220
4. Qwen-3.5-9b might not support standard OpenAI chat format

---

## Recommendations

### Immediate (Next Session)
1. Check `.220` LM Studio logs — why is content empty?
2. Test with higher `max_tokens` for Qwen
3. Try different prompt format for Qwen
4. Check if Gemma-4-26b has GPU enabled

### Config Changes Needed
- Increase timeouts for Gemma (currently might be 30-60s default)
- Add error handling for Qwen empty responses
- Consider removing Qwen from primary chain until fixed

### Alternative
- Keep Gemma-4-26b as offline fallback (works, just slow)
- Remove Qwen until troubleshot
- Use: GPT-5.4 → Opus → Gemini → OpenRouter → Gemma-4-26b

---

## Next Steps

1. Diagnose Qwen on `.220` (check LM Studio settings, logs)
2. Test with longer `max_tokens` (try 100+)
3. Verify Gemma-4-26b is acceptable at 2+ min per response
4. Re-configure fallback chain based on findings
