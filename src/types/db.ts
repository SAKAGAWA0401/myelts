export interface User {
  userid: string;
  email: string;
}

export interface Category {
  categoryid: string;
  category: string;
}

export interface Card {
  cardid: string;
  userid: string;
  categoryid: string;
}

export interface Question {
  questionid: string;
  cardid: string;
  question: string;
  questionaudio: string;
}

export interface Answer {
  answerid: string;
  cardid: string;
  answer: string;
  answeraudio: string;
}

export interface Word {
  wordid: string;
  answerid: string;
  word: string;
  ipa: string;
}
