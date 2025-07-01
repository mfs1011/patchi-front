export const masksByCountry = {
    '+961': {
        name: 'Lebanon',
        mask: '(99) 999-999',
        example: '(71) 234-567'
    },
    '+971': {
        name: 'UAE',
        mask: '(99) 999-9999',
        example: '(50) 123-4567'
    },
    '+998': {
        name: 'Uzbekistan',
        mask: '(99) 999-99-99',
        example: '(90) 123-45-67'
    }
};

export const formatPhoneByCountry = rawPhone => {
    const prefix = Object.keys(masksByCountry).find(code => rawPhone.startsWith(code.slice(1)));

    if (!prefix) return rawPhone;

    const mask = masksByCountry[prefix].mask;
    const digits = rawPhone.replace(/\D/g, '').replace(prefix.replace('+', ''), '');

    let formatted = '';
    let digitIndex = 0;

    for (let i = 0; i < mask.length; i++) {
        if (digitIndex >= digits.length) break;
        if (mask[i] === '9') {
            formatted += digits[digitIndex];
            digitIndex++;
        } else {
            formatted += mask[i];
        }
    }

    return `${prefix} ${formatted}`;
}
