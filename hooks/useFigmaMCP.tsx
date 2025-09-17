import { useState, useCallback } from 'react'
import { projectId, publicAnonKey } from '../utils/supabase/info'

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-5976446e`

export interface FigmaFile {
  key: string
  name: string
  thumbnail_url: string
  last_modified: string
}

export interface FigmaNode {
  id: string
  name: string
  type: string
  children?: FigmaNode[]
}

export interface FigmaComponent {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface FigmaComment {
  id: string
  message: string
  client_meta: any
  created_at: string
  user: {
    id: string
    handle: string
    img_url: string
  }
}

export const useFigmaMCP = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const makeRequest = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    setLoading(true)
    setError(null)

    try {
      console.log('🔗 Making Figma MCP request:', `${API_BASE}${endpoint}`)
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      const data = await response.json()
      console.log('📨 Figma MCP response:', { status: response.status, data })

      if (!response.ok) {
        const errorMessage = data.error || data.details || `HTTP ${response.status}: ${response.statusText}`
        console.error('❌ Figma MCP request failed:', errorMessage)
        throw new Error(errorMessage)
      }

      // Handle both direct data and wrapped responses
      if (data.success === false) {
        throw new Error(data.error || data.details || 'Request failed')
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('❌ Figma MCP Error:', errorMessage, err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Get user info and available operations
  const getUserInfo = useCallback(async () => {
    const result = await makeRequest('/figma/user')
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.data
  }, [makeRequest])

  // Get specific file details
  const getFile = useCallback(async (fileKey: string) => {
    const result = await makeRequest(`/figma/file/${fileKey}`)
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.data
  }, [makeRequest])

  // Get specific nodes from a file
  const getFileNodes = useCallback(async (fileKey: string, nodeIds: string[]) => {
    const idsParam = nodeIds.join(',')
    const result = await makeRequest(`/figma/file/${fileKey}/nodes?ids=${idsParam}`)
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.data
  }, [makeRequest])

  // Export images from Figma
  const exportImages = useCallback(async (
    fileKey: string, 
    nodeIds: string[], 
    options: {
      format?: 'jpg' | 'png' | 'svg' | 'pdf'
      scale?: number
    } = {}
  ) => {
    const { format = 'png', scale = 2 } = options
    const idsParam = nodeIds.join(',')
    const result = await makeRequest(
      `/figma/export/${fileKey}?ids=${idsParam}&format=${format}&scale=${scale}`
    )
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.data
  }, [makeRequest])

  // Search for components in a file
  const searchComponents = useCallback(async (
    fileKey: string, 
    query: string
  ): Promise<FigmaComponent[]> => {
    const result = await makeRequest(`/figma/search/${fileKey}?q=${encodeURIComponent(query)}`)
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.data
  }, [makeRequest])

  // Get comments on a file
  const getComments = useCallback(async (fileKey: string): Promise<FigmaComment[]> => {
    const result = await makeRequest(`/figma/comments/${fileKey}`)
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.data.comments || []
  }, [makeRequest])

  // Post a comment on a file
  const postComment = useCallback(async (
    fileKey: string, 
    message: string, 
    clientMeta?: any
  ) => {
    const result = await makeRequest(`/figma/comments/${fileKey}`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        client_meta: clientMeta
      })
    })
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.data
  }, [makeRequest])

  return {
    loading,
    error,
    getUserInfo,
    getFile,
    getFileNodes,
    exportImages,
    searchComponents,
    getComments,
    postComment,
  }
}