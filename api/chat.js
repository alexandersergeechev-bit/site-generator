import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
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

        // Инициализируем клиент
        const ai = new GoogleGenerativeAI(apiKey);
        const model = ai.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        html: {
                            type: "STRING",
                            description: "HTML-код (только содержимое body или полная структура без внешних файлов)"
                        },
                        css: {
                            type: "STRING",
                            description: "CSS-код"
                        },
                        js: {
                            type: "STRING",
                            description: "JavaScript-код"
                        }
                    }
                }
            }
        });

        const systemInstruction = `
        Ты — эксперт по веб-разработке. Твоя задача — сгенерировать работающий сайт (HTML, CSS, JavaScript) по запросу пользователя.
        Ты должен вернуть ответ СТРОГО в формате JSON со следующей структурой:
        {
          "html": "код html здесь (только то, что внутри body, или готовая структура без подключения внешних файлов)",
          "css": "код css здесь",
          "js": "код javascript здесь"
        }
        Все поля (html, css, js) должны быть заполнены. Не оставляй поля пустыми.
        Не пиши никаких пояснений, Markdown-разметки (типа \`\`\`json) вне JSON. Только чистый валидный JSON объект.
        `;

        const result = await model.generateContent([systemInstruction, prompt]);
        const responseText = result.response.text();

        // Безопасный парсинг JSON с обработкой ошибок
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
