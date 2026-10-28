@echo off
set "PATH=C:\Users\LENOVO\tools\nodejs;%PATH%"

echo ===================================================
echo  Starting StaffSync HRMS Full-Stack Platform...
echo ===================================================

start "StaffSync Backend API (Port 5000)" cmd /k "cd server && set PATH=C:\Users\LENOVO\tools\nodejs;%%PATH%% && npm run dev"
start "StaffSync Frontend Client (Port 5173)" cmd /k "cd client && set PATH=C:\Users\LENOVO\tools\nodejs;%%PATH%% && npm run dev"

echo Backend and Frontend servers launched in separate windows!
echo Open your browser at: http://localhost:5173
pause
