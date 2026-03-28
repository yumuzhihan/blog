module.exports = async (params) => {
  const activeEditor = params.app.workspace.activeEditor
  if (!activeEditor || !activeEditor.editor) {
    new Notice("请在打开的 Markdown 文件中运行此脚本！")
    return
  }

  // ================= 1. 安全读取本地配置 =================
  let config
  try {
    const configRaw = await params.app.vault.adapter.read("Scripts/config.json")
    config = JSON.parse(configRaw)
  } catch (e) {
    new Notice("❌ 读取配置文件失败，请检查 Scripts/config.json")
    return
  }

  const { API_URL, API_KEY, MODEL_NAME } = config

  if (!API_KEY || !API_URL) {
    new Notice("❌ API 配置缺失，请检查 config.json")
    return
  }

  const editor = activeEditor.editor
  const fileContent = editor.getValue()
  const contentToSummarize = fileContent.replace(/^---[\s\S]+?---\n/, "").substring(0, 1000)

  new Notice(`🚀 正在呼叫 ${MODEL_NAME} 生成摘要...`)

  // ================= 2. 构造请求体 =================
  const requestBody = JSON.stringify({
    model: MODEL_NAME,
    stream: true,
    input: [
      {
        type: "message",
        role: "developer",
        content: [
          {
            type: "input_text",
            text: "你是一个资深的技术博客主编。请根据用户提供的文章内容，生成一段 60 到 90 字的纯文本摘要（全面概括型）。\n要求：\n1. 必须精准提取文章的核心理论（如定理名称、数学推导亮点）和具体应用实例；\n2. 语言需严谨客观，脉络清晰，信息密度高；\n3. 绝对不要带有任何前缀（如“摘要：”或“本文介绍”）、无意义的语气词、“好的”或换行，请直接输出摘要正文全文。",
          },
        ],
      },
      {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: `内容：${contentToSummarize}`,
          },
        ],
      },
    ],
  })

  // ================= 3. 发起 Node 原生跨域请求 =================
  const https = require("https")
  const url = new URL(API_URL)

  const options = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname + url.search,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      "Content-Length": Buffer.byteLength(requestBody),
    },
  }

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        let errorData = ""
        res.on("data", (chunk) => {
          errorData += chunk
        })
        res.on("end", () => {
          new Notice(`❌ 接口拒绝服务 HTTP ${res.statusCode}`)
          console.error(`HTTP ${res.statusCode} Error:`, errorData)
          reject(new Error(`HTTP ${res.statusCode}`))
        })
        return
      }

      res.setEncoding("utf8")
      let buffer = ""

      res.on("data", (chunk) => {
        buffer += chunk
        let lines = buffer.split("\n")
        buffer = lines.pop() // 保留最后一行不完整的字符串等下一次拼接

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (trimmedLine.startsWith("data: ")) {
            const dataStr = trimmedLine.substring(6)

            if (dataStr === "[DONE]") continue

            try {
              const data = JSON.parse(dataStr)

              // ================= 修改核心：适配特定的事件格式 =================
              let content = ""

              // 监听增量输出事件提取 delta
              if (data.type === "response.output_text.delta" && data.delta) {
                content = data.delta
              }

              if (content) {
                const cursor = editor.getCursor()
                editor.replaceRange(content, cursor)
                editor.setCursor({ line: cursor.line, ch: cursor.ch + content.length })
              }

              // 如果捕获到完成事件，可作为日志参考
              if (data.type === "response.completed") {
                console.log("Stream successfully completed.")
              }
              // ==========================================================
            } catch (e) {
              // JSON解析失败说明可能是心跳包或脏数据，静默丢弃
            }
          }
        }
      })

      res.on("end", () => {
        new Notice("✅ Description 流式生成完毕！")
        resolve()
      })
    })

    req.on("error", (e) => {
      new Notice("❌ 网络层请求错误: " + e.message)
      console.error(e)
      reject(e)
    })

    req.write(requestBody)
    req.end()
  })
}
