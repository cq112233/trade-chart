import { createElm, setStyle, genJudgeOptionStatusFn } from '../utils';
import BaseChart from '../BaseChart';
import _Option from '../interface/_Option';
import CandleStatus from '../enum/CandleStatus';

/**
 * @description 二元期权面板类
 * @author 抓住一股仙气 <1013697816@qq.com> HtwoO <1549914423@qq.com>
 * @Date 2021/03/16
 * @version 1.0
 */
let uid = 1;

export default class OptionPanel {
  private container: HTMLElement;
  private originX: number;
  private cPadding: number;
  private chartRightPadding: number;
  private brokenLineColor: string;
  private interval!: number;
  private judgeOptionStatus!: Function;
  private tradingStatus!: {
    prev: number;
    status: string;
    now: number;
    next: number;
  };

  private remainingElement!: HTMLElement;

  private quoteLine!: HTMLElement;
  private quoteRect!: HTMLElement;
  private quoteSpan!: HTMLElement;
  private quoteDot!: HTMLElement;

  private settlementArea!: HTMLElement;
  private settlementOverlay!: HTMLElement;

  private markContainer!: HTMLElement;
  private markerList: any[];

  //可购买时间
  private purchaseTime: number;
  //交割时间
  private deliveryTime: number;
  //上一把剩余多久交割,单位为秒
  private remainingDeliveryTime: number = 0;

  private option: _Option;

  constructor(
    container: HTMLElement,
    originX: number,
    cPadding: number,
    chartRightPadding: number,
    brokenLineColor: string,
    option: _Option
  ) {
    this.container = container;
    this.originX = originX;
    this.cPadding = cPadding;
    this.chartRightPadding = chartRightPadding;
    this.brokenLineColor = brokenLineColor;

    this.markerList = [];
    this.option = option;

    this.purchaseTime = this.option.optionConf.purchaseTime;
    this.deliveryTime = this.option.optionConf.deliveryTime;

    this.createInfoElement(this.container);
    this.createSettlementElement(this.container);
  }

  //创建 行情线,时间线,呼吸灯等
  createInfoElement(container: HTMLElement) {
    let infoContainer = document.getElementById('infoContainer');
    if (!infoContainer) {
      infoContainer = createElm('div');
      infoContainer.id = 'infoContainer';
    }
    this.drawQuoteLine(infoContainer);
    this.drawRemainingElement(infoContainer);
    //创建遮罩层
    this.createSettlementOverlay(infoContainer);
    container.appendChild(infoContainer);
  }

  //创建结算区域
  createSettlementElement(container: HTMLElement) {
    if (!this.settlementArea) {
      this.settlementArea = createElm('div', { id: 'settlementArea' });
    }
    //判断当前交易状态
    this.interval =
      (this.option.optionConf.deliveryTime +
        this.option.optionConf.purchaseTime) /
      60;
    this.judgeOptionStatus = genJudgeOptionStatusFn(
      this.option.optionConf.startMin,
      this.interval,
      this.purchaseTime
    );
    let now = new Date();
    let nowMinWithSec = now.getMinutes() + now.getSeconds() / 60;
    this.updateTradingStatus(nowMinWithSec);

    this.calcSettlementPosition(nowMinWithSec);

    container.append(this.settlementArea);
  }

  //创建遮罩层
  createSettlementOverlay(container: HTMLElement) {
    if (!this.settlementOverlay) {
      this.settlementOverlay = createElm('div');
      this.settlementOverlay.id = 'settlementOverlay';
    }
    setStyle(this.settlementOverlay, {
      width: (this.option.width - this.chartRightPadding) / 2 + 'px',
      height: this.option.height / 2 + 'px'
    });
    container.appendChild(this.settlementOverlay);
  }

  //绘制行情线
  drawQuoteLine(infoContainer: HTMLElement) {
    this.quoteLine = createElm('div', { id: 'quoteLine' });
    this.quoteRect = createElm('div', { id: 'quoteRect' });
    this.quoteSpan = createElm('span', { id: 'quoteSpan' });
    this.quoteDot = createElm('i', { id: 'quoteDot' });

    const { x, y } = this.getCoordinateByPrice();
    const close = this.getPrice();

    //行情线
    setStyle(this.quoteLine, {
      width: this.option.width / 2 + 'px',
      top: y / 2 + 'px'
    });

    //呼吸灯
    setStyle(this.quoteDot, {
      top: y / 2 + 'px',
      left: isNaN(x)
        ? (this.option.width - this.chartRightPadding) / 2 + 'px'
        : x / 2 + 'px',
      // left: (this.option.width - this.chartRightPadding) / 2 + 'px',
      backgroundColor: this.brokenLineColor
    });

    //行情线右边的矩形
    setStyle(this.quoteRect, {
      top: y / 2 + 'px',
      left: (100 + BaseChart.yAxisLegendTextLength) / 2 + 'px'
    });

    this.quoteSpan.innerHTML = close.toString();

    infoContainer.appendChild(this.quoteLine);
    infoContainer.appendChild(this.quoteDot);
    infoContainer.appendChild(this.quoteRect);
    this.quoteRect.appendChild(this.quoteSpan);
  }

  //绘制剩余时间
  drawRemainingElement(infoContainer: HTMLElement) {
    this.remainingElement = createElm('div', { id: 'remainingElement' });
    let icon = createElm('i');
    let text = createElm('span');

    text.innerHTML = '0';
    this.remainingElement.appendChild(icon);
    this.remainingElement.appendChild(text);
    infoContainer.appendChild(this.remainingElement);
  }

  //获取行情线坐标
  getCoordinateByPrice(close?: number) {
    const length = BaseChart.allData.length;
    const lastIndex = length - 1;
    const lastCandle = BaseChart.allData[lastIndex];

    const x = (lastCandle.leftCoordinate + lastCandle.rightCoordinate) / 2;
    const candlWidth = lastCandle.rightCoordinate - lastCandle.leftCoordinate;
    const y =
      ((BaseChart.maxVal - (close || lastCandle.close)) /
        (BaseChart.maxVal - BaseChart.minVal)) *
      (this.option.height - 2 * this.cPadding);
    return { x, y, candlWidth, time: lastCandle.time };
  }

  getPrice(): number {
    const length = BaseChart.allData.length;
    const lastIndex = length - 1;
    const lastCandle = BaseChart.allData[lastIndex];
    return lastCandle.close;
  }

  //标记
  mark(type: CandleStatus) {
    //交割中无法标记
    if (
      this.tradingStatus.status === 'delivering' &&
      this.option.markFailHandler
    ) {
      this.option.markFailHandler();
      return;
    }

    const { x, y, time } = this.getCoordinateByPrice(); //和当前的行情线坐标一致
    let markerEl = createElm('mark');
    let markPriceLine = createElm('div', { className: 'markPriceLine' });
    let markPriceSpan = createElm('span', { className: 'markPriceSpan' });

    let marker = {
      uid: uid++,
      width: 68,
      height: 40,
      price: this.getPrice(),
      x: x,
      y: y,
      el: markerEl,
      createTime: time,
      children: {
        markPriceLine,
        markPriceSpan
      },
      type
    };

    this.setMarkerStyle(marker);
    this.markerList.push(marker);

    this.patchMarker(marker);
  }

  //设置marker的样式
  setMarkerStyle(marker: any) {
    //涨跌情况
    let bgColor =
      marker.type === CandleStatus.down
        ? this.option.downColor
        : this.option.upColor;

    setStyle(marker.el, {
      left: marker.x / 2 + 'px',
      top: marker.y / 2 + 'px',
      backgroundImage: `url(${
        marker.type === CandleStatus.down
          ? require('../mark_down.png')
          : require('../mark_up.png')
      })`,
      opacity: marker.x ? '1' : '0'
    });

    //行情文字
    setStyle(marker.children.markPriceSpan, {
      backgroundColor: bgColor,
      width: BaseChart.yAxisLegendTextLength / 2 + 'px',
      height: BaseChart.TimeHorizonHeight / 2 + 'px',
      left: (this.option.width - BaseChart.yAxisLegendTextLength) / 2 + 'px',
      top: marker.y / 2 + 'px',
      opacity: marker.x ? '1' : '0'
    });
    marker.children.markPriceSpan.innerHTML = marker.price.toString();
    //行情线
    setStyle(marker.children.markPriceLine, {
      width: this.option.width / 2 + 'px',
      left: 0 + 'px',
      top: marker.y / 2 + 'px',
      backgroundColor: bgColor,
      opacity: marker.x ? '1' : '0'
    });
  }

  //更新
  update() {
    this.updateQuoteLine();
    this.updateMarkers();
    this.updateSettlementArea();
  }

  //更新所有的标记
  updateMarkers() {
    if (!this.markerList.length) return;

    this.markerList.forEach((marker, index, list) => {
      //获取实时坐标
      const { x, y } = this.fetchMarkerCoordinate(list[index]);

      list[index].x = x;
      list[index].y = y;

      this.setMarkerStyle(list[index]);
    });
  }

  //更新行情线
  updateQuoteLine() {
    const { x, y } = this.getCoordinateByPrice();
    const close = this.getPrice();
    setStyle(this.quoteLine, {
      top: y / 2 + 'px'
    });
    setStyle(this.quoteDot, {
      top: y / 2 + 'px',
      left: x / 2 + 'px'
    });
    setStyle(this.quoteRect, {
      top: y / 2 + 'px'
    });
    this.quoteSpan.innerHTML = close.toString();
  }

  //更新结算框体
  updateSettlementArea() {
    let now = new Date();
    let nowMinWithSec = now.getMinutes() + now.getSeconds() / 60;
    this.updateTradingStatus(nowMinWithSec);

    //清空 marker
    if (
      this.tradingStatus.status === 'end' ||
      this.tradingStatus.status === 'start'
    ) {
      this.flushMarker();
    }
    this.calcSettlementPosition(nowMinWithSec);
  }

  //更新交割遮罩层
  updateSettlementOverlay(leftPosition: number, candlWidth: number) {
    if (
      Number(leftPosition.toFixed(1)) <=
      this.option.width - this.chartRightPadding - candlWidth / 2
    ) {
      //进入交割期
      setStyle(this.settlementOverlay, {
        opacity: '1',
        width:
          (this.option.width -
            this.chartRightPadding -
            BaseChart.yAxisLegendTextLength +
            candlWidth) /
            2 +
          'px'
        // width: leftPosition / 2 + candlWidth / 2 + 'px'
      });
    } else {
      setStyle(this.settlementOverlay, {
        opacity: '0',
        width: (this.option.width - this.chartRightPadding) / 2 + 'px'
      });
    }
  }

  //更新交易状态
  updateTradingStatus(nowMinWithSec: number) {
    let tradingStatus = (this.tradingStatus = this.judgeOptionStatus(
      nowMinWithSec
    ));
    this.updateRemainingElement();

    //调用回调函数
    if (
      tradingStatus.status === 'delivering' &&
      this.option.deliveringCallback
    ) {
      let remaining;
      if (tradingStatus.next >= nowMinWithSec) {
        remaining = tradingStatus.next * 60 - nowMinWithSec * 60;
      } else {
        remaining = 3600 - nowMinWithSec * 60;
      }
      this.option.deliveringCallback(remaining);
    } else if (tradingStatus.status === 'end') {
      this.remainingDeliveryTime = 0;
      //重置状态生成器函数 防止跳过交割期用户的周期和没跳过交割期用户的周期对不上的问题
      this.judgeOptionStatus = genJudgeOptionStatusFn(
        this.option.optionConf.startMin,
        this.interval,
        this.purchaseTime
      );
    }
  }

  //更新剩余时间
  updateRemainingElement() {
    let { now, next } = this.tradingStatus;
    if (next < now) {
      next += 60;
    }
    let remaining = ((next - now) * 60).toFixed(0);
    let span = document.querySelector(
      '.__tcContainer__ #remainingElement span'
    );
    if (span instanceof HTMLElement) {
      span.innerHTML = remaining;
    }
  }

  //获取marker当前的x坐标
  fetchMarkerCoordinate(marker: any) {
    const foundCandle = BaseChart.showData.find(
      canlde => canlde.time === marker.createTime
    );
    let x = 0;
    const y =
      ((BaseChart.maxVal - marker.price) /
        (BaseChart.maxVal - BaseChart.minVal)) *
      (this.option.height - 2 * this.cPadding);

    if (
      foundCandle &&
      foundCandle.leftCoordinate &&
      foundCandle.rightCoordinate
    ) {
      x = foundCandle.leftCoordinate;
    }

    return { x, y };
  }

  //patch marker to dom
  patchMarker(marker: any) {
    //create container
    if (!this.markContainer) {
      this.markContainer = createElm('div');
      this.markContainer.id = 'markContainer';
      this.container.appendChild(this.markContainer);
    }

    //set style
    setStyle(marker.el, {
      left: marker.x / 2 + 'px',
      top: marker.y / 2 + 'px'
    });

    this.markContainer.appendChild(marker.el);
    this.markContainer.appendChild(marker.children.markPriceLine);
    this.markContainer.appendChild(marker.children.markPriceSpan);
    marker.el.innerHTML = marker.uid;
  }

  //清空marker
  flushMarker() {
    if (this.markContainer) {
      this.markContainer.innerHTML = '';
    }
    uid = 1;
    this.markerList = [];
  }

  //计算结算框体的定位
  calcSettlementPosition(nowMinWithSec: number) {
    let { prev } = this.tradingStatus;
    // if (prev > nowMinWithSec) prev -= 60;
    let { candlWidth } = this.getCoordinateByPrice();
    //步长
    let stepLength =
      (this.chartRightPadding -
        BaseChart.yAxisLegendTextLength +
        candlWidth / 2) /
      (this.deliveryTime + this.purchaseTime + this.remainingDeliveryTime);
    //当前步数
    let step = nowMinWithSec * 60 - prev * 60;

    //框体宽度
    let width = this.deliveryTime * stepLength;
    //定位
    let leftPosition =
      this.option.width -
      width -
      BaseChart.yAxisLegendTextLength -
      step * stepLength;

    this.updateSettlementOverlay(leftPosition, candlWidth);
    setStyle(this.settlementArea, {
      height: this.option.height / 2 + 'px',
      width: width / 2 + 'px',
      left: leftPosition / 2 + 'px'
    });
  }

  //跳过交割期,将当前的交割期并入下一周期的购买时间内
  skipDelivery() {
    if (this.tradingStatus.status !== 'delivering') return;
    let { next, now } = this.tradingStatus;
    let remaining = next < now ? next + 60 - now : next - now;
    this.remainingDeliveryTime = remaining * 60;
    //重新生成判断函数
    this.judgeOptionStatus = genJudgeOptionStatusFn(
      now,
      this.interval + remaining,
      this.purchaseTime + this.remainingDeliveryTime
    );
  }
}
