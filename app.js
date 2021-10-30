require('dotenv').config()
const { Telegraf, session, Scenes: { BaseScene, Stage } } = require('telegraf');
const { startInlineKeyboard, dayInlineKeyboard, prepInlineKeyboard, backInlineKeyboard } = require('./markups');
const { searchSchedule, updateLog } = require('./utils');

//---------------------------

const startScene = new BaseScene('START_SCENE');

startScene.on('my_chat_member', ctx => {
    console.log('my_chat_member из сцены');
    return;
});

startScene.enter(async (ctx) => {
    ctx.session.myData = {};
    ctx.session.myData.prevMessage = undefined;
    ctx.session.myData.day = 0;
    await ctx.replyWithHTML('<b>' + ctx.chat.first_name + ', Вы учитесь или преподаете?</b>', startInlineKeyboard)
        .then((res) => { ctx.session.myData.prevMessage = res.message_id });
    ctx.deleteMessage().catch((err) => console.log(err));
});

startScene.action('OBUCH', async (ctx) => {
    await ctx.replyWithHTML(`<b>Отправьте мне текст с названием группы.</b>\nТак, как оно указано в расписании на сайте.\n\nОбразец: <i>НБС-111</i> или <i>нбс-111</i>`, backInlineKeyboard)
        .then((res) => { ctx.session.myData.prevMessage = res.message_id });
    ctx.deleteMessage().catch((err) => console.log(err));
    ctx.session.myData.obuchPrep = 'OBUCH';
    ctx.scene.enter('SEARCH_SCENE');
});

startScene.action('PREP', async (ctx) => {
    if (ctx.chat.last_name && ctx.chat.first_name) {
        await ctx.replyWithHTML(`<b>Вы можете начать поиск по указанной в профиле Telegram фамилии, нажав на кнопку ниже.</b>\n\nИли отправьте мне текст с Фамилией И.О. преподавателя. Можно отправить часть фамилии, если она уникальная.\n\nОбразец: <i>Иванов И.И.</i> или <i>ивано</i>`, prepInlineKeyboard(ctx))
            .then((res) => { ctx.session.myData.prevMessage = res.message_id });
    }
    else {
        await ctx.replyWithHTML(`<b>Отправьте мне текст с Фамилией И.О. преподавателя.</b> Можно отправить часть фамилии, если она уникальная.\n\nОбразец: <i>Иванов И.И.</i> или <i>ивано</i>\n\n⚠️ Если Вы укажете в профиле Telegram свою фамилию, то поиск станет намного проще!`, backInlineKeyboard)
            .then((res) => { ctx.session.myData.prevMessage = res.message_id });
    }
    ctx.deleteMessage().catch((err) => console.log(err));
    ctx.session.myData.obuchPrep = 'PREP';
    ctx.scene.enter('SEARCH_SCENE');
});

startScene.hears('/start', async (ctx) => {
    console.log('scene: ' + ctx.chat.id + ': ' + ctx.chat.first_name);
    updateLog(ctx.chat.id, ctx.chat.first_name, ctx.chat.last_name);
    if (ctx.session.myData.prevMessage) await ctx.deleteMessage(ctx.session.myData.prevMessage).catch((err) => console.log(err));
    return ctx.scene.enter('START_SCENE');
});

startScene.use((ctx) => {
    ctx.deleteMessage().catch((err) => console.log(err));
});

//---------------------------

const searchScene = new BaseScene('SEARCH_SCENE');

searchScene.hears('/start', async (ctx) => {
    console.log('scene: ' + ctx.chat.id + ': ' + ctx.chat.first_name);
    updateLog(ctx.chat.id, ctx.chat.first_name, ctx.chat.last_name);
    if (ctx.session.myData.prevMessage) await ctx.deleteMessage(ctx.session.myData.prevMessage).catch((err) => console.log(err));
    return ctx.scene.enter('START_SCENE');
});

searchScene.on('text', async (ctx) => {
    if (ctx.session.myData.prevMessage) await ctx.deleteMessage(ctx.session.myData.prevMessage).catch((err) => console.log(err));
    ctx.session.myData.obuchPrepText = ctx.message.text;
    const searchResultText = await searchSchedule(ctx.session.myData.obuchPrep, ctx.session.myData.obuchPrepText, ctx.session.myData.day);
    await ctx.replyWithHTML(searchResultText, dayInlineKeyboard)
        .then((res) => { ctx.session.myData.prevMessage = res.message_id });
    ctx.deleteMessage().catch((err) => console.log(err));
});

searchScene.action('LASTNAME', async (ctx) => {
    let searchResultText = '<b>Фамилия не указана в профиле Telegram.</b>\n\nОтправьте мне Фамилию И.О. преподавателя. Можно отправить часть фамилии, если она уникальная.\n\nОбразец: <i>Иванов И.И.</i> или <i>ивано</i>';
    ctx.session.myData.obuchPrepText = '*';
    if (ctx.chat.last_name && ctx.chat.first_name) {
        ctx.session.myData.obuchPrepText = ctx.chat.last_name + ' ' + ctx.chat.first_name[0] + '.';
        searchResultText = await searchSchedule(ctx.session.myData.obuchPrep, ctx.session.myData.obuchPrepText, ctx.session.myData.day);
    }
    await ctx.replyWithHTML(searchResultText, dayInlineKeyboard)
        .then((res) => { ctx.session.myData.prevMessage = res.message_id });
    ctx.deleteMessage().catch((err) => console.log(err));
});

searchScene.action('BACK', ctx => {
    return ctx.scene.enter('START_SCENE');
});

searchScene.on('callback_query', async (ctx) => {
    ctx.session.myData.day = ctx.callbackQuery.data || 0;
    const searchResultText = await searchSchedule(ctx.session.myData.obuchPrep, ctx.session.myData.obuchPrepText, ctx.session.myData.day);
    await ctx.replyWithHTML(searchResultText, dayInlineKeyboard)
        .then((res) => { ctx.session.myData.prevMessage = res.message_id });
    ctx.deleteMessage().catch((err) => console.log(err));
});

//---------------------------
const stage = new Stage([startScene, searchScene]);

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(session(), stage.middleware());

bot.on('my_chat_member', ctx => {
    console.log('my_chat_member из бота');
    return;
});

bot.command('/start', (ctx) => {
    console.log('bot: ' + ctx.chat.id + ': ' + ctx.chat.first_name);
    updateLog(ctx.chat.id, ctx.chat.first_name, ctx.chat.last_name);
    ctx.scene.enter('START_SCENE');
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));