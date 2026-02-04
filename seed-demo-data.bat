@echo off
echo ========================================
echo PulseLogic Demo Data Seeder
echo ========================================
echo.
echo This will create demo users and medical cases.
echo.
echo Demo Users:
echo   - dr.smith / Demo123! (Doctor, Secret clearance)
echo   - medic.jones / Demo123! (Medic, Confidential clearance)
echo   - spec.wilson / Demo123! (Specialist, Confidential clearance)
echo   - admin / Demo123! (Admin, Secret clearance)
echo.
echo Demo Cases: 3 synthetic medical cases with varying severity
echo.
pause

echo.
echo Seeding demo data...
powershell -Command "$body = '{}' | ConvertTo-Json; $token = (Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/login' -Method POST -Body (@{username='admin';password='Admin123!'} | ConvertTo-Json) -ContentType 'application/json').accessToken; Invoke-RestMethod -Uri 'http://localhost:3001/api/demo/seed' -Method POST -Headers @{Authorization=\"Bearer $token\"} -Body $body -ContentType 'application/json'"

echo.
echo ========================================
echo Demo data seeded successfully!
echo ========================================
echo.
echo You can now login with any of the demo users.
echo.
pause
