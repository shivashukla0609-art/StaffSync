@echo off
set "PATH=C:\Users\LENOVO\tools\nodejs;%PATH%"

echo ===================================================
echo  Starting StaffSync HRMS...
echo ===================================================

start "StaffSync Backend API" cmd /k "set PATH=C:\Users\LENOVO\tools\nodejs;%%PATH%% && cd server && npm run dev"
start "StaffSync Frontend Client" cmd /k "set PATH=C:\Users\LENOVO\tools\nodejs;%%PATH%% && cd client && npm run dev"

echo Both servers launched!
echo Open your browser at: http://localhost:5173
