import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                return res.status(400).json({ error: 'Невалидный JSON в теле запроса' });
            }
        }

        const { prompt } = body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'API-ключ отсутствует в настройках Vercel' });
        }

        const ai = new GoogleGenerativeAI(apiKey);

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

        const model = ai.getGenerativeModel({ 
            model: 'gemini-2.5-flash',
            systemInstruction: systemInstruction,
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const result = await model.generateContent(prompt);
        let responseText = result.response.text().trim();

        // Простая и безопасная очистка строк БЕЗ регулярных выражений
        if (responseText.startsWith("```")) {
            responseText = responseText.replace("```json", "");
            responseText = responseText.replace("```", "");
            responseText = responseText.trim();
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
