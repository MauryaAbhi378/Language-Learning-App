import {
  CourseLanguage,
  Question,
  SpeakingOption,
  Word,
} from "@/constants/CourseData";

export interface NormalizedQuestionLanguage {
  id: CourseLanguage;
  title: string;
  primaryLabel: string;
  secondaryLabel: string;
  speechLocale: string;
}

export interface NormalizedPhrase {
  hanzi: string;
  pinyin: string;
  words: Word[];
  breakdown: string;
}

export type NormalizedOption = SpeakingOption & {
  mandarin: NormalizedPhrase;
};

export type NormalizedQuestion = Question & {
  language: NormalizedQuestionLanguage;
  mandarin: NormalizedPhrase;
  options: NormalizedOption[];
};
