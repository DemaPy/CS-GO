import type { SiteCopy } from './types'

/** "день / дня / дней" for a count, via the CLDR plural rules. */
function days(n: number): string {
  const form = new Intl.PluralRules('ru').select(n)
  const word = form === 'one' ? 'день' : form === 'few' ? 'дня' : 'дней'
  return `${n} ${word}`
}

// Drafted 2026-09-30 in the approved English copy's CS tone, informal "ты".
// Pending the user's review. Only the product name is still TODO(copy).
export const ru: SiteCopy = {
  meta: {
    title: 'Заложи. Обезвредь. Проснись.',
    description:
      'Будильник в виде бутафорской бомбы: таймер обратного отсчёта, код на клавиатуре, обезвредь, чтобы отложить. Вступай в лист ожидания.',
    subscribedTitle: 'Адрес подтверждён',
  },
  sections: {
    casing: {
      eyebrow: 'Этап первый',
      stage: 'Корпус',
      heading: 'Будильник, который выглядит как бомба',
      body: 'Настольный реквизит с настоящим будильником внутри. Листай, чтобы собрать его.',
    },
    charges: {
      eyebrow: 'Этап второй',
      stage: 'Заряды',
      heading: 'Три блока. Ноль взрывчатки.',
      body: 'Инертные, с весом, сделаны для вида. Это часы — блоки тут просто для драмы.',
    },
    harness: {
      eyebrow: 'Этап третий',
      stage: 'Проводка',
      heading: 'Каждый провод куда-то ведёт',
      body: 'Перережь правильный — и будильник отложится. Перережь не тот — и нет.',
    },
    panel: {
      eyebrow: 'Этап четвёртый',
      stage: 'Панель',
      heading: 'Ставь его, как будто закладываешь',
      body: 'Набери время подъёма на клавиатуре. Всю ночь дисплей ведёт к нему обратный отсчёт.',
    },
    arm: {
      eyebrow: 'Этап пятый',
      stage: 'Взвод',
      heading: 'Обезвредь своё утро',
      body: 'Введи код, чтобы остановить его раньше таймера. Впиши email на дисплее, чтобы попасть в лист ожидания.',
    },
  },
  lcd: {
    // The device's own labels stay in its segment font (see SiteCopy.lcd).
    label: 'address',
    button: 'arm',
    busy: 'wait',
    messageFont: 'mono',
    joined: 'ты в списке — подтверди в почте',
    checkoutFailed: 'оплата не открылась — попробуй ещё раз',
    errors: {
      empty: 'сначала введи адрес',
      too_long: 'адрес слишком длинный',
      missing_at: 'в адресе нет @',
      double_at: 'в адресе больше одного @',
      no_local: 'добавь часть до @',
      no_domain: 'добавь домен после @',
      domain_no_dot: 'в домене нужна точка, например example.com',
      domain_stray_dot: 'лишняя точка в домене',
      invalid: 'это не похоже на email',
    },
  },
  subscribed: {
    states: {
      confirmed: {
        eyebrow: 'Подтверждено',
        heading: 'Ты в списке',
        body: 'Напишем, когда он выйдет. Только заметки о сборке и новости запуска; в каждом письме есть ссылка для отписки.',
      },
      expired: {
        eyebrow: 'Ссылка устарела',
        heading: 'Эта ссылка слишком старая',
        body: 'Ссылки подтверждения действуют семь дней. Введи адрес ещё раз — придёт новая.',
      },
      invalid: {
        eyebrow: 'Ссылка недействительна',
        heading: 'Эта ссылка не прошла проверку',
        body: 'Возможно, её повредил почтовый клиент. Введи адрес ещё раз, чтобы получить новую.',
      },
    },
    back: 'Назад к устройству',
  },
  email: {
    subject: 'Подтверди своё место в листе ожидания',
    preview: 'Один клик подтверждает твоё место в листе ожидания.',
    eyebrow: 'Этап пятый · ждём подтверждения',
    // The email's LCD strip mirrors the device's own labels.
    lcdLabel: 'status',
    lcdValue: 'NOT ARMED',
    heading: 'Один клик — и ты в списке',
    body: 'Подтверди этот адрес, чтобы закрепить место в листе ожидания. Напишем, когда он выйдет: только заметки о сборке и новости запуска.',
    button: 'Подтвердить место',
    fallbackHint: 'Кнопка не работает? Вставь эту ссылку в браузер:',
    expiry: (n) => `Ссылка действует ${days(n)}`,
    footer:
      'Не запрашивал? Просто проигнорируй. Твой адрес никуда не добавлен, а ссылка перестанет работать сама.',
  },
  credits: {
    by: ', автор ',
    modified: 'перегруппировано для анимации',
  },
  switcher: {
    label: 'Язык',
  },
}
