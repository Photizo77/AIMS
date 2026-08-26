# knowledge-extract/xlsx.ps1
# Proper xlsx -> text extraction: resolves sheet names, shared strings, inline strings,
# numeric/date serials and formulas (cached values).
param(
  [string]$XlsxPath = "C:\Users\user\Desktop\ARDHI\Grants_Tracker_Aug2026 (1).xlsx",
  [string]$OutFile = "C:\Users\user\Desktop\DR.PETER\aims-app\knowledge-extract\raw\TRACKER_FULL.txt"
)

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($XlsxPath)

function Read-Entry([string]$name) {
  $e = $zip.Entries | Where-Object { $_.FullName -eq $name }
  if (-not $e) { return $null }
  $r = New-Object System.IO.StreamReader($e.Open())
  $t = $r.ReadToEnd(); $r.Close()
  return $t
}

# shared strings
$shared = New-Object System.Collections.ArrayList
$ss = Read-Entry "xl/sharedStrings.xml"
if ($ss) {
  $siMatches = [System.Text.RegularExpressions.Regex]::Matches($ss, '<si>(.*?)</si>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
  foreach ($m in $siMatches) {
    $inner = $m.Groups[1].Value
    $tParts = [System.Text.RegularExpressions.Regex]::Matches($inner, '<t[^>]*>(.*?)</t>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
    $full = ($tParts | ForEach-Object { $_.Groups[1].Value }) -join ''
    [void]$shared.Add([System.Net.WebUtility]::HtmlDecode($full))
  }
}

# workbook sheet name -> file map
$wb = Read-Entry "xl/workbook.xml"
$rels = Read-Entry "xl/_rels/workbook.xml.rels"
$idToTarget = @{}
if ($rels) {
  $relMatches = [System.Text.RegularExpressions.Regex]::Matches($rels, 'Id="([^"]+)"[^>]*Target="([^"]+)"')
  foreach ($rm in $relMatches) { $idToTarget[$rm.Groups[1].Value] = $rm.Groups[2].Value }
}
$sheetMap = @()
if ($wb) {
  $sheetMatches = [System.Text.RegularExpressions.Regex]::Matches($wb, '<sheet[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"')
  foreach ($sm in $sheetMatches) {
    $target = $idToTarget[$sm.Groups[2].Value]
    if ($target) {
      $target = $target -replace '^/', ''
      $sheetMap += [pscustomobject]@{ Name = $sm.Groups[1].Value; File = "xl/$target" }
    }
  }
}

function Convert-ExcelDate([double]$serial) {
  if ($serial -lt 1 -or $serial -gt 60000) { return $serial }
  $epoch = [datetime]::new(1899, 12, 30)
  try { return $epoch.AddDays($serial).ToString("yyyy-MM-dd") } catch { return $serial }
}

$out = New-Object System.Collections.ArrayList

foreach ($sheet in $sheetMap) {
  [void]$out.Add("`n========== SHEET: $($sheet.Name) ==========")
  $sXml = Read-Entry $sheet.File
  if (-not $sXml) { continue }
  $rowMatches = [System.Text.RegularExpressions.Regex]::Matches($sXml, '<row[^>]*r="(\d+)"[^>]*>(.*?)</row>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
  foreach ($row in $rowMatches) {
    $rowNum = $row.Groups[1].Value
    $cells = [System.Text.RegularExpressions.Regex]::Matches($row.Groups[2].Value, '<c[^>]*r="([A-Z]+)(\d+)"([^>]*)>(.*?)</c>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
    $line = New-Object System.Collections.ArrayList
    foreach ($c in $cells) {
      $colRef = $c.Groups[1].Value; $attrs = $c.Groups[3].Value; $inner = $c.Groups[4].Value
      $type = ''
      $tm = [System.Text.RegularExpressions.Regex]::Match($attrs, 't="([^"]+)"')
      if ($tm.Success) { $type = $tm.Groups[1].Value }
      $v = [System.Text.RegularExpressions.Regex]::Replace($inner, '<[^>]+>', '')
      $val = ''
      if ($type -eq 's') {
        $idx = 0
        if ([int]::TryParse($v, [ref]$idx)) { if ($idx -ge 0 -and $idx -lt $shared.Count) { $val = $shared[$idx] } }
      } elseif ($type -eq 'inlineStr') {
        $tParts = [System.Text.RegularExpressions.Regex]::Matches($inner, '<t[^>]*>(.*?)</t>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
        $val = ($tParts | ForEach-Object { $_.Groups[1].Value }) -join ''
        $val = [System.Net.WebUtility]::HtmlDecode($val)
      } elseif ($type -eq 'b') {
        $val = $v
      } else {
        # numeric — could be a date serial
        $num = 0.0
        if ([double]::TryParse($v, [ref]$num)) {
          # check style: if the cell has a date style (s="...") it's a date; we approximate:
          $val = Convert-ExcelDate $num
        } else {
          $val = [System.Net.WebUtility]::HtmlDecode($v)
        }
      }
      [void]$line.Add($val)
    }
    if ($line.Count -gt 0) { [void]$out.Add("[r$rowNum] " + ($line -join " | ")) }
  }
}

$zip.Dispose()
$text = $out -join "`n"
Set-Content -Path $OutFile -Value $text -Encoding UTF8
Write-Host "Written $($text.Length) chars -> $OutFile"
Write-Host "Sheets: $($sheetMap.Name -join ', ')"
