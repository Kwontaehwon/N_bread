import { dealReports } from '@prisma/client';

class DealReportDto {
  title: string;
  content: string;
  reporterId: number;
  dealId: number;

  constructor(dealReport: dealReports) {
    this.title = dealReport.title;
    this.content = dealReport.content;
    this.reporterId = dealReport.reporterId;
    this.dealId = dealReport.dealId;
  }
}

export { DealReportDto };
