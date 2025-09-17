import { Hono } from 'npm:hono'

const app = new Hono()

// Figma API Base URL
const FIGMA_API_BASE = 'https://api.figma.com/v1'

// MCP Server for Figma Integration
class FigmaMCPServer {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  private async figmaRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${FIGMA_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'X-Figma-Token': this.accessToken,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText }
      }
      
      console.error('Figma API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      
      throw new Error(`Figma API Error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  // Get user's Figma files (requires team access)
  async getFiles() {
    try {
      // Note: Figma API doesn't have a direct "recent files" endpoint
      // This is a placeholder that returns instructions for the user
      return {
        success: true,
        data: [],
        message: 'To access Figma files, you need to use specific file keys or team IDs. Use getFile(fileKey) with a specific file key instead.',
        instructions: {
          getSpecificFile: 'Use getFile("YOUR_FILE_KEY") with a file key from a Figma URL',
          getTeamProjects: 'Use getTeamProjects("YOUR_TEAM_ID") to list team projects',
          fileKeyExample: 'File key can be found in URLs like: figma.com/file/ABC123DEF/File-Name'
        }
      }
    } catch (error) {
      console.error('Error in getFiles method:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Get specific file details
  async getFile(fileKey: string) {
    try {
      console.log('📁 Fetching Figma file:', fileKey)
      
      // Use the standard files endpoint - this should work for most Figma design files
      const response = await this.figmaRequest(`/files/${fileKey}`)
      
      console.log('✅ File fetched successfully')
      return {
        success: true,
        data: response
      }
    } catch (error) {
      console.error('❌ Error fetching Figma file:', error)
      
      // Provide specific error handling based on common failure modes
      const errorMessage = error.message
      
      if (errorMessage.includes('File type not supported')) {
        return {
          success: false,
          error: 'File type not supported',
          details: 'This file may be a FigJam board or another unsupported file type. Only standard Figma design files are supported.',
          suggestion: 'Try using a standard Figma design file instead.'
        }
      } else if (errorMessage.includes('404')) {
        return {
          success: false,
          error: 'File not found',
          details: 'The file key may be incorrect or you may not have access to this file.',
          suggestion: 'Check the file key and ensure you have access to the file.'
        }
      } else if (errorMessage.includes('403')) {
        return {
          success: false,
          error: 'Access denied',
          details: 'Your Figma access token does not have permission to access this file.',
          suggestion: 'Make sure your access token has the correct permissions and the file is accessible.'
        }
      } else {
        return {
          success: false,
          error: errorMessage,
          details: 'An unexpected error occurred while fetching the file.'
        }
      }
    }
  }

  // Get file nodes (specific components/frames)
  async getFileNodes(fileKey: string, nodeIds: string[]) {
    try {
      const nodeIdsParam = nodeIds.join(',')
      const response = await this.figmaRequest(`/files/${fileKey}/nodes?ids=${nodeIdsParam}`)
      return {
        success: true,
        data: response
      }
    } catch (error) {
      console.error('Error fetching Figma file nodes:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Export images from Figma
  async exportImages(fileKey: string, nodeIds: string[], options: {
    format?: 'jpg' | 'png' | 'svg' | 'pdf'
    scale?: number
  } = {}) {
    try {
      const { format = 'png', scale = 2 } = options
      const nodeIdsParam = nodeIds.join(',')
      const response = await this.figmaRequest(
        `/images/${fileKey}?ids=${nodeIdsParam}&format=${format}&scale=${scale}`
      )
      return {
        success: true,
        data: response
      }
    } catch (error) {
      console.error('Error exporting Figma images:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Get team projects
  async getTeamProjects(teamId: string) {
    try {
      const response = await this.figmaRequest(`/teams/${teamId}/projects`)
      return {
        success: true,
        data: response
      }
    } catch (error) {
      console.error('Error fetching team projects:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Get comments on a file
  async getComments(fileKey: string) {
    try {
      const response = await this.figmaRequest(`/files/${fileKey}/comments`)
      return {
        success: true,
        data: response
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Post a comment
  async postComment(fileKey: string, message: string, clientMeta: any) {
    try {
      const response = await this.figmaRequest(`/files/${fileKey}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          message,
          client_meta: clientMeta
        })
      })
      return {
        success: true,
        data: response
      }
    } catch (error) {
      console.error('Error posting comment:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Search for components in a file
  async searchComponents(fileKey: string, query: string) {
    try {
      const file = await this.getFile(fileKey)
      if (!file.success) return file

      // Simple search through components
      const components = file.data.components || {}
      const matchingComponents = Object.entries(components)
        .filter(([_, component]: [string, any]) => 
          component.name.toLowerCase().includes(query.toLowerCase()) ||
          component.description?.toLowerCase().includes(query.toLowerCase())
        )
        .map(([id, component]) => ({ id, ...component }))

      return {
        success: true,
        data: matchingComponents
      }
    } catch (error) {
      console.error('Error searching components:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// Initialize MCP server
function createFigmaMCP(accessToken: string) {
  return new FigmaMCPServer(accessToken)
}

// Routes
// Get user info and available operations
app.get('/make-server-5976446e/figma/user', async (c) => {
  try {
    const accessToken = Deno.env.get('FIGMA_ACCESS_TOKEN')
    if (!accessToken) {
      return c.json({ error: 'Figma access token not configured' }, 400)
    }

    const response = await fetch('https://api.figma.com/v1/me', {
      headers: {
        'X-Figma-Token': accessToken,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Figma API Error: ${response.status} - ${error}`)
    }

    const userData = await response.json()
    return c.json({
      success: true,
      data: userData,
      availableOperations: {
        getFile: 'GET /figma/file/:fileKey - Get specific file details',
        getFileNodes: 'GET /figma/file/:fileKey/nodes?ids=node1,node2 - Get specific nodes',
        exportImages: 'GET /figma/export/:fileKey?ids=node1,node2 - Export images',
        searchComponents: 'GET /figma/search/:fileKey?q=query - Search components',
        getComments: 'GET /figma/comments/:fileKey - Get file comments',
        postComment: 'POST /figma/comments/:fileKey - Post a comment'
      }
    })
  } catch (error) {
    console.error('Error in /figma/user:', error)
    return c.json({ error: error.message }, 500)
  }
})

app.get('/make-server-5976446e/figma/file/:fileKey', async (c) => {
  try {
    const accessToken = Deno.env.get('FIGMA_ACCESS_TOKEN')
    if (!accessToken) {
      return c.json({ error: 'Figma access token not configured' }, 400)
    }

    const fileKey = c.req.param('fileKey')
    const mcp = createFigmaMCP(accessToken)
    const result = await mcp.getFile(fileKey)
    return c.json(result)
  } catch (error) {
    console.error('Error in /figma/file:', error)
    return c.json({ error: error.message }, 500)
  }
})

app.get('/make-server-5976446e/figma/file/:fileKey/nodes', async (c) => {
  try {
    const accessToken = Deno.env.get('FIGMA_ACCESS_TOKEN')
    if (!accessToken) {
      return c.json({ error: 'Figma access token not configured' }, 400)
    }

    const fileKey = c.req.param('fileKey')
    const nodeIds = c.req.query('ids')?.split(',') || []
    
    if (nodeIds.length === 0) {
      return c.json({ error: 'Node IDs are required' }, 400)
    }

    const mcp = createFigmaMCP(accessToken)
    const result = await mcp.getFileNodes(fileKey, nodeIds)
    return c.json(result)
  } catch (error) {
    console.error('Error in /figma/file/nodes:', error)
    return c.json({ error: error.message }, 500)
  }
})

app.get('/make-server-5976446e/figma/export/:fileKey', async (c) => {
  try {
    const accessToken = Deno.env.get('FIGMA_ACCESS_TOKEN')
    if (!accessToken) {
      return c.json({ error: 'Figma access token not configured' }, 400)
    }

    const fileKey = c.req.param('fileKey')
    const nodeIds = c.req.query('ids')?.split(',') || []
    const format = c.req.query('format') as 'jpg' | 'png' | 'svg' | 'pdf' || 'png'
    const scale = parseInt(c.req.query('scale') || '2')

    if (nodeIds.length === 0) {
      return c.json({ error: 'Node IDs are required' }, 400)
    }

    const mcp = createFigmaMCP(accessToken)
    const result = await mcp.exportImages(fileKey, nodeIds, { format, scale })
    return c.json(result)
  } catch (error) {
    console.error('Error in /figma/export:', error)
    return c.json({ error: error.message }, 500)
  }
})

app.get('/make-server-5976446e/figma/search/:fileKey', async (c) => {
  try {
    const accessToken = Deno.env.get('FIGMA_ACCESS_TOKEN')
    if (!accessToken) {
      return c.json({ error: 'Figma access token not configured' }, 400)
    }

    const fileKey = c.req.param('fileKey')
    const query = c.req.query('q') || ''

    if (!query) {
      return c.json({ error: 'Search query is required' }, 400)
    }

    const mcp = createFigmaMCP(accessToken)
    const result = await mcp.searchComponents(fileKey, query)
    return c.json(result)
  } catch (error) {
    console.error('Error in /figma/search:', error)
    return c.json({ error: error.message }, 500)
  }
})

app.get('/make-server-5976446e/figma/comments/:fileKey', async (c) => {
  try {
    const accessToken = Deno.env.get('FIGMA_ACCESS_TOKEN')
    if (!accessToken) {
      return c.json({ error: 'Figma access token not configured' }, 400)
    }

    const fileKey = c.req.param('fileKey')
    const mcp = createFigmaMCP(accessToken)
    const result = await mcp.getComments(fileKey)
    return c.json(result)
  } catch (error) {
    console.error('Error in /figma/comments:', error)
    return c.json({ error: error.message }, 500)
  }
})

app.post('/make-server-5976446e/figma/comments/:fileKey', async (c) => {
  try {
    const accessToken = Deno.env.get('FIGMA_ACCESS_TOKEN')
    if (!accessToken) {
      return c.json({ error: 'Figma access token not configured' }, 400)
    }

    const fileKey = c.req.param('fileKey')
    const { message, client_meta } = await c.req.json()

    if (!message) {
      return c.json({ error: 'Message is required' }, 400)
    }

    const mcp = createFigmaMCP(accessToken)
    const result = await mcp.postComment(fileKey, message, client_meta)
    return c.json(result)
  } catch (error) {
    console.error('Error in /figma/comments post:', error)
    return c.json({ error: error.message }, 500)
  }
})

export default app