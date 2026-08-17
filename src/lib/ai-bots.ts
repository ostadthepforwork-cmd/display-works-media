export type AiBotDefinition = {
  name: string;
  pattern: RegExp;
  robotsUserAgent?: string;
};

export const AI_BOT_DEFINITIONS: AiBotDefinition[] = [
  { name: "ChatGPT-User", pattern: /ChatGPT-User/i },
  { name: "OAI-SearchBot", pattern: /OAI-SearchBot/i },
  { name: "OAI-AdsBot", pattern: /OAI-AdsBot/i },
  { name: "GPTBot", pattern: /GPTBot/i },
  { name: "Claude-SearchBot", pattern: /Claude-SearchBot/i },
  { name: "Claude-User", pattern: /Claude-User/i },
  { name: "Claude-Web", pattern: /Claude-Web/i },
  { name: "ClaudeBot", pattern: /ClaudeBot/i },
  { name: "anthropic-ai", pattern: /anthropic-ai/i },
  { name: "Perplexity-User", pattern: /Perplexity-User/i },
  { name: "PerplexityBot", pattern: /PerplexityBot/i },
  { name: "Googlebot-Image", pattern: /Googlebot-Image/i },
  { name: "Googlebot-Video", pattern: /Googlebot-Video/i },
  { name: "GoogleOther-Image", pattern: /GoogleOther-Image/i },
  { name: "GoogleOther-Video", pattern: /GoogleOther-Video/i },
  { name: "Google-InspectionTool", pattern: /Google-InspectionTool/i },
  { name: "Google-CloudVertexBot", pattern: /Google-CloudVertexBot/i },
  { name: "Google-Extended", pattern: /Google-Extended/i },
  { name: "AdsBot-Google", pattern: /AdsBot-Google/i },
  { name: "GoogleOther", pattern: /GoogleOther/i },
  { name: "Googlebot", pattern: /Googlebot/i },
  { name: "BingPreview", pattern: /BingPreview/i },
  { name: "Bingbot", pattern: /bingbot/i },
  { name: "MicrosoftPreview", pattern: /MicrosoftPreview/i },
  { name: "msnbot", pattern: /msnbot/i },
  { name: "Meta-ExternalFetcher", pattern: /Meta-ExternalFetcher|meta-externalfetcher/i },
  { name: "Meta-ExternalAgent", pattern: /Meta-ExternalAgent|meta-externalagent/i },
  { name: "FacebookBot", pattern: /FacebookBot/i },
  { name: "facebookexternalhit", pattern: /facebookexternalhit/i },
  { name: "Applebot-Extended", pattern: /Applebot-Extended/i },
  { name: "Applebot", pattern: /Applebot/i },
  { name: "DuckAssistBot", pattern: /DuckAssistBot/i },
  { name: "DuckDuckBot", pattern: /DuckDuckBot/i },
  { name: "Bytespider", pattern: /Bytespider/i },
  { name: "MistralAI-User", pattern: /MistralAI-User/i },
  { name: "Cohere-AI", pattern: /cohere-ai/i },
  { name: "Amazonbot", pattern: /Amazonbot/i },
  { name: "Bravebot", pattern: /Bravebot/i },
  { name: "AI2Bot", pattern: /AI2Bot/i },
  { name: "CCBot", pattern: /CCBot/i },
  { name: "YouBot", pattern: /YouBot/i },
  { name: "GPTBot-Generic", pattern: /OpenAI/i, robotsUserAgent: "GPTBot" },
];

export function detectAiBot(userAgent: string) {
  if (!userAgent) return "";
  return AI_BOT_DEFINITIONS.find((bot) => bot.pattern.test(userAgent))?.name || "";
}

export function aiRobotsUserAgents() {
  return Array.from(
    new Set(AI_BOT_DEFINITIONS.map((bot) => bot.robotsUserAgent || bot.name)),
  ).filter(Boolean);
}
