const { GoogleGenAI } = require("@google/generative-ai");

module.exports = async function handler(req, res) {
    // Разрешаем только POST-запросы
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { prompt } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'API-ключ отсутствует в настройках Vercel' });
        }

        const ai = new GoogleGenAI({ apiKey });
        // Используем самую быструю и точную модель для кода
        const model = ai.getGenerativeModel({ 
            model: 'gemini-1.5-flash',
            generationConfig: { responseMimeType: "application/json" } // Заставляем Gemini отвечать чистым JSON
        });

        // Системная инструкция, чтобы ИИ не писал лишнего текста, а давал только код
        const systemInstruction = `
        Ты — эксперт по веб-разработке. Твоя задача — сгенерировать работающий сайт (HTML, CSS, JavaScript) по запросу пользователя.
        Ты должен вернуть ответ СТРОГО в формате JSON со следующей структурой:
        {
          "html": "код html здесь (только то, что внутри body, или готовая структура без подключения внешних файлов)",
          "css": "код css здесь",
          "js": "код javascript здесь"
        }
        Не пиши никаких пояснений, Markdown-разметки (типа \`\`\`json) вне JSON. Только чистый валидный JSON объект.
        `;

        const result = await model.generateContent([systemInstruction, prompt]);
        const responseText = result.response.text();

        // Парсим ответ от ИИ и отправляем обратно на фронтенд
        const codeJson = JSON.parse(responseText);
        return res.status(200).json(codeJson);

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
