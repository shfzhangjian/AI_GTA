$ErrorActionPreference = 'Stop'
$gameDirectory = $PSScriptRoot
$gameAddress = 'http://127.0.0.1:5199/'
$existingGame = $null
try { $existingGame = Invoke-WebRequest -Uri $gameAddress -TimeoutSec 2 -UseBasicParsing } catch {}
if ($existingGame -and $existingGame.Content -notlike '*霓城突围*') {
    throw '5199 端口正在被其他程序占用，请关闭该程序后重试。'
}
if (-not $existingGame) {
    $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCommand) { throw '请先安装 Node.js 20 或更新版本。' }
    $serverFile = Join-Path $gameDirectory 'server.mjs'
    Start-Process -FilePath $nodeCommand.Source -ArgumentList ('"' + $serverFile + '"') -WorkingDirectory $gameDirectory -WindowStyle Hidden
    $gameReady = $false
    for ($attempt = 0; $attempt -lt 25; $attempt++) {
        Start-Sleep -Milliseconds 200
        try {
            $response = Invoke-WebRequest -Uri $gameAddress -TimeoutSec 1 -UseBasicParsing
            if ($response.Content -like '*霓城突围*') { $gameReady = $true; break }
        } catch {}
    }
    if (-not $gameReady) { throw '游戏服务未能启动，请运行 npm start 查看具体错误。' }
}
Start-Process $gameAddress
Write-Host '霓城突围已打开：' $gameAddress
