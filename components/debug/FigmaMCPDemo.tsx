import React, { useState, useEffect } from 'react'
import { useFigmaMCP, FigmaComponent } from '../hooks/useFigmaMCP'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { toast } from 'sonner'
import { 
  Search, 
  FileText, 
  Download, 
  MessageCircle, 
  ExternalLink,
  User,
  Loader2,
  AlertCircle,
  Info
} from 'lucide-react'

export const FigmaMCPDemo: React.FC = () => {
  const {
    loading,
    error,
    getUserInfo,
    getFile,
    searchComponents,
    exportImages,
    getComments,
    postComment
  } = useFigmaMCP()

  const [userInfo, setUserInfo] = useState<any>(null)
  const [fileKey, setFileKey] = useState('')
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FigmaComponent[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')

  // Load user info on component mount
  useEffect(() => {
    loadUserInfo()
  }, [])

  const loadUserInfo = async () => {
    try {
      const info = await getUserInfo()
      setUserInfo(info)
      toast.success('Figma connection established')
    } catch (err) {
      toast.error('Failed to connect to Figma. Make sure your access token is configured.')
    }
  }

  const handleFileLoad = async () => {
    if (!fileKey.trim()) {
      toast.error('Please enter a Figma file key')
      return
    }

    try {
      console.log('🔄 Loading Figma file:', fileKey.trim())
      const fileData = await getFile(fileKey.trim())
      setSelectedFile(fileData)
      
      toast.success('File loaded successfully')
      console.log('✅ File loaded:', { 
        name: fileData.name, 
        version: fileData.version
      })
      
      // Load comments for this file
      try {
        const fileComments = await getComments(fileKey.trim())
        setComments(fileComments)
      } catch (commentErr) {
        console.warn('⚠️ Could not load comments:', commentErr)
        setComments([])
      }
    } catch (err) {
      console.error('❌ File load failed:', err)
      
      // Handle the improved error response structure from backend
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      
      if (errorMessage.includes('File type not supported')) {
        toast.error('File type not supported: Only standard Figma design files work with this integration.')
      } else if (errorMessage.includes('File not found')) {
        toast.error('File not found: Check the file key and ensure you have access.')
      } else if (errorMessage.includes('Access denied')) {
        toast.error('Access denied: Your Figma token needs permission for this file.')
      } else {
        toast.error(`Failed to load file: ${errorMessage}`)
      }
    }
  }

  const handleSearch = async () => {
    if (!selectedFile || !searchQuery.trim()) {
      toast.error('Please load a file and enter a search query')
      return
    }

    try {
      const results = await searchComponents(fileKey, searchQuery)
      setSearchResults(results)
      toast.success(`Found ${results.length} matching components`)
    } catch (err) {
      toast.error('Search failed')
    }
  }

  const handleExportImage = async (nodeId: string) => {
    if (!selectedFile) {
      toast.error('Please load a file first')
      return
    }

    try {
      const exportData = await exportImages(fileKey, [nodeId], {
        format: 'png',
        scale: 2
      })
      
      if (exportData.images && exportData.images[nodeId]) {
        const imageUrl = exportData.images[nodeId]
        window.open(imageUrl, '_blank')
        toast.success('Image exported successfully')
      } else {
        toast.error('No image URL received')
      }
    } catch (err) {
      toast.error('Failed to export image')
    }
  }

  const handlePostComment = async () => {
    if (!selectedFile || !newComment.trim()) {
      toast.error('Please enter a comment')
      return
    }

    try {
      await postComment(fileKey, newComment, {
        x: 100,
        y: 100
      })
      setNewComment('')
      
      // Reload comments
      const updatedComments = await getComments(fileKey)
      setComments(updatedComments)
      toast.success('Comment posted successfully')
    } catch (err) {
      toast.error('Failed to post comment')
    }
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Figma MCP Connection Error
          </CardTitle>
          <CardDescription className="text-red-600">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Make sure you have configured your Figma Access Token in the environment variables.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Figma MCP Integration Demo
          </CardTitle>
          <CardDescription>
            Connect with Figma files, search components, export images, and manage comments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userInfo && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Connected to Figma</span>
              </div>
              <p className="text-sm text-green-700">
                Hello, {userInfo.handle}! You can now access your Figma files.
              </p>
            </div>
          )}

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">How to get a Figma file key:</span>
            </div>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Open your Figma file in the browser</li>
              <li>Copy the file key from the URL: <code>figma.com/file/[FILE_KEY]/...</code></li>
              <li>Example: For URL <code>figma.com/file/ABC123DEF456/My-Design</code>, the file key is <code>ABC123DEF456</code></li>
              <li>Paste the file key below to load the file</li>
              <li><strong>Note:</strong> Only standard Figma design files are supported (not FigJam boards)</li>
            </ol>
          </div>

          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Enter Figma file key (e.g., ABC123DEF456...)"
              value={fileKey}
              onChange={(e) => setFileKey(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleFileLoad()}
            />
            <Button onClick={handleFileLoad} disabled={loading || !fileKey.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
              Load File
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedFile && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Component Search
              </CardTitle>
              <CardDescription>Search for components in the selected file</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Search components..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Search Results ({searchResults.length})</h4>
                  {searchResults.map((component) => (
                    <div key={component.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <h5 className="font-medium">{component.name}</h5>
                        {component.description && (
                          <p className="text-sm text-gray-600">{component.description}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary">Component</Badge>
                          <Badge variant="outline">{component.id}</Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportImage(component.id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Comments ({comments.length})
              </CardTitle>
              <CardDescription>View and add comments to the Figma file</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-3 border rounded">
                    <div className="flex items-center gap-2 mb-2">
                      {comment.user.img_url && (
                        <img 
                          src={comment.user.img_url} 
                          alt={comment.user.handle}
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <span className="font-medium text-sm">{comment.user.handle}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{comment.message}</p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="flex gap-2">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
                />
                <Button onClick={handlePostComment} disabled={loading || !newComment.trim()}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>File Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Name:</strong> {selectedFile.name}</p>
                <p><strong>File Key:</strong> {fileKey}</p>
                <p><strong>Version:</strong> {selectedFile.version}</p>
                {selectedFile.document && (
                  <p><strong>Pages:</strong> {selectedFile.document.children?.length || 0}</p>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(`https://figma.com/file/${fileKey}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open in Figma
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
