# Script to bundle all source code into a single timestamped text file
# Usage: .\bundle_code.ps1

$rootDir = $PWD
$timestamp = Get-Date -Format "yyyyMMddHHmm"
$outputFile = "$PWD\TOTALCODE$timestamp.txt"
$controlFile = "$PWD\CONTROL_FILESCODE$timestamp.txt"

# Extensions to include
$includeExtensions = @(".ts", ".tsx", ".js", ".jsx", ".css", ".json", ".md", ".ps1")
$specificFiles = @("package.json", "tsconfig.json", "next.config.js", "README.md", "ROADMAP_MASTER.md", ".env.example")

# Folders to explicitly INCLUDE (relative to root)
$foldersToProcess = @("src", "scripts", "messages")

# Directories to exclude (always ignore these)
$excludeDirs = @("node_modules", ".next", ".git", ".vscode", "tmp", "out", "bin", "obj", "public")

Write-Host "Bundling code from $rootDir to $outputFile..."
Write-Host "Logging status to $controlFile..."

# Create Writers
$mainWriter = [System.IO.StreamWriter]::new($outputFile, $false, [System.Text.Encoding]::UTF8)
$controlWriter = [System.IO.StreamWriter]::new($controlFile, $false, [System.Text.Encoding]::UTF8)

# Separator Constants
$separator = "`r`n================================================================================`r`n"
$separator2 = "================================================================================`r`n"

try {
    # 1. Get files from explicitly included folders
    $allFiles = @()
    foreach ($folder in $foldersToProcess) {
        if (Test-Path "$rootDir\$folder") {
            $allFiles += Get-ChildItem -Path "$rootDir\$folder" -Recurse
        }
    }

    # 2. Get files from root
    $rootFiles = Get-ChildItem -Path $rootDir -Depth 0
    $allFiles += $rootFiles

    $allFiles | Where-Object { 
        $item = $_
        
        # A. Skip Directories themselves
        if ($item.PSIsContainer) { return $false }

        # B. Check if file is in an excluded directory
        $relativePath = Resolve-Path -Path $item.FullName -Relative
        foreach ($ex in $excludeDirs) {
            if ($relativePath -like "*\$ex\*") { return $false }
            if ($relativePath -like ".\$ex\*") { return $false }
        }

        # C. Exclude the output files themselves
        if ($item.Name -like "TOTALCODE*") { return $false }
        if ($item.Name -like "CONTROL_FILES*") { return $false }
        if ($item.Name -like "*.log") { return $false }

        # D. Check Extension OR Specific Filename (Case-Insensitive)
        if ($includeExtensions -contains $item.Extension.ToLower()) { return $true }
        if ($specificFiles -contains $item.Name) { return $true } # specificFiles are usually exact case but PS is case-insensitive by default in comparisons

        return $false
    } | ForEach-Object {
        $filePath = $_.FullName
        $relativePath = Resolve-Path -Path $filePath -Relative
        $status = "KO" # Default
        
        try {
            # Read content (Using .NET directly to avoid PowerShell version issues with -Raw)
            $content = [System.IO.File]::ReadAllText($filePath)
            
            if ([string]::IsNullOrWhiteSpace($content)) {
                $status = "EMPTY"
                $controlWriter.WriteLine("$relativePath : $status")
            }
            else {
                # Append to Bundle
                $header = "FILE: $relativePath`r`n"
                
                $mainWriter.Write($separator)
                $mainWriter.Write($header)
                $mainWriter.Write($separator2)
                $mainWriter.Write($content)
                
                $status = "OK"
                $controlWriter.WriteLine("$relativePath : $status")
                
                Write-Host "Added: $relativePath"
            }
        }
        catch {
            $status = "ERROR: $_"
            $controlWriter.WriteLine("${relativePath} : $status")
            Write-Error "Failed to process ${relativePath}: $_"
        }
    }
}
finally {
    # Close writers explicitly
    $mainWriter.Close()
    $mainWriter.Dispose()
    
    $controlWriter.Close()
    $controlWriter.Dispose()
}

Write-Host "Done! Code bundle: $outputFile"
