/** i18n 入口：按 site.lang 选字典 */
import { site } from '../lib/site';
import en from './en';
import zh from './zh';
import type { Dictionary } from './types';

/* satisfies 校验：少键或多键都会编译失败 */
const dictionaries = {
  en,
  zh,
} satisfies Record<string, Dictionary>;

/** zh-CN / zh_CN / zh 都取 zh */
const baseOf = (lang: string) => lang.toLowerCase().split(/[-_]/)[0];

/** 已注册语言 */
export const locales: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: '简体中文' },
];

export function getDictionary(lang: string): Dictionary {
  const key = baseOf(lang);
  const table = dictionaries as Record<string, Dictionary>;
  return table[key] ?? table[lang] ?? en;
}

export const t: Dictionary = getDictionary(site.lang);

export const availableLocales = Object.keys(dictionaries);

export type { Dictionary };
