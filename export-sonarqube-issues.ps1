# SonarQube Issues Export Script
# Usage: Update the variables below with your SonarQube details, then run this script

# ===== CONFIGURATION - UPDATE THESE =====
$sonarUrl = "https://sonarcloud.io"  # Or your SonarQube server URL
$projectKey = "FoodCop_foodcop"      # Your project key from SonarQube
$token = "YOUR_SONARQUBE_TOKEN"      # Generate from User > My Account > Security in SonarQube

# ===== SCRIPT =====
$outputFile = "sonarqube-issues-report.json"
$csvFile = "sonarqube-issues-report.csv"

Write-Host "Fetching issues from SonarQube..." -ForegroundColor Cyan

try {
    # Create authorization header
    $base64Token = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${token}:"))
    $headers = @{
        Authorization = "Basic $base64Token"
    }

    # Fetch all issues (paginated)
    $allIssues = @()
    $page = 1
    $pageSize = 500
    $total = 0

    do {
        Write-Host "Fetching page $page..." -ForegroundColor Yellow
        
        $response = Invoke-RestMethod -Uri "$sonarUrl/api/issues/search?componentKeys=$projectKey&ps=$pageSize&p=$page" -Headers $headers -Method Get
        
        $allIssues += $response.issues
        $total = $response.total
        $page++
        
        Write-Host "  Fetched $($allIssues.Count) of $total issues" -ForegroundColor Gray
        
    } while ($allIssues.Count -lt $total)

    Write-Host "`nTotal issues fetched: $($allIssues.Count)" -ForegroundColor Green

    # Save as JSON
    $allIssues | ConvertTo-Json -Depth 10 | Out-File $outputFile -Encoding UTF8
    Write-Host "Saved JSON report to: $outputFile" -ForegroundColor Green

    # Convert to CSV for easier viewing
    $csvData = $allIssues | Select-Object `
        severity,
        type,
        @{Name='rule';Expression={$_.rule}},
        @{Name='component';Expression={$_.component -replace '.*:', ''}},
        @{Name='line';Expression={$_.textRange.startLine}},
        message,
        status,
        @{Name='effort';Expression={$_.effort}} | 
        Sort-Object severity, type

    $csvData | Export-Csv -Path $csvFile -NoTypeInformation -Encoding UTF8
    Write-Host "Saved CSV report to: $csvFile" -ForegroundColor Green

    # Show summary
    Write-Host "`n===== ISSUES SUMMARY =====" -ForegroundColor Cyan
    $allIssues | Group-Object severity | Sort-Object Count -Descending | ForEach-Object {
        Write-Host "$($_.Name): $($_.Count)" -ForegroundColor $(
            switch ($_.Name) {
                "BLOCKER" { "Red" }
                "CRITICAL" { "Red" }
                "MAJOR" { "Yellow" }
                "MINOR" { "Gray" }
                default { "White" }
            }
        )
    }

    Write-Host "`n===== ISSUE TYPES =====" -ForegroundColor Cyan
    $allIssues | Group-Object type | Sort-Object Count -Descending | ForEach-Object {
        Write-Host "$($_.Name): $($_.Count)" -ForegroundColor White
    }

    # Show critical issues
    $criticalIssues = $allIssues | Where-Object { $_.severity -eq "CRITICAL" -or $_.severity -eq "BLOCKER" }
    if ($criticalIssues.Count -gt 0) {
        Write-Host "`n===== CRITICAL/BLOCKER ISSUES =====" -ForegroundColor Red
        $criticalIssues | Select-Object -First 10 | ForEach-Object {
            Write-Host "  [$($_.severity)] $($_.component -replace '.*:', '') (Line $($_.textRange.startLine))" -ForegroundColor Red
            Write-Host "    $($_.message)" -ForegroundColor Gray
            Write-Host ""
        }
        if ($criticalIssues.Count -gt 10) {
            Write-Host "  ... and $($criticalIssues.Count - 10) more critical issues" -ForegroundColor Gray
        }
    }

} catch {
    Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nPlease check:" -ForegroundColor Yellow
    Write-Host "  1. Your SonarQube URL is correct" -ForegroundColor Gray
    Write-Host "  2. Your project key is correct (find it in SonarQube project settings)" -ForegroundColor Gray
    Write-Host "  3. Your token has the correct permissions (Generate from User > My Account > Security)" -ForegroundColor Gray
    Write-Host "  4. You have internet connectivity" -ForegroundColor Gray
}

Write-Host "`nDone!" -ForegroundColor Green
