# 1. Uninstall agy (assuming it's installed via npm or as an executable in path)
Write-Host "Uninstalling agy..."
# Try to find and remove if it is an npm package
if (Get-Command npm -ErrorAction SilentlyContinue) {
    npm uninstall -g @antigravity/cli
}

# 2. Remove hidden configuration folders (common locations)
Write-Host "Removing configuration folders..."
$configDirs = @(
    "$env:USERPROFILE\.agy",
    "$env:APPDATA\agy",
    "$env:LOCALAPPDATA\agy"
)

foreach ($dir in $configDirs) {
    if (Test-Path $dir) {
        Remove-Item -Path $dir -Recurse -Force
        Write-Host "Removed $dir"
    }
}

# 3. Clear Environment Variable
Write-Host "Clearing environment variables..."
[System.Environment]::SetEnvironmentVariable('GEMINI_API_KEY', $null, 'User')
[System.Environment]::SetEnvironmentVariable('GEMINI_API_KEY', $null, 'Process')

Write-Host "Cleanup Complete. Now you can perform a fresh installation."
