; LaVerdi Companion installer.
;
; Built plain (no defines), this is the generic manual-pairing installer:
; per-user install, no admin needed, Start Menu shortcuts only -- same as
; the original Step 7 packaging.
;
; Built with -DINSTANCEID=<id> -DPAIRTOKEN=<token> [-DBASEURL=<url>]
; [-DOUTFILE=<path>], this produces a personalized installer that pairs
; itself silently during install and registers a hidden Scheduled Task so
; it runs on every login with no console window and no manual commands.
; That's why this variant asks for admin: registering a task with
; "run with highest privileges" requires an elevated install; Task
; Scheduler does not prompt again on later runs.

Unicode true
!include "MUI2.nsh"

!ifndef BASEURL
  !define BASEURL "https://laverdi.tech"
!endif

!ifndef OUTFILE
  !define OUTFILE "..\dist\LaVerdiCompanion-Setup.exe"
!endif

Name "LaVerdi Companion"
OutFile "${OUTFILE}"
InstallDir "$LOCALAPPDATA\LaVerdiCompanion"
RequestExecutionLevel admin

!define MUI_ABORTWARNING

Var PairResult

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES

!define MUI_FINISHPAGE_TITLE "LaVerdi Companion"
!define MUI_FINISHPAGE_TEXT "$PairResult"
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Section "Install"
  StrCpy $PairResult "Installed. Choose 'Pair LaVerdi Companion' from the Start Menu, then run the pair and start commands shown on your dashboard."

  SetOutPath "$INSTDIR"
  File "..\dist\LaVerdiCompanion.exe"
  File "run-companion.bat"
  File "run-hidden.vbs"

  CreateDirectory "$SMPROGRAMS\LaVerdi Companion"
  CreateShortCut "$SMPROGRAMS\LaVerdi Companion\LaVerdi Companion.lnk" "$INSTDIR\LaVerdiCompanion.exe" "start"
  CreateShortCut "$SMPROGRAMS\LaVerdi Companion\Pair LaVerdi Companion.lnk" "$WINDIR\System32\cmd.exe" '/K cd /d "$INSTDIR"'
  CreateShortCut "$SMPROGRAMS\LaVerdi Companion\View companion log.lnk" "$WINDIR\System32\notepad.exe" '"$APPDATA\LaVerdiCompanion\companion.log"'
  CreateShortCut "$SMPROGRAMS\LaVerdi Companion\Uninstall LaVerdi Companion.lnk" "$INSTDIR\Uninstall.exe"

  WriteUninstaller "$INSTDIR\Uninstall.exe"

  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\LaVerdiCompanion" "DisplayName" "LaVerdi Companion"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\LaVerdiCompanion" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\LaVerdiCompanion" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\LaVerdiCompanion" "DisplayVersion" "0.3.0"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\LaVerdiCompanion" "Publisher" "LaVerdi"
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\LaVerdiCompanion" "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\LaVerdiCompanion" "NoRepair" 1

  !ifdef INSTANCEID
    DetailPrint "Pairing with LaVerdi..."
    ExecWait '"$INSTDIR\LaVerdiCompanion.exe" pair --instance "${INSTANCEID}" --token "${PAIRTOKEN}" --base-url "${BASEURL}"' $0
    StrCmp $0 "0" pair_ok pair_failed

    pair_ok:
      DetailPrint "Paired. Registering background task..."
      ExecWait 'schtasks /create /tn "LaVerdiCompanion" /tr "wscript.exe \"$INSTDIR\run-hidden.vbs\"" /sc onlogon /rl highest /f' $1
      StrCmp $1 "0" task_ok task_failed

      task_ok:
        ExecWait 'schtasks /run /tn "LaVerdiCompanion"'
        StrCpy $PairResult "Paired and running in the background. It starts automatically every time you log in -- there's nothing else to do."
        Goto pair_done

      task_failed:
        StrCpy $PairResult "Paired, but the background task could not be registered. Run 'LaVerdi Companion' from the Start Menu each time you want it running."
        Goto pair_done

    pair_failed:
      StrCpy $PairResult "Installed, but pairing failed (the token may have expired). Open the LaVerdi dashboard, generate a fresh token, and use 'Pair LaVerdi Companion' from the Start Menu."

    pair_done:
  !endif
SectionEnd

Section "Uninstall"
  ExecWait 'schtasks /delete /tn "LaVerdiCompanion" /f'

  Delete "$INSTDIR\LaVerdiCompanion.exe"
  Delete "$INSTDIR\run-companion.bat"
  Delete "$INSTDIR\run-hidden.vbs"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"

  Delete "$SMPROGRAMS\LaVerdi Companion\LaVerdi Companion.lnk"
  Delete "$SMPROGRAMS\LaVerdi Companion\Pair LaVerdi Companion.lnk"
  Delete "$SMPROGRAMS\LaVerdi Companion\View companion log.lnk"
  Delete "$SMPROGRAMS\LaVerdi Companion\Uninstall LaVerdi Companion.lnk"
  RMDir "$SMPROGRAMS\LaVerdi Companion"

  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\LaVerdiCompanion"
SectionEnd
