param([string]$Script, [string]$Plan, [string]$Case)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.UTF8Encoding]::new()
$spec = Get-Content -LiteralPath $Plan -Raw -Encoding UTF8 | ConvertFrom-Json
$global:neosisNetworkRules = @()
$global:neosisNetworkCreated = 0
$global:neosisNetworkRemoved = 0
function Get-NetFirewallRule { param($PolicyStore) return $global:neosisNetworkRules }
function Get-NetFirewallApplicationFilter {
    param([Parameter(ValueFromPipeline = $true)]$InputObject)
    process { return [pscustomobject]@{ Program = $InputObject.Program } }
}
function New-NetFirewallRule {
    param($Name, $DisplayName, $Description, $Direction, $Program, $Action, $Profile, $Enabled, $PolicyStore)
    $global:neosisNetworkCreated++
    if ($Case -eq 'creation-failure') { throw 'inert creation failure' }
    $global:neosisNetworkRules = @([pscustomobject]@{ Name = $Name; Description = $Description; Direction = $Direction;
        Program = $Program; Action = $Action; Enabled = $Enabled; Profile = $Profile; PolicyStore = $PolicyStore })
    return $global:neosisNetworkRules
}
function Remove-NetFirewallRule {
    param([Parameter(ValueFromPipeline = $true)]$InputObject)
    process {
        $global:neosisNetworkRemoved++
        if ($Case -ne 'restore-failure') { $global:neosisNetworkRules = @() }
    }
}
function Read-Host {
    param($Prompt)
    if ($Case -in @('declined', 'restore-declined')) { return 'NO' }
    if ($Case -eq 'changed-during-confirmation') { [IO.File]::WriteAllText($spec.executable, 'changed during confirmation') }
    if ($Prompt -like 'Type RESTORE*') { return "RESTORE $($spec.runId)" }
    return "BLOCK $($spec.runId)"
}
if ($Case -in @('existing', 'foreign', 'restore', 'restore-failure', 'restore-declined', 'status')) {
    $global:neosisNetworkRules = @([pscustomobject]@{ Name = $spec.ruleName; Direction = 'Outbound'; Action = 'Block';
        Program = $spec.executable; Enabled = 'True'; Description = "neosis-update-qualification:$($spec.runId):$($spec.sha512Hex)" })
    if ($Case -eq 'foreign') { $global:neosisNetworkRules[0].Program = 'C:\not-the-test-application.exe' }
}
$action = if ($Case -like 'restore*') { 'Restore' } elseif ($Case -eq 'status') { 'Status' } else { 'Block' }
$failure = $null
try { & $Script -Plan $Plan -Action $action } catch { $failure = $_.Exception.Message }
@{ failure = $failure; created = $global:neosisNetworkCreated; removed = $global:neosisNetworkRemoved;
    remaining = $global:neosisNetworkRules.Count } | ConvertTo-Json -Compress
