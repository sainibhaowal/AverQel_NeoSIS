!include "LogicLib.nsh"

Var neosisFinalDirectory
Var neosisNewDirectory
Var neosisOldDirectory
Var neosisOldMoved
Var neosisNewMoved

!macro neosisExtractPayload FILE
  !ifmacrodef customInstallerExtract
    !insertmacro customInstallerExtract "${FILE}"
  !else
    nsExec::ExecToStack '"$PLUGINSDIR\neosis-7za.exe" x -y -bd -bb0 "-o$INSTDIR" "${FILE}"'
    Pop $R0
    Pop $R1
  !endif
  ${If} $R0 != 0
    DetailPrint $R1
    Call neosisRollbackDirectories
    !ifmacrodef customInstallerExtractFailed
      !insertmacro customInstallerExtractFailed "${FILE}"
    !else
      MessageBox MB_OK|MB_ICONEXCLAMATION "$(decompressionFailed)" /SD IDOK
    !endif
    SetErrorLevel 2
    Quit
  ${EndIf}
!macroend

!macro neosisStageApplication
  StrCpy $neosisFinalDirectory $INSTDIR
  System::Call 'ole32::CoCreateGuid(g .r0) i .r1'
  ${If} $1 != 0
    SetErrorLevel 2
    Quit
  ${EndIf}
  StrCpy $neosisNewDirectory "$INSTDIR.new-$0"
  StrCpy $neosisOldDirectory "$INSTDIR.old-$0"
  StrCpy $neosisOldMoved ""
  StrCpy $neosisNewMoved ""
  ClearErrors
  CreateDirectory $neosisNewDirectory
  ${If} ${Errors}
    SetErrorLevel 2
    Quit
  ${EndIf}
  File /oname=$PLUGINSDIR\neosis-7za.exe "${NEOSIS_SEVENZIP_PATH}"
  StrCpy $INSTDIR $neosisNewDirectory
  SetOutPath $INSTDIR
  !insertmacro installApplicationFiles
  !ifdef NEOSIS_SEVENZIP_LICENSE_DIR
    File /oname=7zip-installer-LICENSE.txt "${NEOSIS_SEVENZIP_LICENSE_DIR}\LICENSE.txt"
    File /oname=7zip-installer-COPYING.txt "${NEOSIS_SEVENZIP_LICENSE_DIR}\COPYING"
  !endif
  !ifdef UNINSTALLER_ICON
    File /oname=uninstallerIcon.ico "${UNINSTALLER_ICON}"
  !endif
  StrCpy $INSTDIR $neosisFinalDirectory
  SetOutPath $PLUGINSDIR
!macroend

Function .onGUIEnd
  Call neosisCleanupDirectories
FunctionEnd

Function neosisCleanupDirectories
  ${If} $neosisFinalDirectory != ""
    Call neosisRollbackDirectories
  ${EndIf}
FunctionEnd

; Only directories created or renamed by this installer are removed during rollback.
Function neosisRollbackDirectories
  SetOutPath $PLUGINSDIR
  ${If} $neosisNewMoved == "1"
    RMDir /r "\\?\$neosisFinalDirectory"
    StrCpy $neosisNewMoved ""
  ${EndIf}
  ${If} $neosisOldMoved == "1"
    ClearErrors
    Rename $neosisOldDirectory $neosisFinalDirectory
    ${If} ${Errors}
      ; Leave the complete backup in place if another process prevents restoration.
      DetailPrint $neosisOldDirectory
      Return
    ${EndIf}
    StrCpy $neosisOldMoved ""
  ${EndIf}
  ${If} $neosisNewDirectory != ""
    RMDir /r "\\?\$neosisNewDirectory"
  ${EndIf}
  StrCpy $INSTDIR $neosisFinalDirectory
FunctionEnd

Function neosisPromoteDirectories
  !ifmacrodef InstallerPublishStage
    !insertmacro InstallerPublishStage 2
  !endif
  ; SetOutPath opens a directory handle; release it before either rename.
  SetOutPath $PLUGINSDIR
  ClearErrors
  ${If} ${FileExists} "$neosisFinalDirectory\*.*"
    Rename $neosisFinalDirectory $neosisOldDirectory
    ${If} ${Errors}
      Call neosisRollbackDirectories
      SetErrors
      Return
    ${EndIf}
    StrCpy $neosisOldMoved "1"
  ${Else}
    ; NSIS can create the destination before the install section starts.
    RMDir $neosisFinalDirectory
  ${EndIf}
  ClearErrors
  Rename $neosisNewDirectory $neosisFinalDirectory
  ${If} ${Errors}
    Call neosisRollbackDirectories
    SetErrors
    Return
  ${EndIf}
  StrCpy $neosisNewMoved "1"
  SetOutPath $neosisFinalDirectory
  !ifmacrodef InstallerPublishStage
    !insertmacro InstallerPublishStage 3
  !endif
  ClearErrors
FunctionEnd

!macro neosisFinishDirectories
  StrCpy $neosisNewMoved ""
  ${If} $neosisOldMoved == "1"
    RMDir /r "\\?\$neosisOldDirectory"
    StrCpy $neosisOldMoved ""
  ${EndIf}
!macroend
