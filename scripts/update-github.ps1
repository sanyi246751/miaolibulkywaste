param(
  [string]$CommitMessage = "更新網站"
)

$ErrorActionPreference = 'Stop'

npm run build
if ($LASTEXITCODE -ne 0) { throw '網站建置失敗，已停止 GitHub 更新。' }

git add -A
if ($LASTEXITCODE -ne 0) { throw '無法加入 Git 暫存區。' }

$stagedFiles = @(git diff --cached --name-only)
if ($stagedFiles -contains 'google_apps_script.gs') {
  git restore --staged -- google_apps_script.gs
  throw '安全檢查：google_apps_script.gs 不可上傳，已停止更新。'
}

if ($stagedFiles.Count -gt 0) {
  git commit -m $CommitMessage
  if ($LASTEXITCODE -ne 0) { throw 'Git commit 失敗。' }
} else {
  Write-Host '沒有新的網站修改需要提交。'
}

$currentBranch = (git branch --show-current).Trim()
if (-not $currentBranch) { throw '無法判斷目前 Git 分支。' }

git push origin $currentBranch
if ($LASTEXITCODE -ne 0) { throw 'GitHub 推送失敗。' }

$latestCommit = (git rev-parse --short HEAD).Trim()
Write-Host "GitHub 更新完成：$currentBranch / $latestCommit"
