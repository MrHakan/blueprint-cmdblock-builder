/**
 * Общие JavaScript функции для всех страниц GalLab
 * Содержит утилиты для работы с localStorage, логирования и других общих задач
 */

// Константы для патронов
const PATREONS = {
    datapacks: ['Mr. Papaveraceae'],
    command_blocks: ['Mr. Papaveraceae'],
    item_components: ['Mr. Papaveraceae']
};

/**
 * Получить форматированный список патронов
 * @param {string} type - тип страницы (datapacks, command_blocks, item_components)
 * @returns {string} - форматированная строка с патронами
 */
function getPatreonsFormat(type = 'datapacks') {
    const patreons = PATREONS[type] || PATREONS.datapacks;
    return `${patreons.slice(0, -1).join(', ')} and ${patreons[patreons.length - 1]}`;
}

/**
 * Обновить элемент с благодарностью патронам
 * @param {string} type - тип страницы
 */
function updatePatreonsElement(type = 'datapacks') {
    const patreonElement = document.getElementById('patreon');
    if (patreonElement) {
        const patreonsFormat = getPatreonsFormat(type);
        patreonElement.innerHTML = `Thank you ${patreonsFormat} for your support on<a href="https://www.patreon.com/GalSergey" target="_blank">Patreon</a>`;
    }
    // Логирование в консоль
    const patreonsFormat = getPatreonsFormat(type);
    console.log(`Thank you to ${patreonsFormat} for the support on https://patreon.com/GalSergey`);
}

/**
 * Универсальная функция для работы с localStorage
 * @param {string} key - ключ для хранения
 * @param {*} value - значение для сохранения (если не указано, то возвращает значение)
 * @param {string} storageKey - ключ в localStorage (по умолчанию 'galLab')
 * @returns {*} - сохраненное или полученное значение
 */
function storage(key, value = undefined, storageKey = 'galLab') {
    if (value === undefined) {
        // Получение значения
        let localData = JSON.parse(localStorage.getItem(storageKey)) || {};
        return localData[key] || null;
    } else {
        // Сохранение значения
        let localData = JSON.parse(localStorage.getItem(storageKey)) || {};
        localData[key] = value;
        localStorage.setItem(storageKey, JSON.stringify(localData));
        return value;
    }
}

/**
 * Установить значение в localStorage
 * @param {string} key - ключ
 * @param {*} value - значение
 * @param {string} storageKey - ключ хранилища
 */
function setStorage(key, value, storageKey = 'galLab') {
    storage(key, value, storageKey);
}

/**
 * Получить значение из localStorage
 * @param {string} key - ключ
 * @param {string} storageKey - ключ хранилища
 * @returns {*} - значение или null
 */
function getStorage(key, storageKey = 'galLab') {
    return storage(key, undefined, storageKey);
}

/**
 * Очистить все данные из localStorage
 * @param {string} storageKey - ключ хранилища
 */
function clearStorage(storageKey = 'galLab') {
    localStorage.setItem(storageKey, '{}');
}

/**
 * Логирование с временной меткой
 * @param {...any} msg - сообщения для логирования
 */
function log(...msg) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}]`, ...msg);
}

/**
 * Показать уведомление пользователю
 * @param {string} message - сообщение
 * @param {string} type - тип уведомления (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Стили для уведомления
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '5px',
        color: '#fff',
        fontWeight: 'bold',
        zIndex: '10000',
        maxWidth: '300px',
        wordWrap: 'break-word',
        opacity: '0',
        transform: 'translateX(100%)',
        transition: 'all 0.3s ease'
    });

    // Цвета для разных типов
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196F3'
    };
    notification.style.backgroundColor = colors[type] || colors.info;

    // Добавляем в DOM
    document.body.appendChild(notification);

    // Анимация появления
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Автоматическое удаление через 5 секунд
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

/**
 * Проверить, является ли строка валидным URL
 * @param {string} string - строка для проверки
 * @returns {boolean} - true если это валидный URL
 */
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

/**
 * Проверить, является ли строка валидным ID примера
 * @param {string} string - строка для проверки
 * @returns {boolean} - true если это валидный ID
 */
function isValidExampleId(string) {
    return /^(https?:\/\/[^\s]+|[A-Za-z0-9]{10})$/.test(string);
}

/**
 * Извлечь ID примера из строки
 * @param {string} string - строка с ID или URL
 * @returns {string} - извлеченный ID
 */
function extractExampleId(string) {
    return string.replace(/[^a-zA-Z0-9]/g, '').slice(-10);
}

/**
 * Форматировать текст для отображения в консоли
 * @param {string} text - текст для форматирования
 * @returns {string} - отформатированный текст
 */
function formatConsoleText(text) {
    return text.split('\n').join('\n    ');
}

/**
 * Создать элемент option для select
 * @param {string} value - значение
 * @param {string} text - текст
 * @param {boolean} disabled - отключен ли элемент
 * @returns {HTMLOptionElement} - созданный элемент
 */
function createOption(value, text, disabled = false) {
    const option = document.createElement('option');
    option.value = value;
    option.text = text;
    option.disabled = disabled;
    return option;
}

/**
 * Очистить select элемент
 * @param {HTMLSelectElement} selectElement - элемент select
 */
function clearSelect(selectElement) {
    selectElement.innerHTML = '';
}

/**
 * Заполнить select элементами option
 * @param {HTMLSelectElement} selectElement - элемент select
 * @param {Array} options - массив объектов {value, text, disabled}
 */
function populateSelect(selectElement, options) {
    clearSelect(selectElement);
    options.forEach(option => {
        selectElement.appendChild(createOption(option.value, option.text, option.disabled));
    });
}

/**
 * Получить параметры из URL
 * @returns {URLSearchParams} - параметры URL
 */
function getUrlParams() {
    return new URLSearchParams(window.location.search);
}

/**
 * Обновить URL с новыми параметрами
 * @param {Object} params - объект с параметрами
 */
function updateUrl(params) {
    const url = new URL(window.location);
    Object.keys(params).forEach(key => {
        if (params[key]) {
            url.searchParams.set(key, params[key]);
        } else {
            url.searchParams.delete(key);
        }
    });
    window.history.pushState({}, '', url);
}

/**
 * Дебаунс функция для ограничения частоты вызовов
 * @param {Function} func - функция для дебаунса
 * @param {number} wait - время ожидания в миллисекундах
 * @returns {Function} - дебаунсированная функция
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Тротлинг функция для ограничения частоты вызовов
 * @param {Function} func - функция для тротлинга
 * @param {number} limit - лимит времени в миллисекундах
 * @returns {Function} - тротлированная функция
 */
function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Копировать текст в буфер обмена
 * @param {string} text - текст для копирования
 * @returns {Promise<boolean>} - успешность операции
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showNotification('Text copied to clipboard!', 'success');
        return true;
    } catch (err) {
        console.error('Failed to copy text: ', err);
        showNotification('Failed to copy text', 'error');
        return false;
    }
}

/**
 * Проверить поддержку современных API браузером
 * @returns {Object} - объект с информацией о поддержке
 */
function checkBrowserSupport() {
    return {
        clipboard: 'clipboard' in navigator,
        localStorage: 'localStorage' in window,
        fetch: 'fetch' in window,
        promises: 'Promise' in window,
        asyncAwait: (async () => { }).constructor.name === 'AsyncFunction'
    };
}

/**
 * Инициализация Monaco Editor
 * Предотвращает дублирование загрузки модулей
 * @param {Function} callback - функция обратного вызова после загрузки
 */
function initializeMonacoEditor(callback) {
    // Проверяем, не загружен ли уже Monaco Editor
    if (window.monaco && window.monaco.editor) {
        callback();
        return;
    }

    // Проверяем, не инициализируется ли уже загрузка
    if (window.monacoInitializing) {
        // Добавляем callback в очередь
        if (!window.monacoCallbacks) {
            window.monacoCallbacks = [];
        }
        window.monacoCallbacks.push(callback);
        return;
    }

    window.monacoInitializing = true;
    window.monacoCallbacks = [callback];

    // Настраиваем пути только если еще не настроены
    if (!window.monacoPathsConfigured && typeof require !== 'undefined') {
        try {
            require.config({
                paths: {
                    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs'
                }
            });
            window.monacoPathsConfigured = true;
        } catch (error) {
            console.warn('Monaco Editor require.config failed:', error);
        }
    }

    require(['vs/editor/editor.main'], function () {
        window.monacoInitializing = false;
        // Вызываем все накопленные callbacks
        if (window.monacoCallbacks) {
            window.monacoCallbacks.forEach(cb => cb());
            window.monacoCallbacks = [];
        }
    });
}

/**
 * Создать Monaco Editor с общими настройками
 * @param {HTMLElement} container - контейнер для редактора
 * @param {Object} options - дополнительные опции
 * @returns {Object} - экземпляр редактора
 */
function createMonacoEditor(container, options = {}) {
    const defaultOptions = {
        language: 'gallang',
        lineNumbers: window.gallabLineNumbers || 'on',
        theme: 'gallang-dark',
        fontFamily: "'Courier New', monospace",
        fontSize: 16,
        wordWrap: 'on',
        color: '#fff',
        automaticLayout: true,
        minimap: { enabled: false }
    };

    const finalOptions = { ...defaultOptions, ...options };
    return monaco.editor.create(container, finalOptions);
}

// Экспорт функций для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getPatreonsFormat,
        updatePatreonsElement,
        storage,
        setStorage,
        getStorage,
        clearStorage,
        log,
        showNotification,
        isValidUrl,
        isValidExampleId,
        extractExampleId,
        formatConsoleText,
        createOption,
        clearSelect,
        populateSelect,
        getUrlParams,
        updateUrl,
        debounce,
        throttle,
        copyToClipboard,
        checkBrowserSupport,
        initializeMonacoEditor,
        createMonacoEditor
    };
}
