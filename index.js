const { Telegraf } = require("telegraf");
const axios = require("axios");
require("dotenv").config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Кнопка с Web App (работает только в личке!)
bot.start((ctx) => {
  // Проверяем, что это личный чат (иначе Web App не сработает)
  if (ctx.chat.type !== "private") {
    return ctx.reply("Пожалуйста, используйте бота в личном чате.");
  }

  ctx.reply("Привет! Нажми кнопку ниже, чтобы создать заявку.", {
    reply_markup: {
      keyboard: [
        [
          {
            text: "📝 Создать заявку",
            web_app: {
              url: "https://telegram-webapp-j8de.onrender.com" // ← твоя Web App форма
            }
          }
        ]
      ],
      resize_keyboard: true
    }
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
    await ctx.reply(`Ответ от OpenAI:\n\n${reply}`);
  } catch (err) {
    console.error(err);
    ctx.reply("Произошла ошибка при обращении к OpenAI.");
  }
});

// Запуск бота
bot.launch();
console.log("Бот запущен");

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error("Произошла ошибка при обработке обновления:", err);
  if (ctx?.reply) {
    ctx.reply("Произошла непредвиденная ошибка. Попробуйте ещё раз.");
  }
});

