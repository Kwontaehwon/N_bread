export class reportInfoDto {
  title: string;
  content: string;
  reportedUserId: number;
  reporterId: number;

  constructor(
    title: string,
    content: string,
    reportUserId: number,
    reporterId: number,
  ) {
    (this.title = title),
      (this.content = content),
      (this.reportedUserId = reportUserId),
      (this.reporterId = reporterId);
  }
}
