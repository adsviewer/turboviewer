export enum Environment {
  Production = 'prod',
  Demo = 'demo',
  Local = 'local',
}

export const isMode = (val: string): val is Environment => Object.values(Environment).includes(val as Environment);

export const MODE = !process.env.MODE || !isMode(process.env.MODE) ? Environment.Local : process.env.MODE;
