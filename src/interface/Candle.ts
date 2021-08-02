import CandleStatus from '../enum/CandleStatus';

interface Candle {
  high: number;
  low: number;
  open: number;
  close: number;
  leftCoordinate: number;
  rightCoordinate: number;
  status?: CandleStatus;
  time?: number;
  formatedTime?: string;
  MA5?: number;
  [key: string]: any;
}

export default Candle;
