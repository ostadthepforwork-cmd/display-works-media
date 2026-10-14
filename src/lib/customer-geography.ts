export const THAI_PROVINCES = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท",
  "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา",
  "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์",
  "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี",
  "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง",
  "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ",
  "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์",
  "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี",
] as const;

type LocationRecord = { province?: string; postalCode?: string; postal_code?: string; address?: string; customerProvince?: string; customer_province?: string; overrideAddress?: string; override_address?: string };

export function customerProvince(record: LocationRecord) {
  const explicit = String(record.province || record.customerProvince || record.customer_province || "").trim();
  if (explicit) return explicit === "กรุงเทพฯ" ? "กรุงเทพมหานคร" : explicit;
  const address = String(record.address || record.overrideAddress || record.override_address || "");
  if (/กรุงเทพ/.test(address)) return "กรุงเทพมหานคร";
  return THAI_PROVINCES.find(province => address.includes(province)) || "ไม่ระบุ";
}

export function customerPostalCode(record: LocationRecord) {
  const explicit = String(record.postalCode || record.postal_code || "").trim();
  if (explicit) return /^\d{5}$/.test(explicit) ? explicit : "ไม่ระบุ";
  // Old addresses may contain a postcode; never pad incomplete codes or use part of a phone number.
  return String(record.address || "").match(/(?:^|\D)(\d{5})(?!\d)/)?.[1] || "ไม่ระบุ";
}

export function validateCustomerLocation(record: LocationRecord) {
  const province = String(record.province || "").trim();
  const postalCode = String(record.postalCode || record.postal_code || "").trim();
  if (province && !THAI_PROVINCES.some(value => value === province)) return "กรุณาเลือกจังหวัดจากรายการ";
  if (postalCode && !/^\d{5}$/.test(postalCode)) return "รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก";
  return "";
}
