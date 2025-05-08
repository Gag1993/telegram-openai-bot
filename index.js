const express = require("express");
const { Telegraf } = require("telegraf");
const axios = require("axios");
require("dotenv").config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const app = express();

app.use(express.json());
app.use(bot.webhookCallback("/bot"));
bot.telegram.setWebhook(`${process.env.RENDER_EXTERNAL_URL}/bot`);

// ✅ Обработка команды /start и /startapp
bot.start((ctx) => {
  const isPrivate = ctx.chat.type === "private";
  const text = ctx.message?.text;

  // Если это команда /startapp в группе
  if (!isPrivate && text === "/startapp") {
    return ctx.reply("Нажмите кнопку, чтобы открыть форму:", {
      reply_markup: {
        inline_keyboard: [[
          {
            text: "📝 Открыть форму",
            web_app: { url: process.env.WEB_APP_URL }
          }
        ]]
      }
    });
  }

  // Если бот используется в группе не по назначению
  if (!isPrivate) {
    return ctx.reply("Пожалуйста, используйте бота в личном чате.");
  }

  // Старт в личном чате
  ctx.reply("Привет! Нажми кнопку ниже, чтобы создать заявку:", {
    reply_markup: {
      inline_keyboard: [[
        {
          text: "📝 Создать заявку",
          web_app: { url: process.env.WEB_APP_URL }
        }
      ]]
    }
  });
});

// ✅ Обработка данных из WebApp
bot.on("web_app_data", async (ctx) => {
  const userMessage = ctx.webAppData?.data;
  if (!userMessage || userMessage.trim() === "") return ctx.reply("Пустое сообщение.");
  if (userMessage.length > 1000) return ctx.reply("Слишком длинное сообщение.");

  try {
    const response = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4o",
      messages: [{ role: "user", content: userMessage }],
    }, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const reply = response.data.choices[0].message.content;
    await ctx.reply(`Ответ от OpenAI:\n\n${reply}`);
  } catch (err) {
    console.error("Ошибка OpenAI:", err?.response?.data || err);
    ctx.reply("Ошибка при обращении к OpenAI.");
  }
});

// ✅ Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook сервер слушает порт ${PORT}`);
});
