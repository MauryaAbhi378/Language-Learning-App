import courseData from "@/assets/data/course-content.json";
import Ionicons from "@expo/vector-icons/Ionicons";

export interface CourseData {
  chapters: Chapter[];
  scenarios: ConversationScenario[];
}

export type CourseLanguage = keyof typeof courseData;

export type CourseContent = Record<CourseLanguage, CourseData>;

export const COURSE_LANGUAGE_LABELS = {
  chinese: "Chinese",
  japanese: "Japanese",
  german: "German",
  korean: "Korean",
} as const satisfies Record<CourseLanguage, string>;

export interface CourseLanguageMeta {
  title: string;
  primaryLabel: string;
  secondaryLabel: string;
  speechLocale: string;
}

export const COURSE_LANGUAGE_META = {
  chinese: {
    title: "Chinese",
    primaryLabel: "Characters",
    secondaryLabel: "Pinyin",
    speechLocale: "zh-CN",
  },
  japanese: {
    title: "Japanese",
    primaryLabel: "Script",
    secondaryLabel: "Romaji",
    speechLocale: "ja-JP",
  },
  german: {
    title: "German",
    primaryLabel: "German",
    secondaryLabel: "Pronunciation",
    speechLocale: "de-DE",
  },
  korean: {
    title: "Korean",
    primaryLabel: "Hangul",
    secondaryLabel: "Romanization",
    speechLocale: "ko-KR",
  },
} as const satisfies Record<CourseLanguage, CourseLanguageMeta>;

export const COURSE_LANGUAGES = Object.keys(COURSE_LANGUAGE_LABELS).map(
  (id) => ({
    id: id as CourseLanguage,
    title: COURSE_LANGUAGE_LABELS[id as CourseLanguage],
  }),
);

export interface ConversationScenario {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  isFree: boolean;
  description: string;
  goal: string;
  tasks: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  phrasebook?: PhrasebookEntry[];
}

interface PhrasebookEntry {
  english: string;
  [key: string]: string;
}

export interface Chapter {
  id: number;
  title: string;
  lessons: Lesson[];
  review?: Lesson;
}

export interface Lesson {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  completionCount: number;
  questions: Question[];
}

interface BaseQuestion {
  id: number;
  type: "multiple_choice" | "single_response" | "listening_mc";
  options: QuestionOption[];
  correctOptionId?: number;

  [key: string]:
    | number
    | string
    | PromptContent
    | PhraseContent
    | QuestionOption[]
    | undefined;
}

export interface PromptContent {
  [key: string]: string;
}

export interface Word {
  english: string;
  [key: string]: string;
}

export interface PhraseContent {
  words: Word[];
  breakdown: string;
  [key: string]: string | Word[];
}

export interface SpeakingOption {
  id: number;
  english: string;

  [key: string]: number | string | PhraseContent | undefined;
}

export interface ListeningOption {
  id: number;
  english: string;

  [key: string]: number | string | PhraseContent | undefined;
}

export type QuestionOption = SpeakingOption | ListeningOption;
export type Question = BaseQuestion;

export const COURSE_CONTENT = courseData as unknown as CourseContent;
export const DEFAULT_COURSE_LANGUAGE: CourseLanguage = "chinese";

const QUESTION_META_KEYS = new Set([
  "id",
  "type",
  "options",
  "correctOptionId",
]);

export const isCourseLanguage = (
  language?: string | null,
): language is CourseLanguage => !!language && language in COURSE_CONTENT;

export const getCourseLanguageTitle = (language?: string | null): string =>
  isCourseLanguage(language)
    ? COURSE_LANGUAGE_LABELS[language]
    : COURSE_LANGUAGE_LABELS[DEFAULT_COURSE_LANGUAGE];

export const getCourseLanguageMeta = (
  language?: string | null,
): CourseLanguageMeta =>
  isCourseLanguage(language)
    ? COURSE_LANGUAGE_META[language]
    : COURSE_LANGUAGE_META[DEFAULT_COURSE_LANGUAGE];

export const getCourseData = (language?: string | null): CourseData => {
  if (isCourseLanguage(language)) {
    return COURSE_CONTENT[language];
  }

  return COURSE_CONTENT[DEFAULT_COURSE_LANGUAGE];
};

export const COURSE_DATA = COURSE_CONTENT[DEFAULT_COURSE_LANGUAGE];

export const getQuestionPromptKey = (question: Question): string | undefined =>
  Object.keys(question).find((key) => !QUESTION_META_KEYS.has(key));

export const getQuestionCourseLanguage = (question: Question): CourseLanguage => {
  const promptKey = getQuestionPromptKey(question);
  return isCourseLanguage(promptKey) ? promptKey : DEFAULT_COURSE_LANGUAGE;
};

export const getQuestionPrompt = (
  question: Question,
): PromptContent | PhraseContent | undefined => {
  const promptKey = getQuestionPromptKey(question);
  const prompt = promptKey ? question[promptKey] : undefined;

  if (!prompt || typeof prompt !== "object" || Array.isArray(prompt)) {
    return undefined;
  }

  return prompt as PromptContent | PhraseContent;
};

export const getOptionPhrase = (
  option: QuestionOption,
): PhraseContent | undefined => {
  const phraseKey = Object.keys(option).find(
    (key) => key !== "id" && key !== "english",
  );
  const phrase = phraseKey ? option[phraseKey] : undefined;

  if (!phrase || typeof phrase !== "object" || Array.isArray(phrase)) {
    return undefined;
  }

  return phrase as PhraseContent;
};

const PRIMARY_TEXT_KEYS = ["hanzi", "kanji_kana", "hangul", "german"] as const;
const SECONDARY_TEXT_KEYS = [
  "pinyin",
  "romaji",
  "romanization",
  "pronunciation",
] as const;
const PHRASE_META_KEYS = new Set(["id", "english", "words", "breakdown"]);

const getFirstStringValue = (
  content: Record<string, unknown>,
  keys: readonly string[],
): string | undefined => {
  for (const key of keys) {
    const value = content[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return undefined;
};

export const getPhrasePrimaryText = (
  content?: PromptContent | PhraseContent | Word,
): string | undefined => {
  if (!content) {
    return undefined;
  }

  const phrase = content as Record<string, unknown>;
  const knownPrimaryText = getFirstStringValue(phrase, PRIMARY_TEXT_KEYS);

  if (knownPrimaryText) {
    return knownPrimaryText;
  }

  const fallbackKey = Object.keys(phrase).find((key) => {
    if (PHRASE_META_KEYS.has(key) || SECONDARY_TEXT_KEYS.includes(key as never)) {
      return false;
    }

    const value = phrase[key];
    return typeof value === "string" && value.trim().length > 0;
  });

  return fallbackKey ? (phrase[fallbackKey] as string) : undefined;
};

export const getPhraseSecondaryText = (
  content?: PromptContent | PhraseContent | Word,
): string | undefined => {
  if (!content) {
    return undefined;
  }

  return getFirstStringValue(
    content as Record<string, unknown>,
    SECONDARY_TEXT_KEYS,
  );
};

export const getPhraseWords = (
  content?: PromptContent | PhraseContent,
): Word[] => {
  if (!content) {
    return [];
  }

  const words = (content as Record<string, unknown>).words;
  return Array.isArray(words) ? (words as Word[]) : [];
};

export const getWordKey = (word: Word): string => {
  const keyParts = [
    getPhrasePrimaryText(word),
    getPhraseSecondaryText(word),
    word.english,
  ].filter(Boolean);

  return keyParts.join("::");
};
