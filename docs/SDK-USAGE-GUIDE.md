# TypeScript SDK Usage Guide - What You Can Do + Examples

## What is the SDK?

The **TypeScript SDK** (`@averqel/neosis-sdk-client`) lets you control AverQel NeoSIS from your own Node.js/TypeScript applications. Instead of using the CLI or web UI, you can programmatically:

- Start agent sessions
- Send prompts and get responses
- Observe real-time events
- Automate workflows
- Build custom tools on top of NeoSIS

---

## Installation

```bash
# Install the SDK
npm install @averqel/neosis-sdk-client

# Install peer dependencies
npm install @averqel/neosis-llm @averqel/neosis-sdk-protocol @averqel/neosis-session @averqel/cordis
```

---

## Basic Usage

### 1. Simple Prompt - Get a Response

```typescript
import { AverQelHarness } from '@averqel/neosis-sdk-client'

async function main() {
  // Create a harness (starts the NeoSIS runtime)
  await using harness = new AverQelHarness({
    profile: 'sdk',              // Use the SDK profile
    provider: 'deepseek-official',
    model: 'deepseek-v4-flash',
  })

  // Run a prompt and get the result
  const result = await harness.run('Write a function that sorts a list')

  console.log('Response:', result.finalResponse)
  console.log('Session ID:', result.sessionId)
  console.log('Events:', result.events.length)
}

main().catch(console.error)
```

**What this does:**
- Starts NeoSIS in the background
- Sends your prompt to the agent
- Waits for the agent to finish (become idle)
- Returns the final response

---

### 2. Multi-Turn Conversation

```typescript
import { AverQelHarness } from '@averqel/neosis-sdk-client'

async function main() {
  await using harness = new AverQelHarness({
    profile: 'sdk',
    provider: 'deepseek-official',
    model: 'deepseek-v4-flash',
  })

  // First turn
  const result1 = await harness.run('Create a Python function to calculate fibonacci')
  console.log('Turn 1:', result1.finalResponse)

  // Second turn (continues the same session)
  const result2 = await harness.run('Now add memoization to it')
  console.log('Turn 2:', result2.finalResponse)

  // Third turn
  const result3 = await harness.run('Explain how memoization improves performance')
  console.log('Turn 3:', result3.finalResponse)
}

main().catch(console.error)
```

**What this does:**
- Maintains conversation context across turns
- Agent remembers previous interactions
- Each response builds on the conversation history

---

### 3. Named Sessions (Persistent Context)

```typescript
import { AverQelHarness } from '@averqel/neosis-sdk-client'

async function main() {
  await using harness = new AverQelHarness({
    profile: 'sdk',
    provider: 'deepseek-official',
    model: 'deepseek-v4-flash',
  })

  // Create a named session
  const session = harness.session('my-persistent-session')

  // Run prompts on the same session
  await session.run('I want to build a web scraper')
  await session.run('Use Python and BeautifulSoup')
  await session.run('Add error handling for network failures')

  // Later, you can resume the same session
  const sameSession = harness.session('my-persistent-session')
  const result = await sameSession.run('Now add unit tests')
  console.log(result.finalResponse)
}

main().catch(console.error)
```

**What this does:**
- Session ID persists across calls
- Resume conversations later
- Useful for long-running tasks

---

### 4. Real-Time Event Streaming

```typescript
import { AverQelHarness } from '@averqel/neosis-sdk-client'

async function main() {
  await using harness = new AverQelHarness({
    profile: 'sdk',
    provider: 'deepseek-official',
    model: 'deepseek-v4-flash',
  })

  // Observe events in real-time
  const result = await harness.run('Analyze this codebase', {
    onNotification: (notification) => {
      console.log('Event:', notification.method, notification.params)

      // Handle specific events
      if (notification.method === 'session.event') {
        const event = notification.params.event
        if (event.type === 'tool/start') {
          console.log('Tool started:', event.data.tool)
        } else if (event.type === 'tool/end') {
          console.log('Tool finished:', event.data.tool)
        } else if (event.type === 'agent/message') {
          console.log('Agent message:', event.data.content)
        }
      }
    },
  })

  console.log('Final response:', result.finalResponse)
}

main().catch(console.error)
```

**What this does:**
- Stream events as they happen
- See tools being called
- Monitor agent progress in real-time
- Build progress indicators

---

### 5. Custom Workspace Directory

```typescript
import { AverQelHarness } from '@averqel/neosis-sdk-client'
import { resolve } from 'node:path'

async function main() {
  await using harness = new AverQelHarness({
    profile: 'sdk',
    provider: 'deepseek-official',
    model: 'deepseek-v4-flash',
    cwd: resolve('/path/to/your/project'),  // Set working directory
  })

  // Agent will work in this directory
  const result = await harness.run('Read package.json and suggest improvements')
  console.log(result.finalResponse)
}

main().catch(console.error)
```

**What this does:**
- Agent operates in a specific directory
- Can read/write files in that location
- Useful for project-specific tasks

---

### 6. Custom Configuration with Patches

```typescript
import { AverQelHarness } from '@averqel/neosis-sdk-client'

async function main() {
  await using harness = new AverQelHarness({
    profile: 'sdk',
    patches: ['./my-custom-config.cordis.yml'],  // Apply custom configuration
    provider: 'deepseek-official',
    model: 'deepseek-v4-flash',
  })

  const result = await harness.run('Write a REST API server')
  console.log(result.finalResponse)
}

main().catch(console.error)
```

**What this does:**
- Apply custom Cordis configuration
- Enable/disable plugins
- Set custom tool permissions
- Override default settings

---

### 7. Advanced Options (Reasoning Effort, Max Tokens)

```typescript
import { AverQelHarness } from '@averqel/neosis-sdk-client'
import { ReasoningEffortId } from '@averqel/neosis-llm'

async function main() {
  await using harness = new AverQelHarness({
    profile: 'sdk',
    provider: 'deepseek-official',
    model: 'deepseek-v4-flash',
    reasoningEffort: ReasoningEffortId('max'),  // Maximum reasoning
    maxTokens: 49_152,  // Limit output tokens
  })

  const result = await harness.run('Solve this complex algorithm problem')
  console.log(result.finalResponse)
}

main().catch(console.error)
```

**What this does:**
- Control model reasoning depth
- Limit response length
- Optimize for complex tasks

---

## Real-World Use Cases

### Use Case 1: Automated Code Review Bot

```typescript
import { AverQelHarness } from '@averqel/neosis-sdk-client'
import { readFile } from 'node:fs/promises'

async function reviewPullRequest(prNumber: number) {
  await using harness = new AverQelHarness({
    profile: 'sdk',
    provider: 'deepseek-official',
    model: 'deepseek-v4-flash',
    cwd: process.cwd(),
  })

  // Read the PR diff
  const diff = await readFile(`pr-${prNumber}.diff`, 'utf-8')

  // Ask for review
  const result = await harness.run(
    `Review this pull request diff:\n\n${diff}\n\n` +
    'Identify potential bugs, security issues, and code quality problems.'
  )

  // Post the review as a comment
  console.log('Review:', result.finalResponse)
  // TODO: Post to GitHub using octokit
}

reviewPullRequest(123).catch(console.error)
```

**Where it's useful:**
- CI/CD pipelines
- Automated code review
- Pull request automation

---

### Use Case 2: Documentation Generator

```typescript
import { AverQelHarness } from '@averqel/neosis-sdk-client'
import { readFile, writeFile } from 'node:fs/promises'

async function generateDocumentation(filePath: string) {
  await using harness = new AverQelHarness({
    profile: 'sdk',
    provider: 'deepseek-official',
    model: 'deepseek-v4-flash',
    cwd: process.cwd(),
  })

  // Read the source code
  const code = await readFile(filePath, 'utf-8')

  // Generate documentation
  const result = await harness.run(
    `Generate JSDoc documentation for this code:\n\n${code}\n\n` +
    'Include parameter descriptions, return types, and usage examples.'
  )

  // Write documentation to file
  const docPath = filePath.replace('.ts', '.md')
  await writeFile(docPath, result.finalResponse)
  console.log(`Documentation written to ${docPath}`)
}

generateDocumentation('./src/my-function.ts').catch(console.error)
```

**Where it's useful:**
- Automated documentation
- API reference generation
- README maintenance

---

### Use Case 3: Test Case Generator

```typescript
import { AverQelHarness } from '@averqel/neosis-sdk-client'
import { readFile, writeFile } from 'node:fs/promises'

async function generateTests(filePath: string) {
  await using harness = new AverQelHarness({
    profile: 'sdk',
    provider: 'deepseek-official',
    model: 'deepseek-v4-flash',
    cwd: process.cwd(),
  })

  // Read the implementation
  const code = await readFile(filePath, 'utf-8')

  // Generate tests
  const result = await harness.run(
    `Write comprehensive Vitest tests for this code:\n\n${code}\n\n` +
    'Include edge cases, error handling, and integration tests.'
  )

  // Write tests to file
  const testPath = filePath.replace('.ts', '.spec.ts')
  await writeFile(testPath, result.finalResponse)
  console.log(`Tests written to ${testPath}`)
}

generateTests('./src/utils.ts').catch(console.error)
```

**Where it's useful:**
- Test automation
- Coverage improvement
- Test-driven development

---

### Use Case 4: Migration Tool

```typescript
import { AverQelHarness } from '@averqel/neosis-sdk-client'
import { readFile, writeFile } from 'node:fs/promises'

async function migrateCode(filePath: string, fromFramework: string, toFramework: string) {
  await using harness = new AverQelHarness({
    profile: 'sdk',
    provider: 'deepseek-official',
    model: 'deepseek-v4-flash',
    cwd: process.cwd(),
  })

  // Read the old code
  const code = await readFile(filePath, 'utf-8')

  // Migrate to new framework
  const result = await harness.run(
    `Migrate this ${fromFramework} code to ${toFramework}:\n\n${code}\n\n` +
    'Preserve the same functionality and API. Add comments explaining changes.'
  )

  // Write migrated code
  await writeFile(filePath, result.finalResponse)
  console.log(`Migrated ${filePath} from ${fromFramework} to ${toFramework}`)
}

migrateCode('./src/component.tsx', 'React', 'Vue').catch(console.error)
```

**Where it's useful:**
- Framework migrations
- Language migrations
- API upgrades

---

### Use Case 5: API Client Generator

```typescript
import { AverQelHarness } from '@averqel/neosis-sdk-client'
import { readFile, writeFile } from 'node:fs/promises'

async function generateApiClient(openApiSpec: string) {
  await using harness = new AverQelHarness({
    profile: 'sdk',
    provider: 'deepseek-official',
    model: 'deepseek-v4-flash',
  })

  // Read OpenAPI spec
  const spec = await readFile(openApiSpec, 'utf-8')

  // Generate TypeScript client
  const result = await harness.run(
    `Generate a TypeScript client for this OpenAPI spec:\n\n${spec}\n\n` +
    'Use fetch for HTTP requests. Include type definitions for all endpoints.'
  )

  // Write client code
  await writeFile('./src/api-client.ts', result.finalResponse)
  console.log('API client generated')
}

generateApiClient('./openapi.json').catch(console.error)
```

**Where it's useful:**
- API integration
- Client SDK generation
- Type-safe API calls

---

### Use Case 6: Chatbot Backend

```typescript
import { AverQelHarness } from '@averqel/neosis-sdk-client'

// Create a long-lived harness
const harness = new AverQelHarness({
  profile: 'sdk',
  provider: 'deepseek-official',
  model: 'deepseek-v4-flash',
})

// Express.js endpoint example
async function chatEndpoint(req: any, res: any) {
  const { message, sessionId } = req.body

  try {
    const result = await harness.run(message, { sessionId })
    res.json({
      response: result.finalResponse,
      sessionId: result.sessionId,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to process message' })
  }
}

// Handle cleanup on shutdown
process.on('SIGTERM', async () => {
  await harness.close()
})
```

**Where it's useful:**
- Chat applications
- Customer support bots
- AI-powered assistants

---

### Use Case 7: Batch Processing

```typescript
import { AverQelHarness } from '@averqel/neosis-sdk-client'
import { readdir, readFile, writeFile } from 'node:fs/promises'

async function processDirectory(inputDir: string, outputDir: string) {
  await using harness = new AverQelHarness({
    profile: 'sdk',
    provider: 'deepseek-official',
    model: 'deepseek-v4-flash',
  })

  const files = await readdir(inputDir)

  for (const file of files) {
    if (!file.endsWith('.md')) continue

    const content = await readFile(`${inputDir}/${file}`, 'utf-8')

    const result = await harness.run(
      `Summarize this document:\n\n${content}`
    )

    await writeFile(`${outputDir}/${file}.summary`, result.finalResponse)
    console.log(`Processed ${file}`)
  }
}

processDirectory('./docs', './summaries').catch(console.error)
```

**Where it's useful:**
- Document processing
- Content summarization
- Batch analysis

---

## Error Handling

```typescript
import {
  AverQelHarness,
  JsonRpcResponseError,
  RequestTimeoutError,
  SdkProtocolError,
  TransportClosedError,
} from '@averqel/neosis-sdk-client'

async function main() {
  await using harness = new AverQelHarness({
    profile: 'sdk',
    provider: 'deepseek-official',
    model: 'deepseek-v4-flash',
  })

  try {
    const result = await harness.run('Do something')
    console.log(result.finalResponse)
  } catch (error) {
    if (error instanceof JsonRpcResponseError) {
      console.error('Wire error:', error.code, error.data)
    } else if (error instanceof RequestTimeoutError) {
      console.error('Request timed out')
    } else if (error instanceof SdkProtocolError) {
      console.error('Protocol violation:', error.message)
    } else if (error instanceof TransportClosedError) {
      console.error('Runtime closed:', error.exitCode, error.stderrTail)
    } else {
      console.error('Unknown error:', error)
    }
  }
}

main().catch(console.error)
```

---

## Low-Level API (Direct Protocol Access)

```typescript
import { HarnessClient } from '@averqel/neosis-sdk-client'

async function main() {
  const client = new HarnessClient({
    profile: 'sdk',
    provider: 'deepseek-official',
    model: 'deepseek-v4-flash',
  })

  // Start the runtime
  client.start()
  await client.initialize({
    cwd: process.cwd(),
    provider: 'deepseek-official',
    model: 'deepseek-v4-flash',
  })

  // Send a prompt (returns immediately with message ID)
  const messageId = await client.prompt('Say hello')

  // Subscribe to notifications
  const subscription = client.subscribe()
  for await (const notification of subscription) {
    console.log('Notification:', notification)

    // Stop when agent becomes idle
    if (notification.method === 'session.status' &&
        notification.params.status === 'idle') {
      break
    }
  }

  // Close the runtime
  await client.close()
}

main().catch(console.error)
```

**When to use low-level API:**
- Need fine-grained control
- Want to handle notifications manually
- Building custom protocols
- Need non-blocking prompt submission

---

## Best Practices

### 1. Always Close the Harness

```typescript
// ✅ Good - automatic cleanup
await using harness = new AverQelHarness({...})
await harness.run('...')

// ✅ Good - explicit cleanup
const harness = new AverQelHarness({...})
try {
  await harness.run('...')
} finally {
  await harness.close()
}

// ❌ Bad - resource leak
const harness = new AverQelHarness({...})
await harness.run('...')
// Forgot to close!
```

### 2. Reuse Harness for Multiple Turns

```typescript
// ✅ Good - one harness, multiple turns
await using harness = new AverQelHarness({...})
await harness.run('Turn 1')
await harness.run('Turn 2')
await harness.run('Turn 3')

// ❌ Bad - creates new process each time
await using harness1 = new AverQelHarness({...})
await harness1.run('Turn 1')

await using harness2 = new AverQelHarness({...})
await harness2.run('Turn 2')
```

### 3. Handle Errors Gracefully

```typescript
// ✅ Good - specific error handling
try {
  const result = await harness.run('...')
} catch (error) {
  if (error instanceof TransportClosedError) {
    // Runtime crashed, maybe restart
  } else if (error instanceof RequestTimeoutError) {
    // Took too long, maybe retry with shorter task
  }
}

// ❌ Bad - generic error handling
try {
  await harness.run('...')
} catch (error) {
  console.error('Something went wrong')
}
```

### 4. Use Notifications for Progress

```typescript
// ✅ Good - show progress to user
const result = await harness.run('Complex task', {
  onNotification: (notification) => {
    if (notification.method === 'session.event') {
      const event = notification.params.event
      if (event.type === 'tool/start') {
        updateProgress(`Running: ${event.data.tool}`)
      }
    }
  },
})

// ❌ Bad - no feedback, user waits blindly
const result = await harness.run('Complex task')
```

---

## Summary

**What you can do with the SDK:**
- ✅ Programmatically control NeoSIS agents
- ✅ Build custom tools and automation
- ✅ Integrate AI into your applications
- ✅ Automate code review, testing, documentation
- ✅ Build chatbots and assistants
- ✅ Process files and documents in batch
- ✅ Monitor agent behavior in real-time

**Where it's useful:**
- CI/CD pipelines
- Developer tools
- Chat applications
- Document processing
- Code generation
- Test automation
- API integration

**Key benefits:**
- Full NeoSIS capability in your code
- Type-safe TypeScript API
- Real-time event streaming
- Session management
- Custom configuration
- Error handling

The SDK gives you complete programmatic control over NeoSIS, limited only by your imagination!
