' OpenClaw Watchdog - Pure VBScript (no PowerShell flash)
' Checks if OpenClaw gateway is responding, restarts if not

On Error Resume Next

Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
http.setTimeouts 3000, 3000, 3000, 3000

healthy = False
http.Open "GET", "http://127.0.0.1:18789/", False
http.Send
If Err.Number = 0 And http.Status = 200 Then
    healthy = True
End If
Err.Clear

If Not healthy Then
    ' Gateway is down — restart it silently
    Set objShell = CreateObject("WScript.Shell")
    objShell.Run "cmd /c ""C:\Users\chris\.openclaw\gateway.cmd""", 0, False
End If

Set http = Nothing
WScript.Quit
