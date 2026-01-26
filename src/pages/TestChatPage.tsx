import { useState, useEffect } from 'react';
import { Play, Trash2, Download, Loader2, CheckCircle, XCircle, Clock, Users, RefreshCw, AlertCircle } from 'lucide-react';
import { ChatTestService, TestResult, RealtimeEvent, TestUser } from '../services/chatTestService';
import { formatDuration, formatTimestamp } from '../utils/chatTestUtils';

const testService = new ChatTestService();

export default function TestChatPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [eventLog, setEventLog] = useState<RealtimeEvent[]>([]);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<TestUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [authStatus, setAuthStatus] = useState<{ authenticated: boolean; userId?: string; error?: string } | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Load available users
  const loadUsers = async () => {
    setLoadingUsers(true);
    setUsersError(null);
    try {
      const users = await testService.getAllUsers();
      setAvailableUsers(users);
    } catch (error) {
      setUsersError(error instanceof Error ? error.message : 'Failed to load users');
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Check authentication status
  const checkAuth = async () => {
    const status = await testService.checkAuthentication();
    setAuthStatus(status);
    return status.authenticated;
  };

  // Initialize: check auth and load users
  useEffect(() => {
    checkAuth();
    loadUsers();
  }, []);

  // Run all automated tests
  const runAllTests = async () => {
    if (!authStatus?.authenticated) {
      const authenticated = await checkAuth();
      if (!authenticated) {
        alert('Please sign in to run tests');
        return;
      }
    }

    setIsRunning(true);
    setTestResults([]);
    testService.clear();

    const userIds = selectedUserIds.length >= 2 ? selectedUserIds : undefined;

    const tests = [
      { name: 'Basic Send/Receive', fn: () => testService.runBasicSendReceiveTest(userIds) },
      { name: 'Bidirectional Chat', fn: () => testService.runBidirectionalChatTest(5, userIds) },
      { name: 'Stress Test', fn: () => testService.runStressTest(20, userIds) },
      { name: 'Shared Item Test', fn: () => testService.runSharedItemTest(userIds) },
    ];

    for (const test of tests) {
      setCurrentTest(test.name);
      try {
        const result = await test.fn();
        setTestResults(prev => [...prev, result]);
        setEventLog(testService.getEventLog());
      } catch (error) {
        const errorResult: TestResult = {
          scenario: test.name.toLowerCase().replace(/\s+/g, '_') as TestResult['scenario'],
          status: 'fail',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        setTestResults(prev => [...prev, errorResult]);
      }

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setCurrentTest(null);
    setIsRunning(false);
  };

  // Run individual test
  const runIndividualTest = async (testType: 'basic' | 'bidirectional' | 'stress' | 'shared') => {
    if (!authStatus?.authenticated) {
      const authenticated = await checkAuth();
      if (!authenticated) {
        alert('Please sign in to run tests');
        return;
      }
    }

    setIsRunning(true);
    testService.clear();
    setTestResults([]);

    const userIds = selectedUserIds.length >= 2 ? selectedUserIds : undefined;

    let result: TestResult;
    try {
      switch (testType) {
        case 'basic':
          setCurrentTest('Basic Send/Receive');
          result = await testService.runBasicSendReceiveTest(userIds);
          break;
        case 'bidirectional':
          setCurrentTest('Bidirectional Chat');
          result = await testService.runBidirectionalChatTest(5, userIds);
          break;
      case 'stress':
        setCurrentTest('Stress Test');
        result = await testService.runStressTest(20, userIds);
        break;
      case 'shared':
        setCurrentTest('Shared Item Test');
        result = await testService.runSharedItemTest(userIds);
        break;
    }
      setTestResults([result]);
      setEventLog(testService.getEventLog());
    } catch (error) {
      const errorResult: TestResult = {
        scenario: testType === 'basic' ? 'basic_send_receive' : testType === 'bidirectional' ? 'bidirectional_chat' : 'stress_test',
        status: 'fail',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      setTestResults([errorResult]);
    } finally {
      setCurrentTest(null);
      setIsRunning(false);
    }
  };

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else if (prev.length < 2) {
        return [...prev, userId];
      } else {
        // Replace first selected user
        return [prev[1], userId];
      }
    });
  };

  // Clear results
  const clearResults = () => {
    setTestResults([]);
    setEventLog([]);
    testService.clear();
  };

  // Export results as JSON
  const exportResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      results: testResults,
      eventLog: eventLog,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-test-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get status icon
  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  // Get scenario display name
  const getScenarioName = (scenario: TestResult['scenario']): string => {
    const names: Record<TestResult['scenario'], string> = {
      basic_send_receive: 'Basic Send/Receive',
      bidirectional_chat: 'Bidirectional Chat',
      realtime_latency: 'Realtime Latency',
      message_ordering: 'Message Ordering',
      multiple_conversations: 'Multiple Conversations',
      stress_test: 'Stress Test',
      shared_item_test: 'Shared Item Test',
    };
    return names[scenario];
  };

  return (
    <div className="min-h-screen bg-page-utility p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Chat Realtime Test Suite
          </h1>
          <p className="text-gray-600">
            Automated testing for Supabase realtime chat functionality
          </p>
          
          {/* Auth Status */}
          {authStatus && (
            <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
              authStatus.authenticated 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {authStatus.authenticated ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Authenticated as: {authStatus.userId?.substring(0, 8)}...</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5" />
                  <span>{authStatus.error || 'Not authenticated'}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Available Users */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Available Users ({availableUsers.length})
            </h2>
            <button
              onClick={loadUsers}
              disabled={loadingUsers}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {usersError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              <strong>Error loading users:</strong> {usersError}
            </div>
          )}

          {loadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Loading users...</span>
            </div>
          ) : availableUsers.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-3">
                Select 2 users to test with (or leave empty for random selection):
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {availableUsers.map(user => {
                  const isSelected = selectedUserIds.includes(user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => toggleUserSelection(user.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          isSelected ? 'bg-orange-500' : 'bg-gray-300'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {user.display_name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedUserIds.length > 0 && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                  <strong>Selected:</strong> {selectedUserIds.length} user(s) - Tests will use these users
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No users found. Click Refresh to reload.
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRunning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Run All Tests
            </button>

            <button
              onClick={() => runIndividualTest('basic')}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Basic Test
            </button>

            <button
              onClick={() => runIndividualTest('bidirectional')}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Bidirectional Test
            </button>

            <button
              onClick={() => runIndividualTest('stress')}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Stress Test
            </button>

            <button
              onClick={() => runIndividualTest('shared')}
              disabled={isRunning}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Shared Item Test
            </button>

            <button
              onClick={clearResults}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-auto"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>

            <button
              onClick={exportResults}
              disabled={testResults.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          {currentTest && (
            <div className="mt-4 flex items-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Running: {currentTest}...</span>
            </div>
          )}
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Test Results</h2>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${result.status === 'pass'
                      ? 'border-green-200 bg-green-50'
                      : result.status === 'fail'
                        ? 'border-red-200 bg-red-50'
                        : 'border-blue-200 bg-blue-50'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {getScenarioName(result.scenario)}
                        </h3>
                        {result.duration && (
                          <p className="text-sm text-gray-600">
                            Duration: {formatDuration(result.duration)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {result.status.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {result.metrics && (
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {result.metrics.messagesSent !== undefined && (
                        <div className="bg-white rounded p-2">
                          <div className="text-xs text-gray-500">Sent</div>
                          <div className="text-lg font-semibold">
                            {result.metrics.messagesSent}
                          </div>
                        </div>
                      )}
                      {result.metrics.messagesReceived !== undefined && (
                        <div className="bg-white rounded p-2">
                          <div className="text-xs text-gray-500">Received</div>
                          <div className="text-lg font-semibold">
                            {result.metrics.messagesReceived}
                          </div>
                        </div>
                      )}
                      {result.metrics.averageLatency !== undefined && (
                        <div className="bg-white rounded p-2">
                          <div className="text-xs text-gray-500">Avg Latency</div>
                          <div className="text-lg font-semibold">
                            {Math.round(result.metrics.averageLatency)}ms
                          </div>
                        </div>
                      )}
                      {result.metrics.maxLatency !== undefined && (
                        <div className="bg-white rounded p-2">
                          <div className="text-xs text-gray-500">Max Latency</div>
                          <div className="text-lg font-semibold">
                            {Math.round(result.metrics.maxLatency)}ms
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {result.error && (
                    <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded text-sm text-red-800">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}

                  {result.details && (
                    <div className="mt-3 text-sm text-gray-600">
                      {Object.entries(result.details).map(([key, value]) => (
                        <div key={key}>
                          <strong>{key}:</strong> {String(value)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Event Log */}
        {eventLog.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Realtime Event Log
            </h2>
            <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm">
              {eventLog.map((event, index) => (
                <div
                  key={index}
                  className={`mb-1 ${event.event === 'message_sent'
                      ? 'text-blue-400'
                      : event.event === 'message_received'
                        ? 'text-green-400'
                        : event.event === 'subscription_started'
                          ? 'text-yellow-400'
                          : 'text-gray-400'
                    }`}
                >
                  <span className="text-gray-500">
                    [{formatTimestamp(event.timestamp)}]
                  </span>{' '}
                  <span className="text-purple-400">{event.userName}</span>{' '}
                  <span>
                    {event.event === 'message_sent' && '📤 sent message'}
                    {event.event === 'message_received' && '📥 received message'}
                    {event.event === 'subscription_started' && '🔌 subscribed'}
                    {event.event === 'subscription_ended' && '🔌 unsubscribed'}
                  </span>
                  {event.sharedItemType && (
                    <span className="text-cyan-400">
                      {' '}📎 {event.sharedItemType}: "{event.sharedItemTitle}"
                    </span>
                  )}
                  {event.content && !event.sharedItemType && (
                    <span className="text-gray-300"> "{event.content}"</span>
                  )}
                  {event.content && event.sharedItemType && (
                    <span className="text-gray-300"> - {event.content}</span>
                  )}
                  {event.latency !== undefined && (
                    <span className="text-orange-400"> ({event.latency}ms)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {testResults.length === 0 && !isRunning && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">How to use:</h3>
            <ul className="list-disc list-inside text-blue-800 space-y-1">
              <li>Click "Run All Tests" to execute all automated test scenarios</li>
              <li>Or run individual tests using the specific test buttons</li>
              <li>Tests will simulate multiple users sending messages via Supabase realtime</li>
              <li>View detailed results, metrics, and realtime event logs below</li>
              <li>Export results as JSON for record keeping</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
