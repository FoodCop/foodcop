import { scheduleFeedCards } from "./scheduler";
import { sbService } from "../lib/supabase";

// This function should be called by a serverless cron job or backend scheduler
export async function runBotPostingRitual(apiKey: string) {
  // Schedule cards for today
  const scheduledCards = await scheduleFeedCards(apiKey);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter cards scheduled for today
  const todaysCards = scheduledCards.filter(
    (card) => {
      const cardDate = new Date(card.scheduledFor);
      cardDate.setHours(0, 0, 0, 0);
      return cardDate.getTime() === today.getTime();
    }
  );

  // Post each card to the feed (Supabase 'feed' table)
  const supabase = sbService();
  for (const cardObj of todaysCards) {
    await supabase.from("feed").upsert({
      id: cardObj.id,
      title: cardObj.card.title,
      body: cardObj.card.body,
      bot_name: cardObj.card.botName,
      posted_at: today.toISOString(),
      is_masterbot: true,
    });
  }
  console.log(`Posted ${todaysCards.length} bot cards to feed for ${today.toDateString()}`);
}

// Example usage (in serverless cron or backend):
// runBotPostingRitual(process.env.SPOONACULAR_KEY!);
