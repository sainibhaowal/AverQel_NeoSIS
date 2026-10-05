---
description: "Records a persistence type transition and its compatibility acknowledgement."
kind: persistence-change
---

# 2026-10-05-user-question-source-and-schedule-title

English | [中文](2026-10-05-user-question-source-and-schedule-title.zh.md)

## Summary

Adds the user-question-reply attribution kind to existing message payloads and adds optional title data to schedule changes.

## Table of Contents

- [Declaration](#declaration)
- [Compatibility](#compatibility)
- [Verification](#verification)
- [Dev Note](#dev-note)

<a id="declaration"></a>
## Declaration

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
## Compatibility

These changes only widen existing event bodies. Existing readers may omit the optional schedule title, and the new user-question-reply source kind is explicitly covered by the producer-owned attribution policy. Existing V4 records remain valid and no Session format bump is required.

<a id="verification"></a>
## Verification

The persistence schema extractor, compatibility classifier, persistence history, finalization checkpoint, and release archive checks pass with the new acknowledgement.

<a id="dev-note"></a>
## Dev Note

None.
