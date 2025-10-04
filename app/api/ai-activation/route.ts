import { NextRequest, NextResponse } from "next/server";
import { masterbotAI } from "@/lib/masterbot-ai";

export async function POST(request: NextRequest) {
  try {
    const { action, masterbotUsername, userUsername } = await request.json();

    switch (action) {
      case 'process_pending':
        const processedCount = await masterbotAI.processPendingInteractions();
        return NextResponse.json({
          success: true,
          message: `Processed ${processedCount} interactions`,
          processedCount
        });

      case 'trigger_test':
        if (!masterbotUsername || !userUsername) {
          return NextResponse.json(
            { error: 'masterbotUsername and userUsername required for test trigger' },
            { status: 400 }
          );
        }

        const testResult = await masterbotAI.triggerTestInteraction(masterbotUsername, userUsername);
                
        if (testResult) {
          return NextResponse.json({
            success: true,
            message: `Test interaction triggered between ${userUsername} and ${masterbotUsername}`
          });
        } else {
          return NextResponse.json(
            { error: 'Failed to trigger test interaction' },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "process_pending" or "trigger_test"' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('AI activation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
