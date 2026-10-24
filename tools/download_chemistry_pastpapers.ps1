$ErrorActionPreference = 'Stop'
$base = 'https://bestexamhelp.com/exam/cambridge-international-a-level/chemistry-9701/'
$target = Join-Path (Get-Location) '化学\pastpaper'
$temp = Join-Path $env:TEMP 'bestexamhelp_chemistry_index.html'

New-Item -ItemType Directory -Force -Path $target | Out-Null

function Get-Page([string]$url, [string]$outFile) {
  & curl.exe -4 -L --fail --max-time 45 --retry 2 -A 'Mozilla/5.0' -sS -o $outFile $url
  if ($LASTEXITCODE -ne 0) { throw "页面下载失败: $url" }
  return Get-Content -Raw -LiteralPath $outFile
}

$index = Get-Page ($base + 'index.php') $temp
$sessionMatches = [regex]::Matches($index, 'href=["''](20\d{2}/(?:march|summer|winter)\.php)["'']', 'IgnoreCase')
$sessions = @($sessionMatches | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)

$manifest = [System.Collections.Generic.List[object]]::new()
$failures = [System.Collections.Generic.List[object]]::new()

foreach ($session in $sessions) {
  $sessionUrl = $base + $session
  $sessionFile = Join-Path $env:TEMP (('chem_' + ($session -replace '[\\/.]','_')) + '.html')
  try { $html = Get-Page $sessionUrl $sessionFile } catch { $failures.Add([pscustomobject]@{Url=$sessionUrl;Reason=$_.Exception.Message}); continue }

  $parts = $session.Split('/')
  $year = $parts[0]
  $season = switch ($parts[1]) { 'march.php' {'三月'} 'summer.php' {'六月'} 'winter.php' {'十一月'} }
  $sessionRoot = Join-Path $target (Join-Path $year $season)
  $links = [regex]::Matches($html, 'href=["'']([^"'']+\.php)["'']', 'IgnoreCase') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique

  $selected = foreach ($link in $links) {
    $kind = $null
    $folder = $null
    if ($link -match '^9701-[^-]+-qp-\d+\.php$') { $kind='卷子'; $folder='卷子' }
    elseif ($link -match '^9701-[^-]+-ms-\d+\.php$') { $kind='答案'; $folder='答案' }
    elseif ($link -match '^9701-[^-]+-er\.php$') { $kind='考官评价'; $folder='考官评价' }
    if ($kind) { [pscustomobject]@{Link=$link;Kind=$kind;Folder=$folder} }
  }

  foreach ($item in $selected) {
    $pdfName = [IO.Path]::GetFileNameWithoutExtension($item.Link).Replace('-','_') + '.pdf'
    $pdfUrl = $sessionUrl -replace '[^/]+$','' 
    $pdfUrl = $pdfUrl + $pdfName
    $outDir = Join-Path $sessionRoot $item.Folder
    $outFile = Join-Path $outDir $pdfName
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
    if (Test-Path -LiteralPath $outFile) { $manifest.Add([pscustomobject]@{Type=$item.Kind;Path=$outFile;Status='已存在';Url=$pdfUrl}); continue }
    try {
      & curl.exe -4 -L --fail --max-time 90 --retry 2 -A 'Mozilla/5.0' -sS -o $outFile $pdfUrl
      if ($LASTEXITCODE -ne 0) { throw "HTTP 下载失败" }
      $head = [Text.Encoding]::ASCII.GetString([IO.File]::ReadAllBytes($outFile)[0..4])
      if ($head -ne '%PDF-') { throw '文件不是 PDF' }
      $manifest.Add([pscustomobject]@{Type=$item.Kind;Path=$outFile;Status='完成';Url=$pdfUrl})
    } catch {
      if (Test-Path -LiteralPath $outFile) { Remove-Item -LiteralPath $outFile -Force }
      $failures.Add([pscustomobject]@{Url=$pdfUrl;Reason=$_.Exception.Message})
    }
  }
}

$manifestPath = Join-Path $target '下载清单.csv'
$manifest | Export-Csv -NoTypeInformation -Encoding UTF8 -LiteralPath $manifestPath
$failurePath = Join-Path $target '未下载清单.csv'
$failures | Export-Csv -NoTypeInformation -Encoding UTF8 -LiteralPath $failurePath

Write-Output ("场次数量: {0}" -f $sessions.Count)
Write-Output ("成功/已存在: {0}" -f $manifest.Count)
Write-Output ("失败: {0}" -f $failures.Count)
Get-ChildItem -LiteralPath $target -Recurse -File | Group-Object Extension | Select-Object Name,Count
