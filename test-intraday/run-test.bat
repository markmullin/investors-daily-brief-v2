@echo off
echo Testing intraday data...
cd c:\users\win10user\documents\financial-software\investors-daily-brief\test-intraday
call npm install
node test-intraday.js
pause