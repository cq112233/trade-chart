import ChartMode from '../enum/ChartMode';
import ChartType from '../enum/ChartType';
import ChartSeries from '../enum/ChartSeries';
import OptionConf from './OptionConf';

interface UserOption {
  mode: ChartMode;
  originalHeight: number;
  originalWidth: number;
  cPadding: number;
  data: { close: number; high: number; low: number; open: number }[];
  container: string;
  priceDigitnumber: number;
  tSpace: number;
  interval: string;
  bg: string;
  legendColor: string;
  axisColor: string;
  downColor: string;
  upColor: string;
  chartType: ChartType;
  animate: boolean;
  yAxisDirection: string;
  chartSeries?: ChartSeries;
  fontSize?: string;
  MA?: { interval: number; color: string }[];
  lineBgColorBegin?: string;
  lineBgColorEnd?: string;
  BrokenLineColor?: string;
  optionConf: OptionConf;
  loadMoreCallback?: () => {};
  timeCheckErrorHandler?: (diffTime: number) => {};
  markFailHandler?: () => {};
  deliveringCallback?: (remaining: number) => {};
}

export default UserOption;
