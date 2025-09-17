import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, WifiOff } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  isNetworkError: boolean
}

export class AsyncErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      isNetworkError: false,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if it's a network-related error
    const isNetworkError = 
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.message.includes('Failed to fetch') ||
      error.name === 'TypeError' && error.message.includes('fetch')

    return {
      hasError: true,
      error,
      isNetworkError,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error })

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('AsyncErrorBoundary caught an error:', error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      isNetworkError: false,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const isNetworkError = this.state.isNetworkError

      return (
        <div className="min-h-[200px] flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {isNetworkError ? (
                <WifiOff className="w-6 h-6 text-red-600" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-600" />
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isNetworkError ? 'Connection Error' : 'Something went wrong'}
            </h3>
            
            <p className="text-gray-600 mb-4">
              {isNetworkError 
                ? 'Please check your internet connection and try again.'
                : 'We encountered an unexpected error. Please try again.'
              }
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-4 p-3 bg-red-50 rounded-lg text-left max-w-md mx-auto">
                <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-auto max-h-24">
                  {this.state.error.message}
                </pre>
              </div>
            )}

            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-[#F14C35] text-white rounded-lg hover:bg-[#E03A28] transition-colors text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default AsyncErrorBoundary
