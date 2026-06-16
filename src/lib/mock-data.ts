export type Status = "confirmed" | "completed" | "cancelled";

export interface Staff {
  id: string;
  name: string;
  phone: string;
  bio: string;
  services: string[];
  isActive: boolean;
  color: string;
  workingHours: { day: string; start: string; end: string; dayOff: boolean }[];
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  staffIds: string[];
  isActive: boolean;
  emoji: string;
}

export interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  staffId: string;
  serviceId: string;
  datetime: string;
  duration: number;
  price: number;
  status: Status;
  notes?: string;
}

export const staff: Staff[] = [
  {
    id: "s1",
    name: "Ayşe Kaya",
    phone: "0532 111 22 33",
    bio: "10 yıl deneyimli tırnak uzmanı",
    services: ["srv1", "srv2", "srv5"],
    isActive: true,
    color: "#E8A4C8",
    workingHours: [
      { day: "Pzt", start: "09:00", end: "18:00", dayOff: false },
      { day: "Sal", start: "09:00", end: "18:00", dayOff: false },
      { day: "Çar", start: "09:00", end: "18:00", dayOff: false },
      { day: "Per", start: "09:00", end: "18:00", dayOff: false },
      { day: "Cum", start: "09:00", end: "18:00", dayOff: false },
      { day: "Cmt", start: "10:00", end: "16:00", dayOff: false },
      { day: "Paz", start: "", end: "", dayOff: true },
    ],
  },
  {
    id: "s2",
    name: "Fatma Demir",
    phone: "0533 444 55 66",
    bio: "Saç tasarımı ve boyama uzmanı",
    services: ["srv3", "srv4", "srv2"],
    isActive: true,
    color: "#A8D8B9",
    workingHours: [
      { day: "Pzt", start: "10:00", end: "19:00", dayOff: false },
      { day: "Sal", start: "10:00", end: "19:00", dayOff: false },
      { day: "Çar", start: "", end: "", dayOff: true },
      { day: "Per", start: "10:00", end: "19:00", dayOff: false },
      { day: "Cum", start: "10:00", end: "19:00", dayOff: false },
      { day: "Cmt", start: "10:00", end: "17:00", dayOff: false },
      { day: "Paz", start: "", end: "", dayOff: true },
    ],
  },
  {
    id: "s3",
    name: "Zeynep Arslan",
    phone: "0541 777 88 99",
    bio: "Cilt bakımı ve makyaj uzmanı",
    services: ["srv5", "srv6"],
    isActive: true,
    color: "#B4C8E8",
    workingHours: [
      { day: "Pzt", start: "09:00", end: "17:00", dayOff: false },
      { day: "Sal", start: "09:00", end: "17:00", dayOff: false },
      { day: "Çar", start: "09:00", end: "17:00", dayOff: false },
      { day: "Per", start: "", end: "", dayOff: true },
      { day: "Cum", start: "09:00", end: "17:00", dayOff: false },
      { day: "Cmt", start: "10:00", end: "15:00", dayOff: false },
      { day: "Paz", start: "", end: "", dayOff: true },
    ],
  },
];

export const services: Service[] = [
  {
    id: "srv1",
    name: "Manikür",
    description: "Kalıcı oje, şekillendirme dahil",
    duration: 45,
    price: 350,
    staffIds: ["s1"],
    isActive: true,
    emoji: "💅",
  },
  {
    id: "srv2",
    name: "Pedikür",
    description: "Oje + bakım paketi",
    duration: 60,
    price: 400,
    staffIds: ["s1", "s2"],
    isActive: true,
    emoji: "🦶",
  },
  {
    id: "srv3",
    name: "Saç Boyama",
    description: "Fön dahil, tüm teknikler",
    duration: 90,
    price: 800,
    staffIds: ["s2"],
    isActive: true,
    emoji: "💇",
  },
  {
    id: "srv4",
    name: "Saç Kesimi",
    description: "Yıkama ve fön dahil",
    duration: 45,
    price: 300,
    staffIds: ["s2"],
    isActive: true,
    emoji: "✂️",
  },
  {
    id: "srv5",
    name: "Cilt Bakımı",
    description: "Derin temizlik + maske",
    duration: 60,
    price: 550,
    staffIds: ["s1", "s3"],
    isActive: true,
    emoji: "🧖",
  },
  {
    id: "srv6",
    name: "Profesyonel Makyaj",
    description: "Özel gün, gelin makyajı",
    duration: 90,
    price: 1200,
    staffIds: ["s3"],
    isActive: false,
    emoji: "💄",
  },
];

export const appointments: Appointment[] = [
  {
    id: "a1",
    customerName: "Selin Yıldız",
    customerPhone: "0530 123 45 67",
    staffId: "s1",
    serviceId: "srv1",
    datetime: "2026-06-03T10:00:00",
    duration: 45,
    price: 350,
    status: "confirmed",
  },
  {
    id: "a2",
    customerName: "Merve Çelik",
    customerPhone: "0535 234 56 78",
    staffId: "s2",
    serviceId: "srv3",
    datetime: "2026-06-03T11:00:00",
    duration: 90,
    price: 800,
    status: "confirmed",
  },
  {
    id: "a3",
    customerName: "Elif Şahin",
    customerPhone: "0542 345 67 89",
    staffId: "s3",
    serviceId: "srv5",
    datetime: "2026-06-03T09:30:00",
    duration: 60,
    price: 550,
    status: "completed",
  },
  {
    id: "a4",
    customerName: "Büşra Koç",
    customerPhone: "0543 456 78 90",
    staffId: "s1",
    serviceId: "srv2",
    datetime: "2026-06-03T14:00:00",
    duration: 60,
    price: 400,
    status: "confirmed",
  },
  {
    id: "a5",
    customerName: "Hande Aydın",
    customerPhone: "0544 567 89 01",
    staffId: "s2",
    serviceId: "srv4",
    datetime: "2026-06-03T15:30:00",
    duration: 45,
    price: 300,
    status: "cancelled",
  },
  {
    id: "a6",
    customerName: "Tuğba Yılmaz",
    customerPhone: "0545 678 90 12",
    staffId: "s3",
    serviceId: "srv5",
    datetime: "2026-06-04T10:00:00",
    duration: 60,
    price: 550,
    status: "confirmed",
  },
  {
    id: "a7",
    customerName: "Cansu Öztürk",
    customerPhone: "0546 789 01 23",
    staffId: "s1",
    serviceId: "srv1",
    datetime: "2026-06-04T13:00:00",
    duration: 45,
    price: 350,
    status: "confirmed",
  },
  {
    id: "a8",
    customerName: "Derya Kılıç",
    customerPhone: "0547 890 12 34",
    staffId: "s2",
    serviceId: "srv3",
    datetime: "2026-06-05T11:00:00",
    duration: 90,
    price: 800,
    status: "confirmed",
  },
];
