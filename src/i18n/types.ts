/** 字典类型：从 en 推导，字符串展宽成 string */
import en from './en';

type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => infer R
    ? (...args: A) => R
    : T extends object
      ? { [K in keyof T]: Widen<T[K]> }
      : T;

export type Dictionary = Widen<typeof en>;

/** 校验字典键与英文一致 */
export type ExactDictionary<T> = T extends Dictionary
  ? Dictionary extends T
    ? T
    : never
  : never;
