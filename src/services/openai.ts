import axios from 'axios';
import config from '../config/config';

export const OpenAIService = {
  async chatCompletion(messages: Array<{ role: string; content: string }>) {
    try {
      const res = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: config.openai.model,
        messages,
        max_tokens: config.openai.maxTokens,
      }, {
        headers: {
          Authorization: `Bearer ${config.openai.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: config.api.timeout,
      });

      return { success: true, data: res.data };
    } catch (error) {
      console.error('OpenAI chat completion error:', error);
      return { success: false, error: (error as Error).message };
    }
  },
};

export default OpenAIService;