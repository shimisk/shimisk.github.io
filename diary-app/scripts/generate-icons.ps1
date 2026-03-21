$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

function New-RoundedRectPath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $Radius * 2
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function Draw-DiaryIcon {
  param(
    [int]$Size,
    [string]$OutputPath,
    [switch]$AddInset
  )

  $bitmap = New-Object System.Drawing.Bitmap $Size, $Size
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $bgRect = New-Object System.Drawing.RectangleF 0, 0, $Size, $Size
  $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $bgRect,
    [System.Drawing.ColorTranslator]::FromHtml('#fff6ef'),
    [System.Drawing.ColorTranslator]::FromHtml('#f7cfdf'),
    45
  )
  $graphics.FillRectangle($bgBrush, $bgRect)

  $haloBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(92, 255, 255, 255))
  $graphics.FillEllipse($haloBrush, $Size * 0.08, $Size * 0.06, $Size * 0.84, $Size * 0.5)

  $coverX = $Size * 0.22
  $coverY = $Size * 0.16
  $coverW = $Size * 0.56
  $coverH = $Size * 0.68
  $coverRadius = $Size * 0.075

  $shadowPath = New-RoundedRectPath ($coverX + $Size * 0.02) ($coverY + $Size * 0.025) $coverW $coverH $coverRadius
  $shadowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(36, 86, 33, 54))
  $graphics.FillPath($shadowBrush, $shadowPath)

  $coverPath = New-RoundedRectPath $coverX $coverY $coverW $coverH $coverRadius
  $coverRect = New-Object System.Drawing.RectangleF $coverX, $coverY, $coverW, $coverH
  $coverBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $coverRect,
    [System.Drawing.ColorTranslator]::FromHtml('#db6d8d'),
    [System.Drawing.ColorTranslator]::FromHtml('#bf4f73'),
    90
  )
  $graphics.FillPath($coverBrush, $coverPath)

  $spineBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#a93d60'))
  $graphics.FillRectangle($spineBrush, $coverX, $coverY, $Size * 0.11, $coverH)

  $coverPen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml('#8d2f4f'), ($Size * 0.018))
  $graphics.DrawPath($coverPen, $coverPath)

  $pageRect = New-Object System.Drawing.RectangleF ($coverX + $coverW * 0.22), ($coverY + $coverH * 0.11), ($coverW * 0.6), ($coverH * 0.78)
  $pagePath = New-RoundedRectPath $pageRect.X $pageRect.Y $pageRect.Width $pageRect.Height ($Size * 0.03)
  $pageBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#fffdf8'))
  $pagePen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml('#ead6df'), ($Size * 0.01))
  $graphics.FillPath($pageBrush, $pagePath)
  $graphics.DrawPath($pagePen, $pagePath)

  $bookmarkBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#ffd166'))
  $bookmarkPoints = @(
    [System.Drawing.PointF]::new($coverX + $coverW * 0.62, $coverY),
    [System.Drawing.PointF]::new($coverX + $coverW * 0.75, $coverY),
    [System.Drawing.PointF]::new($coverX + $coverW * 0.75, $coverY + $coverH * 0.23),
    [System.Drawing.PointF]::new($coverX + $coverW * 0.685, $coverY + $coverH * 0.18),
    [System.Drawing.PointF]::new($coverX + $coverW * 0.62, $coverY + $coverH * 0.23)
  )
  $graphics.FillPolygon($bookmarkBrush, $bookmarkPoints)

  $linePen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml('#d8a2b5'), ($Size * 0.012))
  $lineStartX = $coverX + $coverW * 0.31
  $lineEndX = $coverX + $coverW * 0.72
  foreach ($offset in 0.31, 0.43, 0.55, 0.67) {
    $lineY = $coverY + $coverH * $offset
    $graphics.DrawLine($linePen, $lineStartX, $lineY, $lineEndX, $lineY)
  }

  $heartFont = New-Object System.Drawing.Font('Segoe UI Symbol', ($Size * 0.16), [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $heartBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#fff3f8'))
  $stringFormat = New-Object System.Drawing.StringFormat
  $stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
  $stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
  $heartRect = New-Object System.Drawing.RectangleF ($coverX + $coverW * 0.08), ($coverY + $coverH * 0.15), ($Size * 0.14), ($Size * 0.14)
  $graphics.DrawString([string][char]0x2665, $heartFont, $heartBrush, $heartRect, $stringFormat)

  if ($AddInset) {
    $insetPath = New-RoundedRectPath ($Size * 0.06) ($Size * 0.06) ($Size * 0.88) ($Size * 0.88) ($Size * 0.19)
    $insetPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(120, 255, 255, 255), ($Size * 0.022))
    $graphics.DrawPath($insetPen, $insetPath)
    $insetPen.Dispose()
    $insetPath.Dispose()
  }

  $directory = Split-Path -Parent $OutputPath
  if (-not (Test-Path $directory)) {
    New-Item -ItemType Directory -Path $directory | Out-Null
  }

  $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)

  $stringFormat.Dispose()
  $heartBrush.Dispose()
  $heartFont.Dispose()
  $linePen.Dispose()
  $bookmarkBrush.Dispose()
  $pagePen.Dispose()
  $pageBrush.Dispose()
  $pagePath.Dispose()
  $coverPen.Dispose()
  $spineBrush.Dispose()
  $coverBrush.Dispose()
  $coverPath.Dispose()
  $shadowBrush.Dispose()
  $shadowPath.Dispose()
  $haloBrush.Dispose()
  $bgBrush.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$iconDir = Join-Path (Split-Path -Parent $scriptDir) 'assets\icons'

Draw-DiaryIcon -Size 192 -OutputPath (Join-Path $iconDir 'icon-192.png')
Draw-DiaryIcon -Size 512 -OutputPath (Join-Path $iconDir 'icon-512.png') -AddInset
Draw-DiaryIcon -Size 180 -OutputPath (Join-Path $iconDir 'apple-touch-icon.png')

Write-Output 'Diary app icons regenerated.'