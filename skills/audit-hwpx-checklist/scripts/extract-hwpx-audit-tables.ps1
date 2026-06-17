param(
  [Parameter(Mandatory = $true)]
  [string]$Source,

  [string[]]$Keywords = @(),

  [string]$ItemCode = "",

  [string]$OutDir = "."
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression.FileSystem

$sourcePath = (Resolve-Path -LiteralPath $Source).Path
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$auditPatterns = @(
  "업무 구분",
  "감사 점검내용",
  "점검 서류",
  "점검 분야",
  "점검 항목",
  "감사 점검 사항",
  "증빙자료"
)

function Test-Hit {
  param([string]$Text)

  foreach ($keyword in $Keywords) {
    if ($keyword -and $Text.Contains($keyword)) {
      return $true
    }
  }

  if ($ItemCode -and $Text.Contains($ItemCode)) {
    return $true
  }

  if ($Keywords.Count -eq 0 -and -not $ItemCode) {
    foreach ($pattern in $auditPatterns) {
      if ($Text.Contains($pattern)) {
        return $true
      }
    }
  }

  return $false
}

$zip = [IO.Compression.ZipFile]::OpenRead($sourcePath)
$entries = $zip.Entries | Where-Object {
  $_.FullName -like "Contents/section*.xml" -or $_.FullName -eq "Contents/header.xml"
}

$allHits = @()
foreach ($entry in $entries) {
  $reader = New-Object IO.StreamReader($entry.Open(), [Text.Encoding]::UTF8)
  $xmlText = $reader.ReadToEnd()
  $reader.Close()

  [xml]$xml = $xmlText
  $nsm = New-Object Xml.XmlNamespaceManager($xml.NameTable)
  $nsm.AddNamespace("hp", "http://www.hancom.co.kr/hwpml/2011/paragraph")

  $tables = $xml.SelectNodes("//hp:tbl", $nsm)
  for ($i = 0; $i -lt $tables.Count; $i++) {
    $tableText = (($tables[$i].SelectNodes(".//hp:t", $nsm) | ForEach-Object { $_."#text" }) -join " ")
    $tableText = ($tableText -replace "\s+", " ").Trim()
    if (-not (Test-Hit -Text $tableText)) {
      continue
    }

    $rows = @()
    $rowIndex = 0
    foreach ($tr in $tables[$i].SelectNodes("./hp:tr", $nsm)) {
      $cells = @()
      foreach ($tc in $tr.SelectNodes("./hp:tc", $nsm)) {
        $cellText = (($tc.SelectNodes(".//hp:t", $nsm) | ForEach-Object { $_."#text" }) -join " ")
        $cells += (($cellText -replace "\s+", " ").Trim())
      }
      $rows += [pscustomobject]@{
        rowIndex = $rowIndex
        cells = $cells
      }
      $rowIndex++
    }

    $allHits += [pscustomobject]@{
      entry = $entry.FullName
      tableIndex = $i
      preview = $tableText.Substring(0, [Math]::Min(220, $tableText.Length))
      rows = $rows
    }
  }
}

$zip.Dispose()

$jsonPath = Join-Path $OutDir "hwpx-audit-tables.json"
$txtPath = Join-Path $OutDir "hwpx-audit-tables.txt"

if ($allHits.Count -eq 0) {
  "[]" | Set-Content -Encoding UTF8 -LiteralPath $jsonPath
} else {
  $allHits | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -LiteralPath $jsonPath
}

$lines = @()
foreach ($hit in $allHits) {
  $lines += "TABLE $($hit.tableIndex) [$($hit.entry)]"
  foreach ($row in $hit.rows) {
    $lines += ("R{0}: {1}" -f $row.rowIndex, ($row.cells -join " || "))
  }
  $lines += ""
}
$lines | Set-Content -Encoding UTF8 -LiteralPath $txtPath

[pscustomobject]@{
  source = $sourcePath
  keywords = $Keywords
  itemCode = $ItemCode
  tableCount = $allHits.Count
  json = (Resolve-Path -LiteralPath $jsonPath).Path
  text = (Resolve-Path -LiteralPath $txtPath).Path
}
