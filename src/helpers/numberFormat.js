const formatCurrency = sum => new Intl.NumberFormat('ru-RU').format(sum)

const getFormattedDate = (data) => {
    const date = new Date(data);

    return  new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
}

const getFormattedDateWithTime = (data) => {
    const date = new Date(data);

    const formattedTime = date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    return `${getFormattedDate(data)}, ${formattedTime}`;
}

function formatDateTimeLocal(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    const hh = String(date.getHours()).padStart(2, "0")
    const mm = String(date.getMinutes()).padStart(2, "0")
    const ss = String(date.getSeconds()).padStart(2, "0")
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
}

function formatLocalEndOfDay(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d} 23:59:59`
}

export {
    formatCurrency,
    getFormattedDateWithTime,
    getFormattedDate,
    formatDateTimeLocal,
    formatLocalEndOfDay
}


