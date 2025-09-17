import OpenAI from "openai";

export interface BotPersonality {
  name: string;
  prompt: string;
}

export interface FeedCardInput {
  placeName: string;
  description?: string;
  bot: BotPersonality;
}

export interface FeedCard {
  title: string;
  body: string;
  botName: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function composeFeedCard(input: FeedCardInput): Promise<FeedCard> {
  const systemPrompt = `${input.bot.prompt}\nYou are ${input.bot.name}, a food scout. Write a short, fun card for: ${input.placeName}.`;
  const userPrompt = input.description ? `Details: ${input.description}` : "";

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 120,
    temperature: 0.8,
  });

  const body = completion.choices[0]?.message?.content || "";
  return {
    title: input.placeName,
    body,
    botName: input.bot.name,
  };
}

// Example usage:
// const card = await composeFeedCard({
//   placeName: 'Sushi Zen',
//   bot: { name: 'TakoBuddy', prompt: 'You love sushi and puns.' }
// });
