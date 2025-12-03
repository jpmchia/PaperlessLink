# React Service Hooks

This directory contains React hooks that replace Angular services.

## Usage Examples

### ConfigService Hook

```typescript
import { useConfig } from '@/lib/api/hooks/use-config'
import { useEffect, useState } from 'react'

function ConfigComponent() {
  const { getConfig, saveConfig, loading, error } = useConfig()
  const [config, setConfig] = useState(null)

  useEffect(() => {
    getConfig().then(setConfig)
  }, [getConfig])

  const handleSave = async () => {
    try {
      const updated = await saveConfig(config)
      setConfig(updated)
      alert('Config saved!')
    } catch (err) {
      console.error('Failed to save:', err)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!config) return null

  return (
    <div>
      <h1>{config.app_title}</h1>
      <button onClick={handleSave}>Save</button>
    </div>
  )
}
```

### ProfileService Hook

```typescript
import { useProfile } from '@/lib/api/hooks/use-profile'
import { useEffect, useState } from 'react'

function ProfileComponent() {
  const { get, update, loading } = useProfile()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    get().then(setProfile)
  }, [get])

  const handleUpdate = async (updates) => {
    const updated = await update({ ...profile, ...updates })
    setProfile(updated)
  }

  return (
    <div>
      {profile && (
        <form onSubmit={(e) => {
          e.preventDefault()
          handleUpdate({ first_name: e.target.firstName.value })
        }}>
          <input name="firstName" defaultValue={profile.first_name} />
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </form>
      )}
    </div>
  )
}
```

## Available Hooks

- `useConfig()` - Configuration management
- `useProfile()` - User profile management

## Creating New Hooks

Follow this pattern:

```typescript
import { useState, useCallback } from 'react'
import { apiClient } from '../client'

export function useYourService() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const yourMethod = useCallback(async (): Promise<ReturnType> => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<ReturnType>('endpoint/')
      return response.data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Operation failed')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    yourMethod,
    loading,
    error,
  }
}
```

