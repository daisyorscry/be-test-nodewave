import type * as CC from "$entities/callcenter";

export function toCallCenterDTO(record: any): CC.CallCenterRecordDTO {
  return {
    id: record.id,
    fileId: record.fileId,
    rowNumber: record.rowNumber,
    externalId: record.externalId,
    customerName: record.customerName,
    sentiment: record.sentiment,
    csatScore: record.csatScore,
    callTimestamp: record.callTimestamp,
    reason: record.reason,
    city: record.city,
    state: record.state,
    channel: record.channel,
    responseTime: record.responseTime,
    callDurationMinutes: record.callDurationMinutes,
    callCenter: record.callCenter,
    createdAt: record.createdAt
  };
}
