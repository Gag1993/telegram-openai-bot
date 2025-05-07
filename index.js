const { Telegraf } = require("telegraf");
const axios = require("axios");
require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply("Привет! Нажми кнопку ниже, чтобы создать заявку.", {
    reply_markup: {
      keyboard: [[{ text: "📝 Создать заявку", request_contact: false }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
});

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

bot.launch();
console.log("Бот запущен");
