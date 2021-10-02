const { Markup } = require("telegraf");

exports.startInlineKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('👦🏻   учусь  ‣', 'OBUCH')],
    [Markup.button.callback('🧔🏻‍♂️   преподаю  ‣', 'PREP')],
    [Markup.button.url('Открыть в браузере', 'https://omamvd.ru/schedule')],
]);

exports.dayInlineKeyboard = Markup.inlineKeyboard([
    [
        Markup.button.callback('Сегодня', 0),
        Markup.button.callback('Завтра', 1),
        Markup.button.callback('Послезавтра', 2),
    ],
    [Markup.button.callback('« Назад в главное меню', 'BACK')],
]);

exports.prepInlineKeyboard = function (ctx) {
    let name = 'По фамилии из профиля Telegram';
    if (ctx.chat.last_name && ctx.chat.first_name) {
        name = 'По фамилии: ' + ctx.chat.last_name + ' ' + ctx.chat.first_name[0] + '.';
    }
    return Markup.inlineKeyboard([
        [Markup.button.callback(`🔎 ${name}`, 'LASTNAME')],
        [Markup.button.callback('« Назад в главное меню', 'BACK')]
    ])
}

exports.backInlineKeyboard = Markup.inlineKeyboard([
    Markup.button.callback('« Назад в главное меню', 'BACK'),
]);