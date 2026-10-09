param([string]$GitPath = '')
$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
if (-not $GitPath) {
    $gitCommand = Get-Command git -ErrorAction SilentlyContinue
    if ($gitCommand) { $GitPath = $gitCommand.Source }
    else {
        $desktopRoot = Join-Path $env:LOCALAPPDATA 'GitHubDesktop'
        $candidates = @(Get-ChildItem -LiteralPath $desktopRoot -Directory -Filter 'app-*' -ErrorAction SilentlyContinue |
            ForEach-Object { Join-Path $_.FullName 'resources\app\git\cmd\git.exe' } |
            Where-Object { Test-Path -LiteralPath $_ } | Sort-Object -Descending)
        if ($candidates.Count) { $GitPath = $candidates[0] }
        else { throw 'Git was not found. Pass -GitPath with the path to git.exe, or view History in GitHub Desktop.' }
    }
}
Write-Output 'Recorded commit history'
& $GitPath -C $repositoryRoot log --all --date=iso-strict '--pretty=format:%h | %an | %ad | %s'
if ($LASTEXITCODE -ne 0) { throw 'Unable to read repository history.' }
Write-Output "`nRecorded author totals"
& $GitPath -C $repositoryRoot shortlog --summary --numbered --all
if ($LASTEXITCODE -ne 0) { throw 'Unable to read author totals.' }
