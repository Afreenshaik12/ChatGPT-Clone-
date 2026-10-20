import { ChatSession, ChatMessage } from './ChatTypes';

const STORAGE_KEY = 'chatgpt_ui_sessions';
const ACTIVE_SESSION_KEY = 'chatgpt_ui_active_id';
const THEME_KEY = 'chatgpt_ui_theme';

export const DEFAULT_MODELS = [
  {
    id: 'gpt-4o',
    name: 'ChatGPT-4o',
    description: 'Our smartest and most versatile model for text, reasoning, and coding.',
    tag: 'Default',
    iconType: 'sparkles' as const,
  },
  // {
  //   id: 'gpt-4o-mini',
  //   name: 'ChatGPT-4o mini',
  //   description: 'Affordable and intelligent small model for fast everyday tasks.',
  //   tag: 'Fast',
  //   iconType: 'zap' as const,
  // },
  // {
  //   id: 'o1-preview',
  //   name: 'o1-preview',
  //   description: 'Uses advanced chain-of-thought reasoning for complex math and engineering.',
  //   tag: 'Reasoning',
  //   iconType: 'brain' as const,
  // },
];

export const INITIAL_PROMPT_SUGGESTIONS = [
  {
    category: 'Create & Design',
    title: 'Design your new App!',
    subtitle: 'for a mobile finance product',
    prompt: 'Design a clean, 3-step interactive user onboarding flow for a personal finance mobile app. Include microcopy, key visual elements, and privacy assurances.',
  },
  {
    category: 'Code & Debug',
    title: 'Optimize you code for better performance',
    subtitle: 'with memo, virtualization & hooks',
    prompt: 'Show me best practices and an illustrative TypeScript example for optimizing list rendering performance in React using useMemo, useCallback, and windowing.',
  },
  {
    category: 'Write & Edit',
    title: 'Write an essay regarding neural networks',
    subtitle: 'for a new developer utility',
    prompt: 'Draft an engaging, concise product launch announcement for developers introducing an open-source productivity CLI tool. Focus on developer ergonomics.',
  },
  {
    category: 'Analyze & Think',
    title: 'Explain how vector embeddings work',
    subtitle: 'with a high-dimensional vector analogy',
    prompt: 'Explain how vector embeddings and semantic search work in modern LLMs using an intuitive analogy and a simple step-by-step mathematical intuition.',
  },
];

export function getStoredTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return 'dark'; // ChatGPT dark aesthetic default
}

export function setStoredTheme(theme: 'dark' | 'light') {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_KEY, theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function loadSavedSessions(): { sessions: ChatSession[]; activeId: string | null } {
  if (typeof window === 'undefined') {
    return { sessions: [], activeId: null };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const activeId = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (raw) {
      const parsed: ChatSession[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return {
          sessions: parsed,
          activeId: activeId || parsed[0].id,
        };
      }
    }
  } catch {
    // fallback if corrupted
  }

  // Seed sample session to look authentic
  const sampleSessions: ChatSession[] = [
    {
      id: 'session-demo-1',
      title: 'Python async web scraper with rate limits',
      createdAt: Date.now() - 1000 * 60 * 60 * 2,
      updatedAt: Date.now() - 1000 * 60 * 60 * 2,
      model: 'gpt-4o',
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          content: 'How do I write a high-throughput Python async web scraper that gracefully respects rate limits?',
          timestamp: Date.now() - 1000 * 60 * 60 * 2,
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: `Here is a production-ready asynchronous scraper pattern in Python using \`asyncio\` and \`aiohttp\`. It utilizes an \`asyncio.Semaphore\` to bound concurrent requests and implements exponential backoff retry logic.

### Complete Implementation

\`\`\`python
import asyncio
import aiohttp
from typing import List, Optional

class ResilientScraper:
    def __init__(self, max_concurrent: int = 5, delay: float = 0.2):
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.delay = delay

    async def fetch_url(self, session: aiohttp.ClientSession, url: str) -> Optional[str]:
        async with self.semaphore:
            # Respect rate limit between queries
            await asyncio.sleep(self.delay)
            for attempt in range(3):
                try:
                    async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                        if response.status == 200:
                            return await response.text()
                        elif response.status == 429:
                            backoff = 2 ** attempt
                            print(f"[Rate Limited] Backing off {backoff}s on {url}")
                            await asyncio.sleep(backoff)
                except Exception as err:
                    print(f"Error fetching {url}: {err}")
                    await asyncio.sleep(1)
            return None

    async def scrape_all(self, urls: List[str]):
        async with aiohttp.ClientSession() as session:
            tasks = [self.fetch_url(session, u) for u in urls]
            return await asyncio.gather(*tasks)

# Example execution
if __name__ == "__main__":
    targets = ["https://example.com" for _ in range(10)]
    scraper = ResilientScraper(max_concurrent=3)
    results = asyncio.run(scraper.scrape_all(targets))
    print(f"Successfully scraped {len([r for r in results if r])} pages.")
\`\`\`

### Key Architectural Safeguards:
1. **Concurrency Bounds**: The semaphore guarantees you never exceed the target server's peak socket budget.
2. **Exponential Backoff**: When a \`429 Too Many Requests\` response is received, the scraper pauses before retrying.
3. **Session Pooling**: A single \`aiohttp.ClientSession\` keeps TCP connections open via keep-alive.`,
          timestamp: Date.now() - 1000 * 60 * 60 * 2 + 1500,
        },
      ],
    },
    {
      id: 'session-demo-2',
      title: 'Architecting Clean Microservices with gRPC',
      createdAt: Date.now() - 1000 * 60 * 60 * 26,
      updatedAt: Date.now() - 1000 * 60 * 60 * 26,
      model: 'gpt-4o',
      messages: [
        {
          id: 'msg-3',
          role: 'user',
          content: 'Compare gRPC vs REST for high-performance internal microservices.',
          timestamp: Date.now() - 1000 * 60 * 60 * 26,
        },
        {
          id: 'msg-4',
          role: 'assistant',
          content: `When comparing **gRPC** and **REST** for internal service-to-service communication, gRPC offers significant throughput and latency advantages:

| Dimension | gRPC (HTTP/2 + Protobuf) | REST (HTTP/1.1 + JSON) |
| :--- | :--- | :--- |
| **Serialization** | Binary Protobuf (up to 7-10x faster) | Text JSON (parsing overhead) |
| **Multiplexing** | True HTTP/2 bidirectional multiplexing | Head-of-line blocking (HTTP/1.1) |
| **Schema Strictness** | Strict compile-time contract (\`.proto\`) | Usually loose / OpenAPI runtime |
| **Streaming** | Client, Server, and Bidirectional streams | Polling or Server-Sent Events (SSE) |
| **Browser Support** | Requires gRPC-Web proxy | Universal native support |

**Recommendation:** For internal, high-throughput microservices, prefer **gRPC** for low latency and automatic client SDK generation. Keep **REST** at the public API Gateway layer.`,
          timestamp: Date.now() - 1000 * 60 * 60 * 26 + 2000,
        },
      ],
    },
  ];

  return { sessions: sampleSessions, activeId: sampleSessions[0].id };
}

export function persistSessions(sessions: ChatSession[], activeId: string | null) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    if (activeId) {
      localStorage.setItem(ACTIVE_SESSION_KEY, activeId);
    }
  } catch {
    // quota exceeded or private mode
  }
}

/**
 * Intelligent responses simulator that dynamically parses query intent
 * and produces rich, markdown-formatted ChatGPT responses with code, tables, and lists.
 */
export function generateContextualResponse(
  userQuery: string,
  model: string,
  webSearchEnabled: boolean,
  reasoningEnabled: boolean
): string {
  const queryLower = userQuery.toLowerCase().trim();

  const searchPrefix = webSearchEnabled
    ? `> **Searched the web** for "*${userQuery.slice(0, 40)}...*"\n\n`
    : '';

  const reasoningPrefix = reasoningEnabled
    ? `*Thought for 4 seconds about the problem constraints, edge cases, and optimal structure...*\n\n`
    : '';

  // 1. Code / Programming
  if (
    queryLower.includes('code') ||
    queryLower.includes('react') ||
    queryLower.includes('typescript') ||
    queryLower.includes('javascript') ||
    queryLower.includes('python') ||
    queryLower.includes('function') ||
    queryLower.includes('debug') ||
    queryLower.includes('api') ||
    queryLower.includes('hook') ||
    queryLower.includes('css') ||
    queryLower.includes('html') ||
    queryLower.includes('algorithm')
  ) {
    if (queryLower.includes('python')) {
      return `${searchPrefix}${reasoningPrefix}Here is a clean and idiomatic Python solution tailored to your request:

\`\`\`python
import time
from functools import wraps
from typing import Callable, Any

def timed_execution(func: Callable[..., Any]) -> Callable[..., Any]:
    """Decorator to measure and log function execution time."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start_time
        print(f"[{func.__name__}] executed in {elapsed:.4f}s")
        return result
    return wrapper

@timed_execution
def compute_data_pipeline(records: list[int]) -> dict[str, Any]:
    # Filter and transform data efficiently
    evens = [x for x in records if x % 2 == 0]
    squared_sum = sum(x ** 2 for x in evens)
    return {
        "count": len(evens),
        "total_squared": squared_sum,
        "average": squared_sum / len(evens) if evens else 0
    }

if __name__ == "__main__":
    sample = list(range(100_000))
    metrics = compute_data_pipeline(sample)
    print("Results:", metrics)
\`\`\`

### Explanation:
- **Decorators**: \`@wraps(func)\` preserves original function docstrings and introspective metadata.
- **Precision**: \`time.perf_counter()\` provides high-resolution monotonic clock measurements.
- **Memory Efficiency**: Generator expressions \`sum(x ** 2 for x in evens)\` compute sums without allocating intermediate arrays in memory.`;
    }

    // Default React / TypeScript code
    return `${searchPrefix}${reasoningPrefix}Here is a clean, production-grade TypeScript implementation for your request:

\`\`\`tsx
import React, { useState, useCallback, useMemo } from 'react';

interface TaskItem {
  id: string;
  label: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

export function TaskManager() {
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: '1', label: 'Review pull request #284', completed: false, priority: 'high' },
    { id: '2', label: 'Benchmark database query indices', completed: true, priority: 'medium' },
  ]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'pending': return tasks.filter(t => !t.completed);
      case 'completed': return tasks.filter(t => t.completed);
      default: return tasks;
    }
  }, [tasks, filter]);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  }, []);

  return (
    <div className="p-6 max-w-lg mx-auto bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <h2 className="text-lg font-semibold tracking-tight">Active Work Items</h2>
        <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
          {filteredTasks.length} items
        </span>
      </div>

      <div className="flex gap-2 my-4">
        {(['all', 'pending', 'completed'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={\`px-3 py-1 text-xs font-medium rounded-lg capitalize transition-colors \${
              filter === tab ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }\`}
          >
            {tab}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {filteredTasks.map(task => (
          <li
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 cursor-pointer transition-colors"
          >
            <span className={task.completed ? 'line-through text-neutral-500' : 'text-neutral-200'}>
              {task.label}
            </span>
            <span className="text-xs uppercase font-mono tracking-wider text-neutral-400">
              {task.priority}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
\`\`\`

### Key Architectural Points:
1. **Derived State via \`useMemo\`**: Filtering is computed reactively without duplicating list state in React state memory.
2. **Stable Handlers**: \`useCallback\` prevents child re-render churn during high-frequency parent state changes.
3. **Type Safety**: Strictly typed union \`'all' | 'pending' | 'completed'\` guarantees compile-time validation.`;
  }

  // 2. Writing / Email / Marketing
  if (
    queryLower.includes('write') ||
    queryLower.includes('email') ||
    queryLower.includes('draft') ||
    queryLower.includes('launch') ||
    queryLower.includes('announcement') ||
    queryLower.includes('letter') ||
    queryLower.includes('copy')
  ) {
    return `${searchPrefix}${reasoningPrefix}Here is a polished, high-impact draft crafted specifically for your audience:

### Subject: Announcing the Launch of our New Developer Platform

**Hi team and community,**

We are thrilled to share that starting today, our updated core infrastructure is live for all developers. 

Over the past four months, we've focused on eliminating latency, polishing the developer experience, and delivering the fastest workflow possible.

### What's New:
- **Instant Sync Engine**: Near-instant data synchronization across distributed edge nodes.
- **Zero-Config Tooling**: Run in seconds with native TypeScript support out of the box.
- **Granular Controls**: Enhanced observability and debugging dashboards built right into your workspace.

### Getting Started:
You can test the latest preview in your terminal right now:
\`\`\`bash
npm create modern-platform@latest --template minimal
cd modern-platform && npm run dev
\`\`\`

We would love your feedback as we continue refining the platform. Let us know your thoughts or report any edge cases directly on our community discussion board.

Warm regards,  
**The Engineering Team**`;
  }

  // 3. Explaining / Concepts / Learning / Science
  if (
    queryLower.includes('explain') ||
    queryLower.includes('what is') ||
    queryLower.includes('how does') ||
    queryLower.includes('why') ||
    queryLower.includes('difference') ||
    queryLower.includes('compare') ||
    queryLower.includes('quantum') ||
    queryLower.includes('vector')
  ) {
    return `${searchPrefix}${reasoningPrefix}Here is a clear, first-principles breakdown of **${userQuery.trim()}**:

### 1. The Core Intuition
Imagine mapping concepts into a multi-dimensional conceptual space. Rather than treating words as isolated static labels, modern systems place related ideas closer together based on context, meaning, and relationships.

### 2. How It Works Step-by-Step
1. **Tokenization & Projection**: Raw input is segmented into discrete tokens and mapped onto high-dimensional vectors.
2. **Contextual Attention**: Multi-head attention layers calculate relevance scores between all active tokens in the sequence simultaneously.
3. **Semantic Alignment**: The system determines meaning based on relative angles (cosine similarity) rather than exact keyword matches.

### 3. Comparison Overview
| Property | Traditional Keyword Matching | Semantic Understanding |
| :--- | :--- | :--- |
| **Lookup Method** | Exact substring / regex index | High-dimensional vector distance |
| **Synonym Handling** | Requires manual thesaurus rules | Inherent and automatic |
| **Context Awareness** | Weak / isolated | Strong contextual nuance |
| **Typo Tolerance** | Low without fuzzy matching | Highly resilient |

> **Key Takeaway**: Understanding the underlying principles allows you to design systems that are both computationally efficient and intuitively aligned with how human language works.`;
  }

  // 4. Default Thoughtful Response
  return `${searchPrefix}${reasoningPrefix}I've structured a comprehensive answer for you:

### Key Insights
- **Clarity & Simplicity**: Keeping the architecture modular ensures seamless maintainability and predictable behavior across edge cases.
- **Performance First**: Optimizing the critical rendering path and minimizing unnecessary re-computations delivers a smooth user experience.
- **Accessibility & Polish**: Subtle micro-interactions, responsive typography, and high-contrast color choices elevate the overall feel.

### Recommended Next Steps
1. **Define the Core Boundary**: Isolate your data state from view presentation layers.
2. **Verify Edge Cases**: Test under low bandwidth, empty data conditions, and dark/light system preferences.
3. **Iterate with Feedback**: Refine the visual spacing and typography rhythm based on real usage.

Let me know if you would like me to dive deeper into any specific section, provide code samples, or adjust the tone!`;
}
