# Angular to React Service Migration Guide

This guide explains how Angular services have been ported to React equivalents.

## Overview

Angular services have been converted to:
- **REST Services** → React hooks (`use-*.ts`)
- **State Management Services** → React Context + hooks
- **Utility Services** → React hooks or utility functions

## Architecture

### Base Infrastructure

1. **`lib/api/client.ts`** - HTTP client replacing Angular's `HttpClient`
   - Uses native `fetch` API
   - Handles JSON and FormData
   - Provides typed responses

2. **`lib/api/base-service.ts`** - Abstract base class for REST services
   - Replaces `AbstractPaperlessService`
   - Provides CRUD operations
   - Handles pagination, sorting, filtering

3. **`lib/api/hooks/`** - React hooks for services
   - Each service gets a `use-*.ts` hook file
   - Provides loading states and error handling
   - Returns async functions instead of Observables

## Migration Patterns

### Pattern 1: Simple REST Service

**Angular:**
```typescript
@Injectable({ providedIn: 'root' })
export class ConfigService {
  protected http = inject(HttpClient)
  
  getConfig(): Observable<PaperlessConfig> {
    return this.http.get<[PaperlessConfig]>(this.baseUrl).pipe(
      first(),
      map((configs) => configs[0])
    )
  }
}
```

**React:**
```typescript
export function useConfig() {
  const [loading, setLoading] = useState(false)
  
  const getConfig = useCallback(async (): Promise<PaperlessConfig> => {
    setLoading(true)
    try {
      const response = await apiClient.get<[PaperlessConfig]>('config/')
      return response.data[0]
    } finally {
      setLoading(false)
    }
  }, [])
  
  return { getConfig, loading }
}
```

**Usage:**
```typescript
function MyComponent() {
  const { getConfig, loading } = useConfig()
  
  useEffect(() => {
    getConfig().then(config => {
      // Use config
    })
  }, [])
}
```

### Pattern 2: Base Service Extension

**Angular:**
```typescript
export class DocumentService extends AbstractPaperlessService<Document> {
  constructor() {
    super()
    this.resourceName = 'documents'
  }
}
```

**React:**
```typescript
export class DocumentService extends BaseService<Document> {
  constructor() {
    super('documents')
  }
}

// Then create a hook wrapper
export function useDocuments() {
  const service = useMemo(() => new DocumentService(), [])
  // ... hook implementation
}
```

### Pattern 3: State Management Service

For complex state management (like `DocumentListViewService`), use React Context:

**Angular:**
```typescript
@Injectable({ providedIn: 'root' })
export class DocumentListViewService {
  private stateSubject = new BehaviorSubject<ListViewState>(...)
  
  get state$(): Observable<ListViewState> {
    return this.stateSubject.asObservable()
  }
}
```

**React:**
```typescript
// Create context
const DocumentListViewContext = createContext<DocumentListViewState | null>(null)

// Create provider component
export function DocumentListViewProvider({ children }) {
  const [state, setState] = useState<ListViewState>(...)
  // ... state management logic
  
  return (
    <DocumentListViewContext.Provider value={{ state, setState }}>
      {children}
    </DocumentListViewContext.Provider>
  )
}

// Create hook
export function useDocumentListView() {
  const context = useContext(DocumentListViewContext)
  if (!context) throw new Error('Must be used within provider')
  return context
}
```

## Key Differences

### Observables → Promises/Async Functions

- **Angular:** Uses RxJS Observables with `.subscribe()`
- **React:** Uses async/await with Promises

### Dependency Injection → Hooks

- **Angular:** Services injected via constructor
- **React:** Hooks called directly in components

### State Management

- **Angular:** Services hold state, components subscribe
- **React:** Use Context API or state management library (Redux, Zustand, etc.)

## Ported Services

### ✅ Completed
- `ConfigService` → `use-config.ts`
- `ProfileService` → `use-profile.ts`

### 🔄 To Port
- All services in `app/services/rest/` → Extend `BaseService` and create hooks
- `DocumentListViewService` → React Context + hooks
- `SettingsService` → React Context + hooks
- `TasksService` → React hooks with WebSocket support
- `WebsocketStatusService` → React hooks with WebSocket

## Next Steps

1. **Install React Query (optional but recommended):**
   ```bash
   npm install @tanstack/react-query
   ```
   This provides caching, refetching, and better loading states.

2. **Port remaining REST services:**
   - Create hooks for each service in `rest/` folder
   - Follow the `BaseService` pattern

3. **Port state management services:**
   - Use React Context for global state
   - Consider Zustand or Redux Toolkit for complex state

4. **Update components:**
   - Replace Angular service injections with React hooks
   - Update Observable subscriptions to async/await

## Example: Using React Query (Recommended)

For better caching and state management, consider using React Query:

```typescript
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'

export function useConfig() {
  const query = useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const response = await apiClient.get<[PaperlessConfig]>('config/')
      return response.data[0]
    },
  })

  const mutation = useMutation({
    mutationFn: async (config: PaperlessConfig) => {
      const response = await apiClient.patch(`config/${config.id}/`, config)
      return response.data
    },
    onSuccess: () => {
      query.refetch()
    },
  })

  return {
    config: query.data,
    loading: query.isLoading,
    error: query.error,
    saveConfig: mutation.mutate,
  }
}
```

