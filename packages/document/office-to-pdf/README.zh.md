---
description: "通过 NeoSIS 校验的 LibreOffice 运行时在 Host 转换 Office 文档。"
kind: "package-reference"
---

# @averqel/neosis-office-to-pdf

[English](README.md) | 中文

## 概述

在宿主计算机上通过配置的 LibreOffice 可执行文件将 LibreOffice 支持的文字处理、电子表格和演示文档转换为 PDF。提供方支持常见二进制 Office、OOXML、OpenDocument、Flat XML、RTF 以及旧式电子表格和演示扩展名。Desktop 构建会使用安装包内经过校验的 LibreOffice 载荷；Web／Host 部署可以显式设置 `executable`。二进制输入的转换不报告缺失字体名称。

## 目录

- [使用此包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [延伸阅读](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延后工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用此包

[Web bundle](../../bundle/web-app/README.zh.md)以 `office-to-pdf` 条目挂载此提供方。独立组合通过 `cordis.yml` 条目挂载 `@averqel/neosis-office-to-pdf`。

调用方通过 `ctx.officeToPdf.convert()` 提交已授权源的标识、版本、可选字节数、延迟的有界读取、Office 扩展名和调度优先级。源版本变化会拒绝转换。结果包含调用方拥有的 PDF 字节、缺失字体、缓存键和转换 generation；配置替换后 generation 随之改变。取消以原因为拒绝值，转换失败使用 `OfficeToPdfError`。

此 provider 为每个获准转换启动一个隔离的 LibreOffice 子进程。Desktop Host 会从安装包内的 `NEOSIS_OFFICE_BUNDLE_ROOT` 解析载荷；载荷缺失时会安全失败。开发环境和独立 Host 部署默认使用 `soffice`，也可以通过 `executable` 或 `NEOSIS_OFFICE_EXECUTABLE` 指定路径。NeoSIS 不要求 npm LibreOffice 包。

浏览器通过 `officeToPdf.render` Remote 方法请求 PDF，参数为 Session 标识、Office 路径和优先级。此入口使用 `workspaceFiles` 完成授权和源版本检查，再通过 `fs.readBytes` 在转换预留容量内读取原始字节。进程内 `convert()` 不要求这些服务。响应保留源文件路径与版本，通过二进制 Remote 的 multipart 传输携带原生 PDF 字节，并携带缺失字体和转换 generation。`officeToPdf.generation` Remote 方法返回当前提供方 generation；`api/remotes` 负责挂载生成的 Client 描述符。

| 字段 | 默认值 | 含义 |
|---|---|---|
| `maxConcurrentConversions` | `2` | 最大活跃转换器数量；排队调用仍可取消。 |
| `timeoutMs` | `60000` | 获取转换器后的转换期限。 |
| `maxInputBytes` | `52428800` | 最大源字节数。 |
| `maxOutputBytes` | `104857600` | 最大完整 PDF 字节数。 |
| `executable` | Desktop 载荷或 `soffice` | LibreOffice 可执行文件名称或绝对路径。 |
| `fontFallbacks` | 系统默认值 | 为保持配置兼容而接受；LibreOffice 选择后备字体族。 |

[配置目录](../../../docs/config-catalog.zh.md#averqelneosis-office-to-pdf)定义全部字体、归档和图像设置。`fontDirectories` 接受绝对目录，并通过 `SAL_FONTPATH` 传给 LibreOffice；省略时使用载荷或主机字体配置。`fontFallbacks` 为保持配置兼容而保留，但后备字体族由 LibreOffice 选择。因此，Desktop 使用固定版本的 LibreOffice，独立 Host 使用配置的版本。

[有界转换决策](../../../.agents/notes/implemented/architecture/2026-09-15-bounded-office-conversion.zh.md)说明队列准入、缓存限额与共享取消的设计依据。

提供方按转换 generation、Office 扩展名和精确源字节的 SHA-256 保留成功 PDF。有界的源版本索引在授权 stat 后避免重读已知内容；内容标识也会在不同源路径之间共享转换。达到任一保留上限时，最近最少使用的 PDF 及其别名一同移除。不保留失败或超过缓存上限的结果。每个结果具有独立的 PDF 与字体缓冲区。已就绪别名命中不占用读取方名额；同一源的最后一个读取方离开时，立即释放其在途定位信息。源的最后一个读取方取消后，再次打开该源会重新读取字节，再按内容摘要共享转换，即使其他源仍保持该转换运行或其 PDF 已就绪。

准入在调用源读取前限制排队元数据、未完成读取方、活动源字节预留和转换。未知源大小预留 `maxInputBytes`；已知大小预留 stat 字节数。读取收到该容量，最多额外读取一个超限哨兵字节。`maxSourceBytes` 必须覆盖 `maxInputBytes`。最后一个读取方额度预留给前台。`maxBackgroundConversions` 设为零时，拒绝后台读取方加入排队或运行中的工作；仍可命中已完成的别名缓存。只要仍有前台任务排队，后台任务就继续等待，包括前台正在等待源容量的情况。前台加入会提升排队预热；最后一个前台读取方离开后，排队任务恢复后台优先级，符合条件的工作可立即开始。前台准入也可移除排队推测工作。总并发大于一时，后台并发为前台保留一个槽位。正在运行的预热即使被提权，也保留后台准入槽位直至结束。最后一个读取方取消共享工作。移除排队的前台阻塞任务后，其他符合条件的工作立即准入；实际读取、转换和清理完成前仍保留活动预留容量。

默认保留 8 个 PDF、128 MiB 和 64 个源别名，准入 32 个读取方与 8 个排队任务，最多预留 100 MiB 源字节，并允许一个后台转换。这些限制约束拥有的请求和二进制载荷，不约束引擎 RSS、multipart 封装、调用方保留的结果或 PDF.js 页面渲染。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部细节 — 点击展开</summary>

可执行文件缺失和转换错误会拒绝请求，不会切换到其他引擎。adapter 为每次转换提供私有 LibreOffice 配置目录，并且不会向子进程环境传递 Harness 密钥。

提供方将已授权输入写入私有临时目录，使用隔离的配置目录启动 LibreOffice，读取有大小上限的普通 PDF 文件，并在完成前删除目录。取消已准入的读取方会通过共享信号终止子进程，不会阻塞后续排队工作。读取方取消只会释放该读取方；最后一个读取方和提供方卸载会取消共享工作。活跃操作和临时目录清理由同一生命周期负责，因此不发布运行时不变量伴随入口。

Remote 文件读取在查询转换缓存前重新检查内容读取授权和源版本。延迟读取在取得转换容量后执行，并在读取后验证源版本。源读取失败直接传递；转换失败返回 `document-render/failed` 及分类原因，不暴露引擎诊断。卸载会取消并等待授权读取、Remote 请求和转换工作全部结束。

</details>

-----

<a id="further-exploration"></a>
## 延伸阅读

- [Office 转 PDF](../../../docs/subsystems/office-to-pdf.zh.md) — 组合与输入、结果所有权。
- [工作区文件](../../api/workspace-files/README.zh.md) — Session 文件授权与有界读取。

-----

<a id="model-experience"></a>
## 模型体验

无，因为此包仅转换字节，不提供面向模型的工具、消息或 Session 事件。

#### KV Cache effect

无；转换不会构造或修改模型请求。

## 已知限制与延后工作

<a id="known-limitations-and-deferred-work"></a>

- 转换保真度和可用过滤器由使用中的 LibreOffice 版本及字体决定；Desktop 为每个目标固定并打包官方载荷，独立 Host 仍需要兼容的 LibreOffice 安装。
- `timeoutMs` 在 LibreOffice 子进程启动时开始计时，不限制队列等待时间。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文 — 点击展开</summary>

无。

</details>
