param(
  [int]$Port = 8080
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Prefix = "http://localhost:$Port/"
$Listener = [System.Net.HttpListener]::new()
$Listener.Prefixes.Add($Prefix)
$Listener.Start()

$Mime = @{
  '.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.js'='text/javascript; charset=utf-8';
  '.json'='application/json; charset=utf-8'; '.webmanifest'='application/manifest+json; charset=utf-8';
  '.svg'='image/svg+xml'; '.png'='image/png'; '.ico'='image/x-icon'
}

Write-Host "OpenHTML Studio rodando em $Prefix" -ForegroundColor Green
Write-Host "Pressione Ctrl+C para encerrar." -ForegroundColor DarkGray
Start-Process ($Prefix + "?v=1.0.2")

try {
  while ($Listener.IsListening) {
    $Context = $Listener.GetContext()
    $Path = [Uri]::UnescapeDataString($Context.Request.Url.AbsolutePath.TrimStart('/'))
    if ([string]::IsNullOrWhiteSpace($Path)) { $Path = 'index.html' }
    $FullPath = [IO.Path]::GetFullPath((Join-Path $Root $Path))
    $RootFull = [IO.Path]::GetFullPath($Root)

    if (-not $FullPath.StartsWith($RootFull, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path $FullPath -PathType Leaf)) {
      $Context.Response.StatusCode = 404
      $Bytes = [Text.Encoding]::UTF8.GetBytes('404 - Arquivo não encontrado')
      $Context.Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
      $Context.Response.Close()
      continue
    }

    $Ext = [IO.Path]::GetExtension($FullPath).ToLowerInvariant()
    $Context.Response.ContentType = if ($Mime.ContainsKey($Ext)) { $Mime[$Ext] } else { 'application/octet-stream' }
    $Bytes = [IO.File]::ReadAllBytes($FullPath)
    $Context.Response.ContentLength64 = $Bytes.Length
    $Context.Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
    $Context.Response.Close()
  }
}
finally {
  $Listener.Stop()
  $Listener.Close()
}
