declare module 'node-cron' {
  export type ScheduledTask = { stop: () => void };
  export function schedule(cron: string, task: () => void | Promise<void>): ScheduledTask;
  const cron: { schedule: typeof schedule };
  export default cron;
}
