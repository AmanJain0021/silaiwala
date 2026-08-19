Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile("C:\Users\madha\.gemini\antigravity-ide\brain\c2951419-02bf-401a-a40d-e1e1a0ee8676\media__1787124288149.jpg")
$cellW = 256
$cellH = 273
$cropW = 180
$cropH = 180
$offsetX = 38
$offsetY = 15

$idx = 0
for($r=0; $r -lt 3; $r++) {
    for($c=0; $c -lt 4; $c++) {
        if ($idx -ge 9) { break }
        
        $x = ($c * $cellW) + $offsetX
        $y = ($r * $cellH) + $offsetY
        $rect = New-Object System.Drawing.Rectangle $x, $y, $cropW, $cropH
        $clone = $bmp.Clone($rect, $bmp.PixelFormat)
        $clone.Save("c:\Users\madha\silaiwala\frontend\public\icons\offer_icon_$idx.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
        $clone.Dispose()
        $idx++
    }
}
$bmp.Dispose()
