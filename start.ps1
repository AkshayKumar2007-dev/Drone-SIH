$ErrorActionPreference='SilentlyContinue'
Get-Process node | Where-Object { $_.Path -like '*node*' } | Out-String | Write-Host
Write-Host "Starting vite..."
$p = Start-Process -FilePath "C:\Program Files\nodejs\node.exe" -ArgumentList ".\node_modules\vite\bin\vite.js","--host","0.0.0.0","--port","5173" -WorkingDirectory "C:\Users\aksha\Documents\Default Project\drone-game" -WindowStyle Hidden -PassThru
Write-Host "PID=$($p.Id)"
Start-Sleep -Seconds 4
netstat -ano | findstr 5173 | Write-Host
Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Format-Table -AutoSize | Out-String | Write-Host
Write-Host "done"