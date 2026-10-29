export type Category = 'place' | 'movie' | 'book' | 'food' | 'other'

export type CategoryMeta = {
  id: Category
  label: string
  icon: string
  /** 未経験リストのラベル */
  want: string
  /** 経験済みリストのラベル */
  done: string
  /** またやりたいのラベル */
  again: string
  /** 「完了した！」ボタン */
  markDone: string
  /** 日付入力の見出し（説明なので日本語） */
  dateLabel: string
  titlePlaceholder: string
  memoWant: string
  memoDone: string
  showLocation: boolean
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'place',
    label: 'Place',
    icon: '📍',
    want: 'Want',
    done: 'Visited',
    again: 'Want again',
    markDone: '行った！',
    dateLabel: '行った日',
    titlePlaceholder: '例: 江の島',
    memoWant: '行きたい理由、気になるメニューなど',
    memoDone: 'どんな一日だった？',
    showLocation: true,
  },
  {
    id: 'movie',
    label: 'Movie',
    icon: '🎬',
    want: 'Want',
    done: 'Watched',
    again: 'Want again',
    markDone: '見た！',
    dateLabel: '見た日',
    titlePlaceholder: '例: 君の名は。',
    memoWant: '予告で気になったところ、誰と見たいかなど',
    memoDone: '感想・好きなシーンなど',
    showLocation: false,
  },
  {
    id: 'book',
    label: 'Book',
    icon: '📚',
    want: 'Want',
    done: 'Read',
    again: 'Want again',
    markDone: '読んだ！',
    dateLabel: '読んだ日',
    titlePlaceholder: '例: 夜は短し歩けよ乙女',
    memoWant: '気になった理由、おすすめされたきっかけなど',
    memoDone: '感想・好きな一文など',
    showLocation: false,
  },
  {
    id: 'food',
    label: 'Food',
    icon: '🍽',
    want: 'Want',
    done: 'Visited',
    again: 'Want again',
    markDone: '行った！',
    dateLabel: '行った日',
    titlePlaceholder: '例: ○○ラーメン',
    memoWant: '食べたいメニュー、誰に勧められたかなど',
    memoDone: '何を食べた？また頼みたいものは？',
    showLocation: true,
  },
  {
    id: 'other',
    label: 'Other',
    icon: '✨',
    want: 'Want',
    done: 'Done',
    again: 'Want again',
    markDone: 'やった！',
    dateLabel: 'やった日',
    titlePlaceholder: '例: 花火大会',
    memoWant: 'やりたいこと、気になるポイントなど',
    memoDone: 'どんな体験だった？',
    showLocation: true,
  },
]

export const DEFAULT_CATEGORY: Category = 'place'

export function getCategory(id: string | null | undefined): CategoryMeta {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0]
}

export function normalizeCategory(id: string | null | undefined): Category {
  return getCategory(id).id
}
