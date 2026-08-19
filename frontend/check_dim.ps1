Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile("C:\Users\madha\.gemini\antigravity-ide\brain\c2951419-02bf-401a-a40d-e1e1a0ee8676\media__1787124288149.jpg")
Write-Host "Width: $($bmp.Width)"
Write-Host "Height: $($bmp.Height)"
$bmp.Dispose()
