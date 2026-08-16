@echo off
REM ============================================================
REM  dsh-sensevoice 下载网关启动脚本
REM  启动下载网关 (默认 7102)，并根据配置自动拉起 SenseVoice 服务
REM  用法: run_gateway.bat            # 启动网关 + 自动拉起 7101 服务
REM ============================================================
cd /d "%~dp0"

rem 可选：SENSEVOICE_AUTOSTART=0 时只启动网关，不自动拉起服务
if "%SENSEVOICE_AUTOSTART%"=="" set SENSEVOICE_AUTOSTART=1

echo ========================================
echo  dsh-sensevoice Gateway (7102)
echo ========================================
echo.

rem 检查 Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.8+
    pause
    exit /b 1
)

rem 启动网关（前台，Ctrl+C 停止）；网关启动后若配置了自动启动，
rem 会通过 /start 拉起 SenseVoice 服务（模型已下载的前提下）。
if "%SENSEVOICE_AUTOSTART%"=="1" (
    echo [INFO] 网关启动后将自动拉起 SenseVoice 服务 (7101)
)

python gateway.py --port 7102 --sensevoice-port 7101

echo.
echo 网关已退出。
pause