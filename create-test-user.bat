@echo off
echo ========================================
echo Creating Test User
echo ========================================
echo.
echo Username: testdoc
echo Password: Test123!
echo Role: doctor
echo Clearance: Secret (2)
echo.

powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/register' -Method POST -Body (@{username='testdoc';password='Test123!';role='doctor';clearanceLevel=2} | ConvertTo-Json) -ContentType 'application/json'; Write-Host 'SUCCESS: User created'; Write-Host ($response | ConvertTo-Json) } catch { Write-Host 'ERROR:' $_.Exception.Message; if ($_.Exception.Response) { $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream()); Write-Host $reader.ReadToEnd() } }"

echo.
echo ========================================
echo Testing Login
echo ========================================
echo.

powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/login' -Method POST -Body (@{username='testdoc';password='Test123!'} | ConvertTo-Json) -ContentType 'application/json'; Write-Host 'SUCCESS: Login works'; Write-Host 'Access Token:' $response.accessToken.Substring(0, 20)... } catch { Write-Host 'ERROR:' $_.Exception.Message }"

echo.
echo ========================================
echo Done! You can now login at http://localhost:3000
echo ========================================
pause
