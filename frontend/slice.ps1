Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile("C:\Users\madha\.gemini\antigravity-ide\brain\c2951419-02bf-401a-a40d-e1e1a0ee8676\media__1787123562954.png")
$width = [math]::Floor($bmp.Width / 4)
$height = $bmp.Height
for($i=0; $i -lt 4; $i++) {
    $rect = New-Object System.Drawing.Rectangle ($i*$width), 0, $width, $height
    $clone = $bmp.Clone($rect, $bmp.PixelFormat)
    $clone.Save("c:\Users\madha\silaiwala\frontend\public\icons\service_icon_$i.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $clone.Dispose()
}
$bmp.Dispose()
