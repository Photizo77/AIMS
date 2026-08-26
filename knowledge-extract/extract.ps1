# knowledge-extract/extract.ps1
# Extracts text from ARDHI docx documents and the grants tracker xlsx into raw text files.
param(
  [string]$Source = "C:\Users\user\Desktop\ARDHI",
  [string]$OutDir = "C:\Users\user\Desktop\DR.PETER\aims-app\knowledge-extract\raw"
)

Add-Type -AssemblyName System.IO.Compression.FileSystem
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

function Get-DocxText([string]$path) {
  try {
    $zip = [System.IO.Compression.ZipFile]::OpenRead($path)
    $entry = $zip.Entries | Where-Object { $_.FullName -eq "word/document.xml" }
    if (-not $entry) { $zip.Dispose(); return "NO CONTENT" }
    $reader = New-Object System.IO.StreamReader($entry.Open())
    $xml = $reader.ReadToEnd()
    $reader.Close(); $zip.Dispose()
    $xml = $xml -replace '<w:tab[^>]*/>', "`t" -replace '<w:br[^>]*/>', "`n" -replace '</w:p>', "`n" -replace '<w:tr[^>]*>', "`n" -replace '</w:tc>', " | "
    $text = [System.Text.RegularExpressions.Regex]::Replace($xml, '<[^>]+>', '')
    $text = [System.Net.WebUtility]::HtmlDecode($text)
    $text = [System.Text.RegularExpressions.Regex]::Replace($text, "`r`n+", "`n")
    $text = [System.Text.RegularExpressions.Regex]::Replace($text, "(\s*`n\s*){3,}", "`n`n")
    return $text.Trim()
  } catch { return "EXTRACT ERROR: $($_.Exception.Message)" }
}

function Get-XlsxText([string]$path) {
  try {
    $zip = [System.IO.Compression.ZipFile]::OpenRead($path)
    # shared strings
    $shared = @()
    $ss = $zip.Entries | Where-Object { $_.FullName -eq "xl/sharedStrings.xml" }
    if ($ss) {
      $r = New-Object System.IO.StreamReader($ss.Open())
      $ssXml = $r.ReadToEnd(); $r.Close()
      $matches = [System.Text.RegularExpressions.Regex]::Matches($ssXml, '<si>(.*?)</si>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
      foreach ($m in $matches) {
        $t = [System.Text.RegularExpressions.Regex]::Replace($m.Groups[1].Value, '<[^>]+>', '')
        $shared += [System.Net.WebUtility]::HtmlDecode($t)
      }
    }
    $out = @()
    $sheets = $zip.Entries | Where-Object { $_.FullName -match '^xl/worksheets/sheet\d+\.xml$' } | Sort-Object FullName
    foreach ($s in $sheets) {
      $r = New-Object System.IO.StreamReader($s.Open())
      $sXml = $r.ReadToEnd(); $r.Close()
      $out += "===== SHEET: $($s.FullName) ====="
      $rowMatches = [System.Text.RegularExpressions.Regex]::Matches($sXml, '<row[^>]*>(.*?)</row>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
      foreach ($row in $rowMatches) {
        $cells = [System.Text.RegularExpressions.Regex]::Matches($row.Groups[1].Value, '<c[^>]*r="([A-Z]+\d+)"[^>]*?(?:t="([^"]+)")?[^>]*>(.*?)</c>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
        $line = @()
        foreach ($c in $cells) {
          $ref = $c.Groups[1].Value; $type = $c.Groups[2].Value; $inner = $c.Groups[3].Value
          if ($type -eq "s") {
            $idx = [int]$inner -replace '<[^>]+>', ''
            if ($idx -ge 0 -and $idx -lt $shared.Count) { $line += $shared[$idx] }
          } elseif ($type -eq "inlineStr") {
            $t = [System.Text.RegularExpressions.Regex]::Replace($inner, '<[^>]+>', '')
            $line += [System.Net.WebUtility]::HtmlDecode($t)
          } else {
            $v = [System.Text.RegularExpressions.Regex]::Replace($inner, '<[^>]+>', '')
            $line += [System.Net.WebUtility]::HtmlDecode($v)
          }
        }
        if ($line.Count -gt 0) { $out += ($line -join "`t") }
      }
    }
    $zip.Dispose()
    return ($out -join "`n")
  } catch { return "EXTRACT ERROR: $($_.Exception.Message)" }
}

# Process docx files
Get-ChildItem $Source -Recurse -Filter *.docx -File | ForEach-Object {
  if ($_.Name -like "~$*") { return }  # skip temp lock files
  $text = Get-DocxText $_.FullName
  $base = $_.BaseName -replace '[^\w\-]', '_'
  $outFile = Join-Path $OutDir "DOCX_$base.txt"
  Set-Content -Path $outFile -Value $text -Encoding UTF8
  Write-Host "DOCX: $($_.FullName) -> $outFile ($($text.Length) chars)"
}

# Process xlsx files
Get-ChildItem $Source -Recurse -Filter *.xlsx -File | ForEach-Object {
  $text = Get-XlsxText $_.FullName
  $base = $_.BaseName -replace '[^\w\-]', '_'
  $outFile = Join-Path $OutDir "XLSX_$base.txt"
  Set-Content -Path $outFile -Value $text -Encoding UTF8
  Write-Host "XLSX: $($_.FullName) -> $outFile ($($text.Length) chars)"
}

Write-Host "DONE"
