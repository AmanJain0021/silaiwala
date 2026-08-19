Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile("C:\Users\madha\.gemini\antigravity-ide\brain\c2951419-02bf-401a-a40d-e1e1a0ee8676\media__1787124288149.jpg")

$cellW = [math]::Floor($bmp.Width / 4)
$cellH = [math]::Floor($bmp.Height / 3)
$cropSize = 175

$idx = 0
for($r=0; $r -lt 3; $r++) {
    for($c=0; $c -lt 4; $c++) {
        if ($idx -ge 9) { break }
        
        $startX = $c * $cellW
        $startY = $r * $cellH
        $endX = $startX + $cellW - 1
        $endY = $startY + $cellH - 1
        if ($endX -ge $bmp.Width) { $endX = $bmp.Width - 1 }
        if ($endY -ge $bmp.Height) { $endY = $bmp.Height - 1 }
        
        $minX = $endX
        $maxX = $startX
        $minY = $endY
        
        for($y = $startY; $y -lt ($startY + $cellH * 0.75); $y++) {
            for($x = $startX; $x -le $endX; $x++) {
                $pixel = $bmp.GetPixel($x, $y)
                if ($pixel.R -lt 250 -or $pixel.G -lt 250 -or $pixel.B -lt 250) {
                    if ($x -lt $minX) { $minX = $x }
                    if ($x -gt $maxX) { $maxX = $x }
                    if ($y -lt $minY) { $minY = $y }
                }
            }
        }
        
        $centerX = [math]::Floor(($minX + $maxX) / 2)
        $diameter = $maxX - $minX
        $centerY = $minY + [math]::Floor($diameter / 2)
        
        $cropX = $centerX - [math]::Floor($cropSize / 2)
        $cropY = $centerY - [math]::Floor($cropSize / 2)
        
        if ($cropX -lt 0) { $cropX = 0 }
        if ($cropY -lt 0) { $cropY = 0 }
        if ($cropX + $cropSize -gt $bmp.Width) { $cropX = $bmp.Width - $cropSize }
        if ($cropY + $cropSize -gt $bmp.Height) { $cropY = $bmp.Height - $cropSize }
        
        $rect = New-Object System.Drawing.Rectangle $cropX, $cropY, $cropSize, $cropSize
        $clone = $bmp.Clone($rect, $bmp.PixelFormat)
        $clone.Save("c:\Users\madha\silaiwala\frontend\public\icons\offer_icon_$idx.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
        $clone.Dispose()
        $idx++
    }
}
$bmp.Dispose()
