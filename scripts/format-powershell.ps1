param([switch]$Check)
$ErrorActionPreference = 'Stop'
$scriptFiles = @(git ls-files --cached --others --exclude-standard -- '*.ps1' | Sort-Object -Unique | Where-Object { (Test-Path -LiteralPath $_ -PathType Leaf) -and -not $_.StartsWith('docs/') })
$changedFiles = 0
$utf8Encoding = [Text.UTF8Encoding]::new($false)
foreach ($file in $scriptFiles) {
  $source = [IO.File]::ReadAllText((Join-Path (Get-Location).Path $file))
  $tokens = $null
  $errors = $null
  [Management.Automation.Language.Parser]::ParseInput($source, [ref]$tokens, [ref]$errors) | Out-Null
  if ($errors.Count) { throw ('Invalid PowerShell syntax: ' + $file) }
  $expected = @($tokens | Where-Object { $_.Kind -notin @('Comment','NewLine','EndOfInput','LineContinuation') } | ForEach-Object { $_.Kind.ToString() + ':' + $_.Text })
  $prepared = $source
  foreach ($token in @($tokens | Where-Object { $_.Kind -eq 'Comment' } | Sort-Object { $_.Extent.StartOffset } -Descending)) {
    $startOffset = $token.Extent.StartOffset
    $endOffset = $token.Extent.EndOffset
    $prepared = $prepared.Substring(0, $startOffset) + ($prepared.Substring($startOffset, $endOffset - $startOffset) -replace '[^\r\n]', ' ') + $prepared.Substring($endOffset)
  }
  [Management.Automation.Language.Parser]::ParseInput($prepared, [ref]$tokens, [ref]$errors) | Out-Null
  $protectedLines = [Collections.Generic.HashSet[int]]::new()
  foreach ($token in $tokens | Where-Object { $_.Kind -in @('StringLiteral','StringExpandable','HereStringLiteral','HereStringExpandable') }) {
    for ($line = $token.Extent.StartLineNumber; $line -le $token.Extent.EndLineNumber; $line++) { $protectedLines.Add($line) | Out-Null }
  }
  $sourceLines = @([regex]::Matches($prepared, '[^\r\n]*(?:\r\n|\n|\r|$)') | ForEach-Object { $_.Value })
  $keptLines = for ($line = 0; $line -lt $sourceLines.Count; $line++) { if ($sourceLines[$line].Trim().Length -or $protectedLines.Contains($line + 1)) { $sourceLines[$line] } }
  $formatted = $keptLines -join ''
  if (-not $formatted.EndsWith("`n")) { $formatted += "`r`n" }
  [Management.Automation.Language.Parser]::ParseInput($formatted, [ref]$tokens, [ref]$errors) | Out-Null
  $actual = @($tokens | Where-Object { $_.Kind -notin @('Comment','NewLine','EndOfInput','LineContinuation') } | ForEach-Object { $_.Kind.ToString() + ':' + $_.Text })
  if ($errors.Count -or ($expected -join "`0") -cne ($actual -join "`0")) { throw ('PowerShell token sequence changed: ' + $file) }
  if ($formatted -ceq $source) { continue }
  $changedFiles++
  if ($Check) { Write-Output $file } else { [IO.File]::WriteAllText((Join-Path (Get-Location).Path $file), $formatted, $utf8Encoding) }
}
Write-Output ('PowerShell files needing formatting: ' + $changedFiles)
if ($Check -and $changedFiles) { exit 1 }
