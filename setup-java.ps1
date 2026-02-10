# 永久设置 Java 环境变量
$javaHome = "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot"

Write-Host "正在设置 JAVA_HOME 环境变量..." -ForegroundColor Green

# 设置用户环境变量
[Environment]::SetEnvironmentVariable("JAVA_HOME", $javaHome, "User")

# 获取当前用户 PATH
$userPath = [Environment]::GetEnvironmentVariable("PATH", "User")

# 检查是否已包含 Java bin 目录
$javaBin = "$javaHome\bin"
if ($userPath -notlike "*$javaBin*") {
    $newPath = "$javaBin;$userPath"
    [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
    Write-Host "已添加 Java 到 PATH" -ForegroundColor Green
} else {
    Write-Host "Java bin 目录已在 PATH 中" -ForegroundColor Yellow
}

# 设置当前会话的环境变量
$env:JAVA_HOME = $javaHome
$env:PATH = "$javaBin;$env:PATH"

Write-Host "`n✅ Java 环境变量配置完成！" -ForegroundColor Green
Write-Host "JAVA_HOME = $javaHome" -ForegroundColor Cyan
Write-Host "`n验证安装：" -ForegroundColor Yellow
java -version

Write-Host "`n⚠️  请重启 VS Code 以使环境变量生效" -ForegroundColor Yellow
