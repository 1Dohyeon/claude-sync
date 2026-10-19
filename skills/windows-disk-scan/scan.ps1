# Fast disk usage scan on Windows using robocopy list mode (/L copies nothing).
# Much faster than Git Bash du/find, which stat every file through the POSIX layer.
#
# Examples:
#   scan.ps1                                  # top folders under C:\ (3 levels)
#   scan.ps1 -Days 14                         # only files changed in the last 14 days
#   scan.ps1 -Root C:\Users\me\AppData        # drill into one folder
#   scan.ps1 -Mode files -MinMB 50 -Days 14   # largest single files
param(
    [string]$Root = 'C:\',
    [int]$Days = 0,
    [int]$MinMB = 0,
    [int]$Depth = 3,
    [ValidateSet('folders', 'files')][string]$Mode = 'folders',
    [int]$Top = 30
)

# A trailing backslash inside a quoted path escapes the quote for robocopy, so keep it only on a drive root.
$Root = $Root.TrimEnd('\')
if ($Root -match '^[A-Za-z]:$') { $Root += '\' }

$roboArgs = @($Root, 'C:\__robocopy_list_only__', '/L', '/S', '/XJ', '/NDL', '/NJH', '/NJS', '/NC', '/BYTES', '/FP', '/TS', '/R:0', '/W:0')
if ($Days -gt 0) { $roboArgs += "/MAXAGE:$Days" }
if ($MinMB -gt 0) { $roboArgs += "/MIN:$([int64]$MinMB * 1MB)" }

# Line shape with /BYTES /TS /FP: "<size> yyyy/MM/dd HH:mm:ss<TAB><full path>", timestamp in UTC.
$pattern = '^\s*(\d+)\s+(\d{4}/\d\d/\d\d \d\d:\d\d:\d\d)\s+(.+?)\s*$'
$rootSegments = $Root.TrimEnd('\').Split('\').Length
$maxIndex = $rootSegments - 1 + $Depth

$entries = & robocopy @roboArgs | ForEach-Object {
    if ($_ -match $pattern) {
        [pscustomobject]@{
            Size     = [int64]$Matches[1]
            Modified = [datetime]::SpecifyKind([datetime]::ParseExact($Matches[2], 'yyyy/MM/dd HH:mm:ss', $null), 'Utc').ToLocalTime()
            Path     = $Matches[3]
        }
    }
}

if ($Mode -eq 'files') {
    $entries | Sort-Object Size -Descending | Select-Object -First $Top |
        Select-Object @{ n = 'MB'; e = { [Math]::Round($_.Size / 1MB) } }, @{ n = 'Modified'; e = { $_.Modified.ToString('yyyy-MM-dd HH:mm') } }, Path |
        Format-Table -AutoSize | Out-String -Width 400
}
else {
    $entries | Group-Object {
        $parts = $_.Path.Split('\')
        $parts[0..([Math]::Min($maxIndex, $parts.Length - 2))] -join '\'
    } | ForEach-Object {
        [pscustomobject]@{
            GB    = [Math]::Round((($_.Group | Measure-Object Size -Sum).Sum) / 1GB, 2)
            Files = $_.Count
            Path  = $_.Name
        }
    } | Sort-Object GB -Descending | Select-Object -First $Top |
        Format-Table -AutoSize | Out-String -Width 400
}

# robocopy returns 1 when it found files; that is not an error.
exit 0
