/** Default DeepSeek model catalog. */
import { DEFAULT_CONTEXT_WINDOW } from './defaults.ts'
import type { AverQelCatalogModel } from './types.ts'

/** Advisory official model entries; deployments may replace the catalog. */
export const DEFAULT_MODELS: AverQelCatalogModel[] = [
  {
    id: 'deepseek-flash',
    name: 'DeepSeek-V4.1-Flash',
    contextWindow: DEFAULT_CONTEXT_WINDOW,
    inputModalities: ['text', 'image'],
    systemPromptUpdate: 'in-history',
  },
  {
    id: 'deepseek-v4-pro',
    name: 'DeepSeek-V4-Pro',
    description: 'Stronger agentic coding, knowledge, and difficult reasoning; suited to complex or quality-critical tasks at higher cost.',
    contextWindow: DEFAULT_CONTEXT_WINDOW,
  },
]
