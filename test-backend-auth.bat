@echo off
echo Testing backend authentication...
echo.

powershell -Command "$response = Invoke-WebRequest -Uri 'http://localhost:3001/api/auth/login' -Method POST -Body '{\"username\":\"testdoc\",\"password\":\"Test123!\"}' -ContentType 'application/json' -ErrorAction Stop; Write-Host 'Status:' $response.StatusCode; Write-Host 'Response:'; $response.Content"

echo.
pause
