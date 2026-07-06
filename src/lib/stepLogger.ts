export class StepLogger {
  private logs: string[] = [];

  constructor() {}

  public log(msg: string): void {
    console.log(msg);
    this.logs.push(msg);
  }

  public getLogs(): string[] {
    return this.logs;
  }
}
