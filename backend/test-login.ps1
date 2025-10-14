Write-Host "`n🚀 Testing admin-login endpoint..." -ForegroundColor Cyan
Write-Host "Waiting for Render to deploy new code (this may take 2-3 minutes)...`n" -ForegroundColor Yellow

$maxAttempts = 20
$attempt = 0

while ($attempt -lt $maxAttempts) {
    $attempt++
    Write-Host "Attempt $attempt/$maxAttempts..." -ForegroundColor Gray
    
    try {
        $body = @{
            user_id = "admin"
            password = "admin123"
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "https://academic-portal-api.onrender.com/api/v1/auth/admin-login" `
            -Method POST `
            -Body $body `
            -ContentType "application/json" `
            -ErrorAction Stop
        
        Write-Host "`n✅ SUCCESS! Endpoint is working!" -ForegroundColor Green
        Write-Host "=" * 60
        Write-Host "Access Token received!" -ForegroundColor Green
        Write-Host "User: $($response.user.username)" -ForegroundColor White
        Write-Host "Role: $($response.user.role)" -ForegroundColor White
        Write-Host "=" * 60
        Write-Host "`n🌐 Now try logging in at: http://localhost:3000/login" -ForegroundColor Cyan
        Write-Host "   Username: admin" -ForegroundColor White
        Write-Host "   Password: admin123`n" -ForegroundColor White
        exit 0
    }
    catch {
        if ($_.Exception.Message -like "*404*") {
            Write-Host "  Still deploying..." -ForegroundColor Yellow
        }
        elseif ($_.Exception.Message -like "*401*") {
            Write-Host "`n❌ Credentials invalid!" -ForegroundColor Red
            exit 1
        }
        else {
            Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    if ($attempt -lt $maxAttempts) {
        Start-Sleep -Seconds 10
    }
}

Write-Host "`n⏱️ Deployment is taking longer than expected." -ForegroundColor Yellow
Write-Host "Check deployment status at: https://dashboard.render.com" -ForegroundColor Cyan
