# trade-chart.js 文档

一个轻量级的交易图表,基于 canvas 搭建,支持基础 K 线:分时图,蜡烛图,支持二元期权图表

## 引入

```javascript
import TradeChart from 'trade-chart.js';
import 'trade-chart.js/dist/built.css';
```

## 使用

```javascript
const chart = new TradeChart(option);
```

## 配置

| 配置名称              | 配置说明                               | 可选值                                                     | 类型     |
| --------------------- | -------------------------------------- | ---------------------------------------------------------- | -------- |
| mode                  | 模式                                   | pc,mobile                                                  | string   |
| originalWidth         | 画布初始宽度                           | /                                                          | number   |
| originalHeight        | 画布初始高度                           | /                                                          | number   |
| cPadding              | 坐标轴距与画布边的距离                 | /                                                          | number   |
| data                  | 历史行情数据                           | { close: number; high: number; low: number; open: number } | object   |
| container             | 图表容器 id                            | /                                                          | string   |
| priceDigitnumber      | 保留的小数位数                         | /                                                          | number   |
| tSpace                | 字体间距                               | /                                                          | number   |
| interval              | 周期                                   | 1m,5m,15m,30m,1h,1d                                        | string   |
| legendColor           | 图例颜色                               | /                                                          | string   |
| axisColor             | 坐标轴颜色                             | /                                                          | string   |
| downColor             | 跌的颜色                               | /                                                          | string   |
| upColor               | 涨的颜色                               | /                                                          | string   |
| chartType             | 图表类型，暂支持分时图、蜡烛图         | line,candle                                                | string   |
| yAxisDirection        | Y 坐标轴的摆放位置                     | left,right                                                 | string   |
| chartSeries           | 图表系列，暂支持二元期权图和普通行情图 | option,normal                                              | string   |
| optionConf            | 二元期权图表的配置                     | 详情见二元期权图表的配置                                   | object   |
| loadMoreCallback      | 图表分页加载更多的回调函数             | /                                                          | function |
| timeCheckErrorHandler | 时间检查失败的处理                     | /                                                          | function |

## 二元期权的专属配置

| 配置名称     | 配置说明 | 可选值 | 类型   |
| ------------ | -------- | ------ | ------ |
| purchaseTime | 购买时间 | /      | number |
| deliveryTime | 交割时间 | /      | number |

## 配置示例

```javascript
let option = {
  mode: 'pc', //模式,现有mobile和pc
  originalWidth: 400, //画布宽度
  originalHeight: 300, //画布高度
  cPadding: 5,
  data: this.bars,
  container: 'chart_container',
  priceDigitnumber: this.priceDigitNumber,
  tSpace: 30, //字体间距
  interval: this.option.interval || '1m',
  legendColor: '#858ea1',
  axisColor: '#141B36',
  downColor: '#e81d5a',
  upColor: '#03a478',
  chartType: this.option.chartType || 'line',
  yAxisDirection: 'right',
  chartSeries: 'option',
  optionConf: {
    purchaseTime: 50,
    deliveryTime: 10
  },
  loadMoreCallback: () => {
    console.log('加载下一页');
  },
  timeCheckErrorHandler: () => {
    conosle.log('服务器响应超时');
  }
};
```

## API

### `chart.subscribeBars(time,close)`

订阅数据,传入两个值,当前时间和当前收盘价,每次收到新数据都需要执行一次.

### `chart.mark(status)`

二元期权图专属,下单时调用,传入状态,看涨为`"up"`,看跌为`"down"`.
