; LaVerdi Companion installer (Step 7 narrow-beta packaging).
; Per-user install (no admin/UAC needed) into %LOCALAPPDATA%\LaVerdiCompanion.
; Bundles the standalone .exe built by `npm run build:win` (dist/LaVerdiCompanion.exe,
; produced via @yao-pkg/pkg -- no separate Node.js install required on the target machine).

Unicode true
!include "MUI2.nsh"

Name "LaVerdi Companion"
OutFile "..\dist\LaVerdiCompanion-Setup.exe"
InstallDir "$LOCALAPPDATA\LaVerdiCompanion"
RequestExecutionLevel user

!define MUI_ABORTWARNING

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Section "Install"
  SetOutPath "$INSTDIR"
  File "..\dist\LaVerdiCompanion.exe"

  CreateDirectory "$SMPROGRAMS\LaVerdi Companion"
  CreateShortCut "$SMPROGRAMS\LaVerdi Companion\LaVerdi Companion.lnk" "$INSTDIR\LaVerdiCompanion.exe" "start"
  CreateShortCut "$SMPROGRAMS\LaVerdi Companion\Pair LaVerdi Companion.lnk" "$WINDIR\System32\cmd.exe" '/K cd /d "$INSTDIR"'
  CreateShortCut "$SMPROGRAMS\LaVerdi Companion\Uninstall LaVerdi Companion.lnk" "$INSTDIR\Uninstall.exe"

  WriteUninstaller "$INSTDIR\Uninstall.exe"

  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\LaVerdiCompanion" "DisplayName" "LaVerdi Companion"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\LaVerdiCompanion" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\LaVerdiCompanion" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\LaVerdiCompanion" "DisplayVersion" "0.3.0"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\LaVerdiCompanion" "Publisher" "LaVerdi"
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\LaVerdiCompanion" "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\LaVerdiCompanion" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\LaVerdiCompanion.exe"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"

  Delete "$SMPROGRAMS\LaVerdi Companion\LaVerdi Companion.lnk"
  Delete "$SMPROGRAMS\LaVerdi Companion\Pair LaVerdi Companion.lnk"
  Delete "$SMPROGRAMS\LaVerdi Companion\Uninstall LaVerdi Companion.lnk"
  RMDir "$SMPROGRAMS\LaVerdi Companion"

  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\LaVerdiCompanion"
SectionEnd
