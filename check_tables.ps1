$headers = @{ 
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZHJoZXFlaWxzem9pbGZ5ZnNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMjIzMDQsImV4cCI6MjEwMDg5ODMwNH0.jePp54Qdw7d-mkH-_Qlh3YvxpC5nJlp3G3XqSgJr-pk'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZHJoZXFlaWxzem9pbGZ5ZnNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMjIzMDQsImV4cCI6MjEwMDg5ODMwNH0.jePp54Qdw7d-mkH-_Qlh3YvxpC5nJlp3G3XqSgJr-pk'
}
$tables = @("organizacion","tarotista","consultante","sesion","tirada","carta","interpretacion","memoria","resumen","perfil_persona","ake_carta","usuario")
$wc = New-Object System.Net.WebClient
foreach($h in $headers.Keys) { $wc.Headers.Add($h, $headers[$h]) }
foreach($t in $tables) {
    try {
        $json = $wc.DownloadString("https://ujdrheqeilszoilfyfsq.supabase.co/rest/v1/$t`?select=*&limit=1000")
        $rows = ($json | ConvertFrom-Json)
        if($rows.Count -gt 0) {
            Write-Host "${t}: OK ($($rows.Count) filas)"
        } else {
            Write-Host "${t}: VACÍA"
        }
    } catch {
        Write-Host "${t}: ERROR - $($_.Exception.Message)"
    }
}
