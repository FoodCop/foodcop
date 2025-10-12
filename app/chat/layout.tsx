import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Chat | FUZO",
  description: "Real-time messaging and communication"
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}