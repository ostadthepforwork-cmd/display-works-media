// layout.tsx ไม่ต้องเช็ค auth อีกแล้ว เพราะ middleware จัดการแล้ว
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
