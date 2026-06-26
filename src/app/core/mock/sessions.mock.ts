import { ChatHistorySession } from '@app/core/models/types';

const d = (daysAgo: number) => Date.now() - daysAgo * 86_400_000;

export const MOCK_SESSIONS: ChatHistorySession[] = [
  {
    id: 'sess_mock_1',
    baseRef: 'INV-2024-8834',
    title: 'INV-2024-8834 · ส่งกรมแล้ว อย.',
    timestamp: d(0),
    messages: [],
  },
  {
    id: 'sess_mock_2',
    baseRef: 'RG-2568-19203',
    title: 'RG-2568-19203 · รอชำระ กษ.',
    timestamp: d(1),
    messages: [],
  },
  {
    id: 'sess_mock_3',
    baseRef: 'INV-2024-7201',
    title: 'INV-2024-7201 · ตรวจสอบก่อนส่งกรม',
    timestamp: d(2),
    messages: [],
  },
  {
    id: 'sess_mock_4',
    baseRef: 'HTHM-2568-00412',
    title: 'HTHM-2568-00412 · OCR เสร็จแล้ว',
    timestamp: d(4),
    messages: [],
  },
  {
    id: 'sess_mock_5',
    baseRef: 'INV-2024-6540',
    title: 'INV-2024-6540 · ยืนยัน flags',
    timestamp: d(5),
    messages: [],
  },
  {
    id: 'sess_mock_6',
    baseRef: 'HS 2941.10.00',
    title: 'HS 2941.10.00 · วิเคราะห์ HS Code',
    timestamp: d(7),
    messages: [],
  },
];
