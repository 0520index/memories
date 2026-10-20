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
  titlePlaceholder: string
  memoWant: string
  memoDone: string
  showLocation: boolean
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'place',
    label: '場所',
    icon: '📍',
    want: '行きたい',
    done: '行った',
    again: 'また行きたい',
    markDone: '行った！',
    titlePlaceholder: '例: 江の島',
    memoWant: '行きたい理由、気になるメニューなど',
    memoDone: 'どんな一日だった？',
    showLocation: true,
  },
  {
    id: 'movie',
    label: '映画',
    icon: '🎬',
    want: '見たい',
    done: '見た',
    again: 'また見たい',
    markDone: '見た！',
    titlePlaceholder: '例: 君の名は。',
    memoWant: '予告で気になったところ、誰と見たいかなど',
    memoDone: '感想・好きなシーンなど',
    showLocation: false,
  },
  {
    id: 'book',
    label: '本',
    icon: '📚',
    want: '読みたい',
    done: '読んだ',
    again: 'また読みたい',
    markDone: '読んだ！',
    titlePlaceholder: '例: 夜は短し歩けよ乙女',
    memoWant: '気になった理由、おすすめされたきっかけなど',
    memoDone: '感想・好きな一文など',
    showLocation: false,
  },
  {
    id: 'food',
    label: 'グルメ',
    icon: '🍽',
    want: '行きたい',
    done: '行った',
    again: 'また行きたい',
    markDone: '行った！',
    titlePlaceholder: '例: ○○ラーメン',
    memoWant: '食べたいメニュー、誰に勧められたかなど',
    memoDone: '何を食べた？また頼みたいものは？',
    showLocation: true,
  },
  {
    id: 'other',
    label: 'その他',
    icon: '✨',
    want: 'やりたい',
    done: 'やった',
    again: 'またやりたい',
    markDone: 'やった！',
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
