param([int]$Port=8765)
$taskPython = 'C:\Users\nimna\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
if (!(Test-Path -LiteralPath $taskPython)) { $taskPython='python' }
Write-Output "Open http://localhost:$Port on this computer. Press Ctrl+C to stop."
& $taskPython -m http.server $Port --bind 127.0.0.1 --directory (Join-Path $PSScriptRoot 'app\src\main\assets')
