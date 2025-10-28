import { AIChatWidget } from './components/AIChatWidget';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Your main application content goes here */}
      <div className="container mx-auto p-8">
      </div>

      {/* TakoAI Chat Widget - This component floats over the content */}
      <AIChatWidget />
    </div>
  );
}