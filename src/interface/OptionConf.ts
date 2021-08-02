/**
 * 期权图表的配置选项
 */

export default interface OptionConf {
  purchaseTime: number; //购买时间 单位为秒
  deliveryTime: number; //交割时间 单位为秒
  startMin: number; //第一盘开始的时间 单位为分钟
}
