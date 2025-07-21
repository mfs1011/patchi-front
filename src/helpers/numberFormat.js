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

export { formatCurrency, getFormattedDateWithTime, getFormattedDate }


