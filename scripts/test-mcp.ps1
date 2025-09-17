# PowerShell script to test Supabase MCP Master Bot seeding
# Based on MCP_SUPABASE.md examples

param(
    [string]$Command = "health"
)

# Check if environment variables are set
if (-not $env:SUPABASE_URL) {
    Write-Host "❌ SUPABASE_URL environment variable not set" -ForegroundColor Red
    exit 1
}

if (-not $env:SUPABASE_SERVICE_ROLE_KEY) {
    Write-Host "❌ SUPABASE_SERVICE_ROLE_KEY environment variable not set" -ForegroundColor Red
    exit 1
}

$BaseUrl = "$env:SUPABASE_URL/functions/v1/make-server-5976446e/db"
$Headers = @{
    "Authorization" = "Bearer $env:SUPABASE_SERVICE_ROLE_KEY"
    "Content-Type" = "application/json"
}

function Invoke-MCPRequest {
    param(
        [string]$Endpoint,
        [string]$Method = "GET"
    )

    $Url = "$BaseUrl$Endpoint"
    Write-Host "🔍 MCP Request: $Method $Endpoint" -ForegroundColor Blue

    try {
        $Response = Invoke-RestMethod -Uri $Url -Headers $Headers -Method $Method
        Write-Host "✅ Success:" -ForegroundColor Green
        $Response | ConvertTo-Json -Depth 3
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $StatusCode = $_.Exception.Response.StatusCode
            Write-Host "   Status Code: $StatusCode" -ForegroundColor Red
        }
    }
}

Write-Host "🧪 Testing Supabase MCP for Master Bots" -ForegroundColor Cyan
Write-Host "📍 Base URL: $BaseUrl" -ForegroundColor Gray

switch ($Command.ToLower()) {
    "health" {
        Write-Host "`n🔗 Testing database health..." -ForegroundColor Yellow
        Invoke-MCPRequest -Endpoint "/health"
    }

    "tables" {
        Write-Host "`n📋 Listing all tables..." -ForegroundColor Yellow
        Invoke-MCPRequest -Endpoint "/tables"
    }

    "schema" {
        Write-Host "`n📊 Checking users table schema..." -ForegroundColor Yellow
        Invoke-MCPRequest -Endpoint "/describe/users"

        Write-Host "`n🤖 Checking master_bots table schema..." -ForegroundColor Yellow
        Invoke-MCPRequest -Endpoint "/describe/master_bots"
    }

    "current" {
        Write-Host "`n🤖 Getting current master bots..." -ForegroundColor Yellow
        Invoke-MCPRequest -Endpoint "/master-bots"
    }

    "seed" {
        Write-Host "`n🌱 Seeding master bots..." -ForegroundColor Yellow
        Invoke-MCPRequest -Endpoint "/seed/master-bots" -Method "POST"
    }

    "sample" {
        Write-Host "`n🔍 Sampling users table..." -ForegroundColor Yellow
        Invoke-MCPRequest -Endpoint "/sample/users?limit=5"
    }

    "all" {
        Write-Host "`n🔗 Testing database health..." -ForegroundColor Yellow
        Invoke-MCPRequest -Endpoint "/health"

        Write-Host "`n📋 Listing all tables..." -ForegroundColor Yellow
        Invoke-MCPRequest -Endpoint "/tables"

        Write-Host "`n🤖 Getting current master bots..." -ForegroundColor Yellow
        Invoke-MCPRequest -Endpoint "/master-bots"

        Write-Host "`n🌱 Seeding master bots..." -ForegroundColor Yellow
        Invoke-MCPRequest -Endpoint "/seed/master-bots" -Method "POST"

        Write-Host "`n✅ Verifying seeded master bots..." -ForegroundColor Yellow
        Invoke-MCPRequest -Endpoint "/master-bots"
    }

    default {
        Write-Host @"
🎯 Available commands:
   health  - Test database connection
   tables  - List all available tables
   schema  - Check table schemas
   current - Get current master bots
   seed    - Seed master bots to database
   sample  - Sample users table data
   all     - Run complete test suite

Usage: .\test-mcp.ps1 [command]
Example: .\test-mcp.ps1 seed
"@ -ForegroundColor Yellow
    }
}

Write-Host "`n🏁 MCP test completed." -ForegroundColor Cyan









