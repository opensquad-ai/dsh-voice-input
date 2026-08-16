# @opensquad/dsh-voice-input

[DeepSeek Harness](https://deepseek.com/harness/) 语音输入插件：在 Web 对话输入框旁添加一个麦克风按钮，录音后调用本地 [SenseVoice](https://github.com/FunAudioLLM/SenseVoice) 服务转写成文本，自动填入输入框。首次使用会引导下载模型并显示实时进度。

> 英文版：README_EN.md

## 功能

- 🎤 输入框旁麦克风按钮，一键录音转文字
- ⬇️ 首次使用自动下载模型（约 230MB），按钮上显示圆环进度 + 实时百分比
- ⚙ 独立管理按钮：查看/卸载已安装的语音模型
- 自动拉起本地 SenseVoice 服务（模型就绪时）

## 依赖

**这是一个全自动插件：Python 后端（依赖安装 + 进程启动）由插件在 dsh 启动时自动完成，首次使用模型也自动下载。** 你只需要：

| 前置 | 说明 |
| --- | --- |
| **Python 3.10+** | 唯一需要手动装的软依赖（插件会自动 `pip install` 其余依赖） |
| **ffmpeg** | 浏览器录音转码为 WAV 所需：`winget install ffmpeg` 或官网安装并加入 PATH |

插件启动时自动完成：
1. 探测 Python → 自动安装 `flask / onnxruntime / librosa / soundfile / pyyaml` 等依赖（首次较慢）
2. 自动拉起下载网关（`gateway.py` :7102）
3. 首次使用 → 自动下载模型（约 230MB）并启动转写服务（`service.py` :7101）

## 安装插件

```bash
dsh plugin --profile web add @opensquad/dsh-voice-input
```

重启 dsh 后，插件会在后台自动准备后端，输入框旁会出现麦克风按钮。

## 使用

1. 重启 dsh 后稍等片刻（首次会自动装 Python 依赖并启动后端）。
2. 点击麦克风 → 首次会确认下载模型 → 等待进度完成 → 自动启动服务。
3. 再次点击麦克风开始录音，再点一次停止并转写，文字自动填入输入框。

模型已安装时，点旁边的 ⚙ 可卸载后重新下载。

## 兼容性

- Node.js ≥ 22.19.0
- Python 3.10+（且 `python` 在 PATH）
- DeepSeek Harness（Web profile）
- 浏览器需支持 `MediaRecorder` / `getUserMedia`

## License

[MIT](./LICENSE)