const { Telegraf } = require("telegraf");
const axios = require("axios");
require("dotenv").config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Старт — кнопка Web App (только в личном чате)
bot.start((ctx) => {
  if (ctx.chat.type !== "private") {
    return ctx.reply("Пожалуйста, используйте бота в личном чате.");
  }

  ctx.reply("Привет! Нажми кнопку ниже, чтобы создать заявку.", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "📝 Создать заявку",
            web_app: {
              url: process.env.WEB_APP_URL, // ← ссылка через переменную
            },
          },
        ],
      ],
    },
  });
});

// Обработка данных из Web App
bot.on("web_app_data", async (ctx) => {
  const userMessage = ctx.webAppData?.data;

  if (!userMessage || userMessage.trim() === "") {
    return ctx.reply("Вы ничего не написали. Пожалуйста, попробуйте снова.");
  }

  if (userMessage.length > 1000) {
    return ctx.reply("Слишком длинное сообщение. Укоротите, пожалуйста.");
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o", // ← используем GPT-4o
        messages: [{ role: "user", content: userMessage }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const reply = response.data.choices[0].message.content;
    await ctx.reply(`Ответ от OpenAI:\n\n${reply}`);
  } catch (err) {
    console.error("Ошибка при запросе в OpenAI:", err?.response?.data || err);
    ctx.reply("Произошла ошибка при обращении к OpenAI.");
  }
});

// Запуск бота (через long polling)
bot.launch().then(() => {
  console.log("✅ Бот успешно запущен (long polling)");
}).catch((err) => {
  console.error("❌ Ошибка запуска:", err.description || err.message);
});

// Глобальный обработчик ошибок
bot.catch((err, ctx) => {
  console.error("Ошибка при обработке обновления:", err);
  if (ctx?.reply) {
    ctx.reply("Произошла непредвиденная ошибка. Попробуйте ещё раз.");
  }
});


