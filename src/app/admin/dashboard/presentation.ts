export const money = (n: number | null) => n === null ? '—' : new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 2 }).format(n);
export const shortDate = (day: string) => new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${day}T00:00:00Z`));
export const rangeText = (p: { from: string; to: string }) => `${shortDate(p.from)} – ${shortDate(p.to)} ${Number(p.to.slice(0,4)) + 543}`;
export const types: Record<string, string> = { quote: 'ใบเสนอราคา', bill: 'ใบวางบิล', invoice: 'ใบแจ้งหนี้', receipt: 'ใบเสร็จรับเงิน' };
export const statuses: Record<string, string> = { draft: 'ฉบับร่าง', sent: 'ส่งแล้ว', approved: 'อนุมัติ', paid: 'ชำระแล้ว', cancelled: 'ยกเลิก', completed: 'เสร็จสิ้น' };
