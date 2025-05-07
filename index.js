const { Telegraf } = require("telegraf");
const axios = require("axios");
require("dotenv").config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Старт с Web App-кнопкой
bot.start((ctx) => {
  ctx.reply("Привет! Нажми кнопку ниже, чтобы создать заявку.", {
    reply_markup: {
      keyboard: [
        [
          {
            text: "📝 Создать заявку",
            web_app: {
              url: "https://telegram-webapp-j8de.onrender.com" // твоя форма
            }
          }
        ]
      ],
      resize_keyboard: true
    }
  });
});

// Поддержка старого текстового способа (если кто-то нажал по-старому)
bot.hears("📝 Создать заявку", async (ctx) => {
  ctx.reply("Пожалуйста, опиши проблему:");
  bot.once("text", async (ctx2) => {
    const userMessage = ctx2.message.text;

    try {
      const response = await axios.post("https://api.openai.com/v1/chat/completions", {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: userMessage }],
      }, {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      const reply = response.data.choices[0].message.content;
      ctx2.reply(`Ответ от OpenAI: ${reply}`);

    } catch (err) {
      console.error(err);
      ctx2.reply("Произошла ошибка при обращении к OpenAI.");
    }
  });
});

// 🧩 Обработка данных из Web App
bot.on("web_app_data", async (ctx) => {
  const userMessage = ctx.webAppData.data;

  try {
    const response = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: userMessage }],
    }, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const reply = response.data.choices[0].message.content;
    await ctx.reply(`Ответ от OpenAI: ${reply}`);
  } catch (err) {
    console.error(err);
    ctx.reply("Произошла ошибка при обращении к OpenAI.");
  }
});

// Запуск бота
bot.launch();
console.log("Бот запущен");

// Ловим ошибки
bot.catch((err, ctx) => {
  console.error('Произошла ошибка при обработке обновления:', err);
  if (ctx && ctx.reply) {
    ctx.reply('Произошла непредвиденная ошибка. Попробуйте ещё раз.');
  }
});
