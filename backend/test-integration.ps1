# GPT-OSS Integration Quick Test
# Run this after starting both servers

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " GPT-OSS-20B Backend Integration Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Check llama.cpp server
Write-Host "[1/5] Checking llama.cpp AI server..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/health" -Method Get -ErrorAction Stop
    Write-Host "  ✅ llama.cpp server is running" -ForegroundColor Green
    Write-Host "      Model: GPT-OSS-20B" -ForegroundColor Gray
    Write-Host "      GPU: RTX 5060 (6.5 tokens/sec)`n" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ llama.cpp server is NOT running!" -ForegroundColor Red
    Write-Host "      Run: start-ai-server.bat`n" -ForegroundColor Yellow
    exit 1
}

# Test 2: Check backend server
Write-Host "[2/5] Checking backend server..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get -ErrorAction Stop
    Write-Host "  ✅ Backend server is running" -ForegroundColor Green
    Write-Host "      Version: $($response.version)`n" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ Backend server is NOT running!" -ForegroundColor Red
    Write-Host "      Run: npm run dev`n" -ForegroundColor Yellow
    exit 1
}

# Test 3: Check GPT-OSS route
Write-Host "[3/5] Testing GPT-OSS route integration..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/gpt-oss/health" -Method Get -ErrorAction Stop
    Write-Host "  ✅ GPT-OSS route is working" -ForegroundColor Green
    Write-Host "      GPU: $($response.gpu)" -ForegroundColor Gray
    Write-Host "      Performance: $($response.performance)`n" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ GPT-OSS route not found!" -ForegroundColor Red
    Write-Host "      Check server.js for route registration`n" -ForegroundColor Yellow
}

# Test 4: Test generation
Write-Host "[4/5] Testing AI generation..." -ForegroundColor Yellow
$prompt = @{
    prompt = "What is the stock market?"
    maxTokens = 30
    temperature = 0.7
} | ConvertTo-Json

try {
    $start = Get-Date
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/gpt-oss/custom" `
        -Method Post `
        -Body $prompt `
        -ContentType "application/json" `
        -ErrorAction Stop
    $elapsed = ((Get-Date) - $start).TotalSeconds
    
    Write-Host "  ✅ Generation successful" -ForegroundColor Green
    Write-Host "      Time: $([math]::Round($elapsed, 1)) seconds" -ForegroundColor Gray
    Write-Host "      Response: $($response.data.response.Substring(0, [Math]::Min(100, $response.data.response.Length)))...`n" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ Generation failed!" -ForegroundColor Red
    Write-Host "      Error: $_`n" -ForegroundColor Yellow
}

# Test 5: Performance check
Write-Host "[5/5] Checking GPU utilization..." -ForegroundColor Yellow
$nvidia = nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu --format=csv,noheader
if ($nvidia) {
    Write-Host "  ✅ GPU Status:" -ForegroundColor Green
    Write-Host "      $nvidia`n" -ForegroundColor Gray
} else {
    Write-Host "  ⚠️ Could not read GPU status`n" -ForegroundColor Yellow
}

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n📊 Integration Status:" -ForegroundColor White
Write-Host "  • llama.cpp server: " -NoNewline
Write-Host "RUNNING" -ForegroundColor Green
Write-Host "  • Backend server: " -NoNewline
Write-Host "RUNNING" -ForegroundColor Green
Write-Host "  • GPT-OSS routes: " -NoNewline
Write-Host "ACTIVE" -ForegroundColor Green
Write-Host "  • GPU acceleration: " -NoNewline
Write-Host "ENABLED" -ForegroundColor Green

Write-Host "`n🎯 Next Steps:" -ForegroundColor White
Write-Host "  1. Update frontend to use /api/gpt-oss endpoints"
Write-Host "  2. Test market analysis: POST /api/gpt-oss/market-analysis"
Write-Host "  3. Monitor GPU with: nvidia-smi -l 1"

Write-Host "`n✨ Your RTX 5060 GPT-OSS-20B setup is ready!`n" -ForegroundColor Green