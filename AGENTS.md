# 專案操作規則

## 更新至 GitHub

當使用者說「更新至 GitHub」、「上傳到 GitHub」或意思相同的指令時：

1. 執行 `npm run build`，確認網站可以建置。
2. 檢查 `git status --short`，不要加入與本次網站修改無關的檔案。
3. 絕對不要強制加入或上傳 `google_apps_script.gs`；此檔案必須維持在 `.gitignore` 中。
4. 將網站相關修改加入暫存區，建立內容清楚的提交。
5. 推送目前分支至 `origin`；本專案預設分支為 `main`。
6. 若沒有待提交內容，仍可執行 `git push origin main` 確認遠端同步狀態。
7. 回覆使用者提交編號、分支與推送結果。

使用者也可以在專案終端執行：

```powershell
npm run github:update
```

若要指定提交訊息：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/update-github.ps1 -CommitMessage "更新網站功能"
```
