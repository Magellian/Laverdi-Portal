# Session: 2026-03-24 04:16:39 UTC

- **Session Key**: agent:main:telegram:slash:8738804266
- **Session ID**: f9726ef6-082c-4cca-9677-dc924b7770f1
- **Source**: webchat

## Conversation Summary

user: Sender (untrusted metadata):
```json
{
  "label": "openclaw-control-ui",
  "id": "openclaw-control-ui"
}
```

[Mon 2026-03-23 21:14 PDT] so at the top of this chat screen, the dropdown with the models, is that just the mode used to actually chat?
assistant: Yes. That dropdown sets the active model for this specific chat session. 

Whichever model you select there becomes the "brain" processing your messages, doing the reasoning, and executing tools for this tab. It lets you switch on the fly—for example, you can use a faster model for simple queries, then drop down and switch to a heavy hitter (like Gemini 3.1 Pro or GPT-5.4) when you need complex coding or system building.

It only overrides the model for this current conversation, it doesn't change the global default for your entire OpenClaw background setup.
user: Sender (untrusted metadata):
```json
{
  "label": "openclaw-control-ui",
  "id": "openclaw-control-ui"
}
```

[Mon 2026-03-23 21:15 PDT] so i just go default and it goes system
assistant: <final>Exactly. Selecting "Default" clears the override for this chat. It tells the session to fall back to whatever you have configured as the system-wide default in your OpenClaw settings. 

Right now, your system default is set to `google/gemini-3.1-pro-preview`, so leaving it on "Default" means you're using that model.</final>
