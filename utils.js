const { pool, poolLog } = require('./dbpool');

exports.updateLog = function (user_id, user_name, user_lastname = '') {
    let conn;
    const last_datetime = new Date().getTime();

    poolLog.getConnection().then(conn => {
        conn.query(
            { namedPlaceholders: true, sql: "INSERT INTO raspbot (user_id, user_name, user_lastname, last_datetime) VALUES (:id, :name, :lastname, :datetime) ON DUPLICATE KEY UPDATE user_name = :name, user_lastname = :lastname, last_datetime = :datetime" },
            { id: user_id, name: user_name, lastname: user_lastname, datetime: last_datetime }
        ).catch(err => console.log(err));
    }).catch(err => console.log(err));
}

exports.searchSchedule = async function searchSchedule(obuchPrep, obuchPrepText, dayShift = 0) {
    const dayTextArr = ['[ СЕГОДНЯ ]', '[ ЗАВТРА ]', '[ ПОСЛЕЗАВТРА ]'];
    const dayText = dayTextArr[dayShift];
    let sendMessageText;
    let selectedDate;
    let res;

    switch (obuchPrep) {
        case "OBUCH":
            try { res = await getGroup(obuchPrepText, dayShift); }
            catch(err) { return 'Не могу загрузить данные. Попробуйте позже.'; }
            if (res.data) {
                let resultText = "";
                if (res.data[0]) {
                    res.data.forEach((v, i) => {
                        resultText += "<b>" + v.Para + " пара:</b> " + v.Disc + "\nпреп. " + v.FIO_Prep + "\nауд. " + v.Auditor + "\n\n";
                    });
                    selectedDate = getSelectedDate(res.data[0].Date_Zan);
                    resultText = `<b>[ ${selectedDate} ]</b>\n\n` + resultText;
                }
                else resultText = "Нет занятий.";
                sendMessageText = `<b>Расписание на ${dayText}</b>\n\nВы ввели: [<i>${obuchPrepText}</i>]. По запросу найдена группа <b>[${res.groupName}]</b>. Если это не ваша группа, отправьте мне более точный запрос.\n_______\n\n${resultText}`;
            }
            else sendMessageText = `<b>Расписание на ${dayText}</b>\n\nВы ввели: [<i>${obuchPrepText}</i>]. По запросу не найдена ни одна группа. Отправьте мне более точный запрос.`;
            break;
        case "PREP":
            try { res = await getPrep(obuchPrepText, dayShift); }
            catch(err) { return 'Не могу загрузить данные. Попробуйте позже.'; }
            if (res.data) {
                let resultText = "";
                if (res.data[0]) {
                    res.data.forEach((v, i) => {
                        resultText += "<b>" + v.Para + " пара:</b> " + v.Disc + ". " + v.Zanyatie + ".\nгруппа " + v.GroupName + "\nауд. " + v.Auditor + "\n\n";
                    });
                    selectedDate = getSelectedDate(res.data[0].Date_Zan);
                    resultText = `<b>[ ${selectedDate} ]</b>\n\n` + resultText;
                }
                else resultText = "Нет занятий.";
                sendMessageText = `<b>Расписание на ${dayText}</b>\n\nВы ввели: [<i>${obuchPrepText}</i>]. По запросу найден преподаватель <b>[${res.prepName}]</b> Если вы искали не его, отправьте мне более точный запрос.\n_______\n\n${resultText}`;
            }
            else sendMessageText = `<b>Расписание на ${dayText}</b>\n\nВы ввели: [<i>${obuchPrepText}</i>]. По запросу не найден ни один преподаватель. Отправьте мне более точный запрос.`;
            break;
        default:
            return 'Ошибка. Удалите и перезапустите бот';
            break;
    }
    return sendMessageText;
}

async function getGroup(groupName, dayShift = 0) {
    let conn;
    let rows2;
    try {
        conn = await pool.getConnection();
        const [rows] = await conn.query("SELECT GroupName FROM schedule WHERE GroupName LIKE CONCAT('%', ?, '%') ORDER BY GroupName ASC LIMIT 1", [groupName]);
        if (rows) {
            rows2 = await conn.query(`SELECT DISTINCT GroupName, Para, Auditor, Disc, FIO_Prep, Date_Zan FROM schedule WHERE (Date_Zan =  ADDDATE(CURRENT_DATE(), ${dayShift})) AND (GroupName = '${rows.GroupName}') ORDER BY Para ASC`);
            return { data: rows2, groupName: rows.GroupName };
        }
        return { data: undefined, groupName: undefined };
    } catch (err) {
        console.log(err);
        throw err;
    } finally {
        if (conn) await conn.end();
    }
}

async function getPrep(prepName, dayShift = 0) {
    let conn;
    let rows2;
    try {
        conn = await pool.getConnection();
        const [rows] = await conn.query("SELECT FIO_Prep FROM schedule WHERE FIO_Prep LIKE CONCAT(?, '%') ORDER BY FIO_Prep ASC LIMIT 1", [prepName]);
        if (rows) {
            rows2 = await conn.query(`SELECT DISTINCT FIO_Prep, GroupName, Para, Auditor, Disc, Zanyatie, Date_Zan FROM schedule WHERE (Date_Zan =  ADDDATE(CURRENT_DATE(), ${dayShift})) AND (FIO_Prep = '${rows.FIO_Prep}') ORDER BY Para ASC`);
            return { data: rows2, prepName: rows.FIO_Prep };
        }
        return { data: undefined, prepName: undefined };
    } catch (err) {
        console.log(err);
        throw err;
    } finally {
        if (conn) await conn.end();
    }
}

function getSelectedDate(date) {
    let day = ('0' + date.getDate()).slice(-2);
    let month = ('0' + (date.getMonth() + 1)).slice(-2);
    let year = date.getFullYear();
    return `${day}.${month}.${year}`;
}