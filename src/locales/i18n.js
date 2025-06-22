import uz from './uz.json'
import en from './en.json'
import ru from './ru.json'
import { createI18n } from 'vue-i18n'

export default createI18n({
    legacy: false,
    locale: localStorage.getItem('lang') || 'ru',
    fallbackLocale: 'en',
    messages: { uz, en, ru }
})