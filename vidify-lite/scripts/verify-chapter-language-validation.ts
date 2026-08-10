import { writeVerificationLog } from "./verificationLogger.ts";
import { validateChapterLanguage } from "../src/services/chapterLanguageValidationService.ts";

const assert = (condition: unknown, message: string): void => {
  if (!condition) throw new Error(message);
};

const validVietnamese = "Bước vào hậu trường trò chơi, chúng ta thấy đây là một hệ thống vận hành phức tạp. Những hệ lụy về tâm lý và kinh tế đã đẩy nhiều gia đình vào cảnh khó khăn, nợ nần chồng chất.";
const missingDiacritics = "Nhung he luy ve mat tam ly va kinh te da day biet bao gia dinh vao canh khon cung, no nan chong chat va khong the tim duoc loi thoat phu hop.";
const joinedWords = "Buoc vaohau truongtrochoi,chungtathaygi? Do lathethegioi cuaungdungkhongcap phepvahoatdongbalthuphapphivathucte. TheoWikipedia,loinhuansankhoang15den20phantram.";
const technicalTerms = "Trí tuệ nhân tạo sử dụng API, JSON và OpenAI để xử lý dữ liệu. Những thuật ngữ tiếng Anh này không làm thay đổi ngôn ngữ chính của toàn bộ nội dung tiếng Việt.";

assert(validateChapterLanguage(validVietnamese, true).valid, "valid Vietnamese chapter was rejected");
assert(!validateChapterLanguage(missingDiacritics, true).valid, "Vietnamese without diacritics was accepted");
assert(!validateChapterLanguage(joinedWords, true).valid, "joined Vietnamese words were accepted");
assert(validateChapterLanguage(technicalTerms, true).valid, "technical terms caused a false rejection");
assert(validateChapterLanguage(missingDiacritics, false).valid, "English content was checked as Vietnamese");

writeVerificationLog("Chapter language validation assertions passed");
