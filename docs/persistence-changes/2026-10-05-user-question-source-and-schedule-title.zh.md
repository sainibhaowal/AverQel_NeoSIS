---
description: "记录持久化类型更改及其兼容性确认。"
kind: persistence-change
---

# 2026-10-05-user-question-source-and-schedule-title

[English](2026-10-05-user-question-source-and-schedule-title.md) | 中文

## 概述

为现有消息负载增加 user-question-reply 归属类型，并为 schedule 变更加上可选的 title 数据。

## 目录

- [声明](#declaration)
- [兼容性](#compatibility)
- [验证](#verification)
- [开发备注](#dev-note)

<a id="declaration"></a>
## 声明

```yaml persistence-change
schemaVersion: 1
id: 2026-10-05-user-question-source-and-schedule-title
baseline: false
changes:
  - root: "event:agent/inbox/spliced"
    previous: "2026-09-16-session-format-v4"
    after: "1f6b3ba1f3b33c4334abf9b395328c058c26712bea396f3a8424acfc0bea1450"
    decision: same-version
  - root: "event:developer/message"
    previous: "2026-09-16-session-format-v4"
    after: "07c4c4da7963566d4acb916e016fb916b6dabbec90c61f085d019f287b38a897"
    decision: same-version
  - root: "event:schedule/change"
    previous: "2026-09-11-initial"
    after: "fd5a0385ad56be3e1a861592b0575a50dc1c6898c9f997e43bcdb048f1b8c991"
    decision: same-version
  - root: "event:session/title-llm-request"
    previous: "2026-09-16-session-format-v4"
    after: "3a7a173754f4b5ae020274191949867e9d62b6f1f63d2679e6b40c74077be11a"
    decision: same-version
  - root: "event:user/message"
    previous: "2026-09-16-session-format-v4"
    after: "d65b9d1a21059ae29d07cac2defa12ffdf886f0b0afd28f51f674c3138c92b83"
    decision: same-version
```

<a id="compatibility"></a>
## 兼容性

这些更改只扩展现有事件正文。现有读取方可以省略可选的 schedule title，新 user-question-reply 来源类型由生产者归属策略明确覆盖。现有 V4 记录仍然有效，不需要提升 Session 格式版本。

<a id="verification"></a>
## 验证

持久化 schema 提取器、兼容性分类器、持久化历史、最终化 checkpoint 和发行归档校验均通过了新的确认记录。

<a id="dev-note"></a>
## 开发备注

无。
