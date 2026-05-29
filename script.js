// Переменные для хранения сгенерированного кода
let generatedFiles = { html: '', css: '', js: '' };

const generateBtn = document.getElementById('generate-btn');
const promptInput = document.getElementById('prompt-input');
const loader = document.getElementById('loader');
const resultSection = document.getElementById('result-section');

// Нажатие на кнопку генерации
generateBtn.addEventListener('click', async () => {
    const promptText = promptInput.value.trim();
    if (!promptText) return alert('Пожалуйста, введите описание сайта!');

    // Показываем лоадер, прячем старый результат
    loader.classList.remove('hidden');
    resultSection.classList.add('hidden');
    generateBtn.disabled = true;

    try {
        // Отправляем запрос на относительный URL нашей Vercel-функции
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: promptText })
        });

        if (!response.ok) throw new Error('Ошибка сервера');

        const data = await response.json();
        
        // Сохраняем результат
        generatedFiles.html = data.html || '';
        generatedFiles.css = data.css || '/* CSS не сгенерирован */';
        generatedFiles.js = data.js || '// JS не сгенерирован';

        // Выводим код в блоки
        document.getElementById('html-code').textContent = generatedFiles.html;
        document.getElementById('css-code').textContent = generatedFiles.css;
        document.getElementById('js-code').textContent = generatedFiles.js;

        // Показываем блок результатов
        resultSection.classList.remove('hidden');

    } catch (error) {
        console.error(error);
        alert('Не удалось сгенерировать код. Проверьте логи в панели Vercel.');
    } finally {
        loader.classList.add('hidden');
        generateBtn.disabled = false;
    }
});

// Логика работы табов (Вкладок)
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        button.classList.add('active');
        const tabId = button.getAttribute('data-tab');
        document.getElementById(`tab-${tabId}`).classList.add('active');
    });
});

// Функция копирования кода в буфер обмена
window.copyCode = function(elementId) {
    const codeText = document.getElementById(elementId).textContent;
    navigator.clipboard.writeText(codeText).then(() => {
        alert('Код скопирован в буфер обмена!');
    }).catch(err => {
        alert('Не удалось скопировать: ', err);
    });
};

// Функция скачивания всех файлов в ZIP архиве
document.getElementById('download-all-btn').addEventListener('click', () => {
    const zip = new JSZip();

    // Добавляем файлы в архив
    zip.file("index.html", generatedFiles.html);
    zip.file("style.css", generatedFiles.css);
    zip.file("script.js", generatedFiles.js);

    // Генерируем архив и скачиваем его
    zip.generateAsync({ type: "blob" }).then(function (content) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "ai-generated-site.zip";
        link.click();
    });
});