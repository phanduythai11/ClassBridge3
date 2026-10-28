// classCodeGenerator.ts
// Hàm sinh mã lớp học + nội dung QR, dùng khi giảng viên TẠO LỚP HỌC.
// Mã sinh ra được kiểm tra để không bao giờ trùng với mã của lớp khác.

// Bộ ký tự dùng để sinh mã — bỏ các ký tự dễ nhầm lẫn: 0/O, 1/I
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// Sinh 1 mã ngẫu nhiên dạng "ABCD-EFGH" (8 ký tự, có gạch ngang cho dễ đọc/gõ)
function randomCode(): string {
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    if (i === 3) result += "-";
  }
  return result;
}

/**
 * Sinh mã lớp học DUY NHẤT (không trùng với các mã đã tồn tại).
 * @param existingCodes Danh sách mã lớp đang có (lấy từ database khi tích hợp thật)
 */
export function generateUniqueClassCode(existingCodes: string[]): string {
  let code = randomCode();
  // Nếu trùng mã đã có, sinh lại cho tới khi ra mã mới hoàn toàn
  while (existingCodes.includes(code)) {
    code = randomCode();
  }
  return code;
}

/**
 * Nội dung sẽ được encode thành hình QR cho lớp học đó.
 * Mỗi mã lớp là duy nhất -> QR sinh ra từ nó cũng là duy nhất, không lớp nào trùng lớp nào.
 */
export function generateQrPayload(classCode: string): string {
  return `classbridge://join?code=${classCode}`;
}

/**
 * VÍ DỤ SỬ DỤNG khi tạo lớp học mới (phía giảng viên, làm sau):
 *
 *   const existingCodes = await getAllClassCodesFromDB();
 *   const newCode = generateUniqueClassCode(existingCodes);
 *   const qrPayload = generateQrPayload(newCode);
 *   await saveNewClass({ ...classData, code: newCode, qrPayload });
 *
 * Ở màn "Quét mã QR" của sinh viên, camera sẽ đọc được chuỗi qrPayload này,
 * tách lấy phần "code" rồi gửi lên server để tìm đúng lớp và cho tham gia.
 */