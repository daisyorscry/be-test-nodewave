export type CallCenterRecordDTO = {
  id: number;
  fileId: number;
  rowNumber: number;
  externalId: string;
  customerName: string;
  sentiment: string;
  csatScore: number | null;
  callTimestamp: Date | null;
  reason: string | null;
  city: string | null;
  state: string | null;
  channel: string | null;
  responseTime: string | null;
  callDurationMinutes: number | null;
  callCenter: string | null;
  createdAt: Date;
};

export type CallCenterListResponseDTO = {
  records: CallCenterRecordDTO[];
  nextCursor?: { createdAt: string; id: number } | null;
  prevCursor?: { createdAt: string; id: number } | null;
};
