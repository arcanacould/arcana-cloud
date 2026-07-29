$ErrorActionPreference = "Stop"
$sql = Get-Content -Raw "migrations\002_chat_columns.sql"
$body = @{ query = $sql } | ConvertTo-Json

$headers = @{
  apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZHJoZXFlaWxzem9pbGZ5ZnNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMjIzMDQsImV4cCI6MjEwMDg5ODMwNH0.jePp54Qdw7d-mkH-_Qlh3YvxpC5nJlp3G3XqSgJr-pk"
  Authorization = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZHJoZXFlaWxzem9pbGZ5ZnNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTMyMjMwNCwiZXhwIjoyMTAwODk4MzA0fQ.dummy"
}

try {
  Invoke-RestMethod -Uri "https://ujdrheqeilszoilfyfsq.supabase.co/rest/v1/rpc/sql" -Method Post -Headers $headers -Body $body -ContentType "application/json"
  Write-Host "Migration applied successfully" -ForegroundColor Green
} catch {
  Write-Host "Could not run via RPC. Please run the SQL manually in Supabase SQL Editor:" -ForegroundColor Yellow
  Write-Host ""
  Write-Host $sql -ForegroundColor Cyan
}
