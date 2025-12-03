# Services Porting Summary

## ✅ Completed Services

### REST Services (BaseService)
All REST services have been ported from Angular to React:

1. **DocumentService** (`services/document.service.ts`)
   - Full CRUD operations
   - Filtered listing with FilterRules
   - Preview/thumb/download URLs
   - Bulk operations (edit, download, email)
   - Document suggestions and history
   - Selection data

2. **TagService** (`services/tag.service.ts`)
   - Extends BaseNameFilterService
   - Name filtering support

3. **CorrespondentService** (`services/correspondent.service.ts`)
   - Extends BaseNameFilterService
   - Name filtering support

4. **DocumentTypeService** (`services/document-type.service.ts`)
   - Extends BaseNameFilterService
   - Name filtering support

5. **StoragePathService** (`services/storage-path.service.ts`)
   - Extends BaseNameFilterService
   - Name filtering support

6. **UserService** (`services/user.service.ts`)
   - Extends BaseNameFilterService
   - Name filtering support

7. **GroupService** (`services/group.service.ts`)
   - Extends BaseNameFilterService
   - Name filtering support

8. **CustomFieldsService** (`services/custom-fields.service.ts`)
   - Extends BaseService

9. **SavedViewService** (`services/saved-view.service.ts`)
   - Extends BaseService
   - Special handling for display_fields

10. **WorkflowService** (`services/workflow.service.ts`)
    - Extends BaseService
    - Auto-reloads after mutations

11. **ShareLinkService** (`services/share-link.service.ts`)
    - Extends BaseNameFilterService
    - Document-specific link operations

12. **MailAccountService** (`services/mail-account.service.ts`)
    - Extends BaseService
    - Test and process operations
    - Auto-reloads after mutations

13. **MailRuleService** (`services/mail-rule.service.ts`)
    - Extends BaseService
    - Auto-reloads after mutations

14. **ProcessedMailService** (`services/processed-mail.service.ts`)
    - Extends BaseService
    - Bulk delete operation

### Utility Services

15. **SearchService** (`services/search.service.ts`)
    - Autocomplete
    - Global search

16. **LogService** (`services/log.service.ts`)
    - List logs
    - Get specific log with limit

17. **RemoteVersionService** (`services/remote-version.service.ts`)
    - Check for updates

18. **DocumentNotesService** (`services/document-notes.service.ts`)
    - Get/add/delete notes for documents

### React Hooks

Hooks have been created for commonly used services:

- `use-config.ts` - ConfigService
- `use-profile.ts` - ProfileService
- `use-documents.ts` - DocumentService
- `use-tags.ts` - TagService

## 📋 Remaining Services to Port

### Utility Services (Need React Context/Hooks)

1. **SettingsService** - Complex state management, needs React Context
2. **TasksService** - WebSocket integration needed
3. **ToastService** - UI notification system
4. **PermissionsService** - Permission checking
5. **SystemStatusService** - System status monitoring
6. **WebsocketStatusService** - WebSocket status
7. **OpenDocumentsService** - Document opening state
8. **TrashService** - Trash management
9. **UploadDocumentsService** - File upload handling
10. **DjangoMessagesService** - Django messages
11. **HotKeyService** - Keyboard shortcuts
12. **ComponentRouterService** - Router integration

### Complex State Services (Need React Context)

1. **DocumentListViewService** - Complex document list state management
   - Needs React Context + hooks
   - Manages filter rules, pagination, sorting
   - Integrates with URL params

## Architecture

### Base Classes

- **BaseService** (`base-service.ts`) - Base CRUD operations
- **BaseNameFilterService** (`base-name-filter-service.ts`) - Name filtering support

### HTTP Client

- **ApiClient** (`client.ts`) - Fetch-based HTTP client
  - Replaces Angular HttpClient
  - Handles JSON and FormData
  - Type-safe responses

### Usage Pattern

```typescript
// Direct service usage
import { DocumentService } from '@/lib/api/services'
const service = new DocumentService()
const documents = await service.list({ page: 1, pageSize: 25 })

// Hook usage (recommended)
import { useDocuments } from '@/lib/api/hooks'
function MyComponent() {
  const { list, loading, error } = useDocuments()
  // ...
}
```

## Next Steps

1. Create hooks for remaining REST services (Correspondent, DocumentType, etc.)
2. Port SettingsService to React Context
3. Port DocumentListViewService to React Context + hooks
4. Port WebSocket services (TasksService, WebsocketStatusService)
5. Port utility services (Toast, Permissions, etc.)

## Files Created

- `lib/api/client.ts` - HTTP client
- `lib/api/base-service.ts` - Base REST service
- `lib/api/base-name-filter-service.ts` - Name filter service
- `lib/api/services/*.ts` - All service implementations
- `lib/api/hooks/*.ts` - React hooks
- `lib/api/MIGRATION_GUIDE.md` - Migration guide
- `lib/api/SERVICES_SUMMARY.md` - This file

