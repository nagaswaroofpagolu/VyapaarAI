Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Starting VyapaarAI Spring Boot Backend..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\backend"
& "C:\Users\Dell\.m2\wrapper\dists\apache-maven-3.9.15\0226a00282e400185496f3b60ec5a3f029cbdc6893912937d4876d57695224e1\bin\mvn.cmd" spring-boot:run
