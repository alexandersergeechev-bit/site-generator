import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { prompt } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'API-ключ отсутствует в настройках Vercel' });
        }

        const ai = new GoogleGenerativeAI(apiKey);
        // Чистый вызов без настроек конфигурации, которые не поддерживает старая библиотека
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Усиливаем инструкцию, чтобы ИИ выдал идеальный JSON без Markdown-кавычек
        const systemInstruction = `
        Ты — эксперт по веб-разработке. Твоя задача — сгенерировать работающий сайт (HTML, CSS, JavaScript) по запросу пользователя.
        Ты должен вернуть ответ СТРОГО в формате JSON со следующей структурой:
        {
          "html": "код html здесь (только то, что внутри body, или готовая структура без подключения внешних файлов)",
          "css": "код css здесь",
          "js": "код javascript здесь"
        }
        Важно: Не пиши никаких пояснений. Не оборачивай JSON в markdown разметку вроде \`\`\`json ... \`\`\`. Верни только чистый текст JSON объекта, готовый для парсинга.
        `;

        const result = await model.generateContent([systemInstruction, prompt]);
        let responseText = result.response.text().trim();

        // Небольшая подстраховка: если Gemini всё-таки засунет JSON в блоки ```json ```, мы их срежем
        if (responseText.startsWith("```")) {
            responseText = responseText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        }

        let codeJson;
        try {
            codeJson = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Невалидный JSON от Gemini:', responseText);
            return res.status(500).json({
                error: 'Ошибка генерации кода: ответ модели не является валидным JSON'
            });
        }

        return res.status(200).json(codeJson);

    } catch (error) {
        console.error('Ошибка в обработчике:', error);
        return res.status(500).json({ error: error.message });
    }
}
