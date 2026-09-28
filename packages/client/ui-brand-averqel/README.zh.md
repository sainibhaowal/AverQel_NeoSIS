---
description: "为侧边栏和界面提供 AverQel NeoSIS 品牌占位内容。"
kind: "package-reference"
---

# @averqel/neosis-ui-brand

[English](README.md) | 中文

## 概述

此包在侧边栏提供 AverQel NeoSIS 品牌标记和名称。它为使用 AverQel NeoSIS 品牌的部署提供身份内容，不保存运行时状态，也不影响模型请求。

## 目录

- [使用此包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用此包

将此插件挂载到 AverQel NeoSIS 部署的浏览器插件列表中，然后构建客户端。

### 替换品牌

使用 AverQel NeoSIS 身份的部署挂载此包，以占用侧边栏的 `sidebar.brand.mark` 和 `sidebar.brand.name` 席位。占用席位是唯一的组合方式；此处没有品牌配置接口。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节——点击展开</summary>

两个占用者作为一个声明感知的注册集合安装：嵌套的 `ctx.slots.inject()` 调用等待侧边栏声明，因此该行无论在声明者之前还是之后激活都能工作；声明撤销时两个占用者一起退出，HMR 期间不会留下部分品牌。浏览器部分位于 [`src/client/index.ts`](src/client/index.ts)；Node 部分是空的 Loader 席位。

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

当品牌席位不足以解释需求时，请阅读以下页面。它们从此包占用的席位延伸到渲染这些席位的外壳。

- [ui-sidebar](../ui-sidebar/README.zh.md)——声明 `sidebar.brand.mark` 和 `sidebar.brand.name`，并渲染它们的后备内容。
- [Web 客户端架构](../../../.agents/notes/implemented/architecture/2026-07-19-gui-web-client-architecture.zh.md)——浏览器插件行的加载和席位注册方式。

-----

<a id="model-experience"></a>
## 模型体验

无。此包只提供浏览器界面内容，其中没有任何内容会进入模型请求。

#### KV Cache 影响

无；此包既不组装也不发送提供方请求。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

这些限制说明品牌呈现如何提供。它们是当前包的约束，不是品牌设计比较或任务清单。

- **一个占用集合**——替代呈现属于占用同一席位的另一个 Cordis 包。
- **浏览器标题独立**——`NEOSIS_CLIENT_TITLE` 在构建时选择标题文本，而不是通过 UI 席位选择。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文——点击展开</summary>

无。

</details>

**运行时不变式：** 不发布伴随入口。此包不保存可变状态，两个席位占用者通过一个事务性 effect 安装和退出。
