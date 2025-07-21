/**
 * values va initialValues o'rtasidagi farqni topib, kerakli formatda payload qaytaradi
 * @param {Object} values - Form qiymatlari
 * @param {Object} initialValues - Dastlabki qiymatlar (ref bo'lsa `.value` ni uzatish kerak)
 * @param {Object} uriKeys - URI formatida bo'lishi kerak bo'lgan maydonlar
 * @returns {Object} payload
 */
export function buildChangedPayload(values, initialValues, uriKeys = {}) {
    const payload = {};

    for (const key in values) {
        if (values[key] !== initialValues[key]) {
            if (uriKeys[key]) {
                payload[key] = `${uriKeys[key]}${values[key]}`;
            } else {
                payload[key] = values[key];
            }
        }
    }

    return payload;
}