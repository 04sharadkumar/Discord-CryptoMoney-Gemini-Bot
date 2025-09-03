import { Client, GatewayIntentBits } from 'discord.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

// --- Gemini Client ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// --- Discord Client ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// --- Helper: Split long messages into chunks (Discord limit = 2000 chars) ---
function splitMessage(text, maxLength = 2000) {
  const parts = [];
  for (let i = 0; i < text.length; i += maxLength) {
    parts.push(text.slice(i, i + maxLength));
  }
  return parts;
}

client.on('clientReady', () => {
  console.log(`✅ Logged in as: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  let replyText = "Sorry, I can't reply right now.";

  try {
    console.log("⚡ Getting reply from Gemini...");
    const result = await geminiModel.generateContent(message.content);
    const response = await result.response;
    replyText = response.text();
    console.log("✅ Reply from Gemini.");
  } catch (error) {
    console.error("❌ Gemini API Error:", error.message);
  }

  // --- Send reply in chunks (max 2000 chars each) ---
  const replyChunks = splitMessage(replyText);
  for (const chunk of replyChunks) {
    await message.reply({ content: chunk });
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
