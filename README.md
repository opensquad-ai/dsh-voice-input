# @opensquad/dsh-voice-input

[DeepSeek Harness](https://deepseek.com/harness/) 语音输入插件：在 Web 对话输入框旁添加一个麦克风按钮，录音后调用本地 [SenseVoice](https://github.com/FunAudioLLM/SenseVoice) 服务转写成文本，自动填入输入框。首次使用会引导下载模型并显示实时进度。

## 功能

- 🎤 输入框旁麦克风按钮，一键录音转文字
- ⬇️ 首次使用自动下载模型（约 230MB），按钮上显示圆环进度 + 实时百分比
- ⚙ 独立管理按钮：查看/卸载已安装的语音模型
- 自动拉起本地 SenseVoice 服务（模型就绪时）

## 依赖

**重要：这是一个纯前端 UI 插件，它依赖一个本地 Python 后端来提供模型下载与转写能力。** npm 包本身不包含后端代码，需要单独安装并启动：

| 服务 | 端口 | 作用 |
| --- | --- | --- |
| `gateway.py`（下载网关） | 7102 | 模型下载进度、服务启动、卸载 |
| `service.py`（SenseVoice 服务） | 7101 | 语音转文本推理 |

后端代码在本仓库的 [`backend/`](./backend) 目录。

### 安装后端

```bash
# 1. 克隆本仓库（或直接使用仓库内的 backend/ 目录）
git clone https://github.com/opensquad-ai/dsh-voice-input.git
cd dsh-voice-input/backend

# 2. 安装 Python 依赖
pip install -r requirements.txt

# 3. 启动下载网关（自动拉起转写服务）
python gateway.py --port 7102 --sensevoice-port 7101
```

> 需要系统安装 `ffmpeg`（浏览器录制的音频需转码为 WAV）。

## 安装插件

```bash
dsh plugin --profile web add @opensquad/dsh-voice-input
```

重启 dsh 后，输入框旁会出现麦克风按钮。

## 使用

1. 确保本地后端已启动（`gateway.py`）。
2. 第一次点击麦克风 → 确认下载模型 → 等待进度完成 → 自动启动服务。
3. 再次点击麦克风开始录音，再点一次停止并转写，文字自动填入输入框。

模型已安装时，点旁边的 ⚙ 可卸载后重新下载。

## 兼容性

- Node.js ≥ 22.19.0
- DeepSeek Harness（Web profile）
- 浏览器需支持 `MediaRecorder` / `getUserMedia`

## License

[MIT](./LICENSE)