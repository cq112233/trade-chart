import BaseChart from './BaseChart';
import _Option from './interface/_Option';
import InfoContainerPosition from './enum/InfoContainerPosition';
import { createElm } from './utils';
import QuotePanel from './quoteChart/QuotePanel';

/**
 * @description 鼠标坐标轴图表类
 * @author 抓住一股仙气 <1013697816@qq.com> HtwoO <1549914423@qq.com>
 * @Date 2020/12/03
 * @version 3.1
 */

class CursorChart extends BaseChart {
  private quotePanel: QuotePanel;

  constructor(container: HTMLElement, option: _Option) {
    super(container, option);
    this.option = option;
    this.createCanvasElement(container);
    this.ctx = this.canvas.getContext('2d');
    this.quotePanel = new QuotePanel(this.container, option);
  }

  createCanvasElement(container: HTMLElement) {
    this.canvas = createElm('canvas');

    //高清化处理
    this.canvas.height = this.option.height;
    this.canvas.width = this.option.width;
    this.canvas.style.width = this.option.originalWidth + 'px';
    this.canvas.style.height = this.option.originalHeight + 'px';

    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.zIndex = '10';
    container.appendChild(this.canvas);
  }

  //调十字函数
  canvasMouseMove(e: any, a = true) {
    this.clearCanvas();
    let X = 0;
    let Y = 0;
    let offsetX, offsetY;
    if (e.offsetX) {
      offsetX = e.offsetX;
      offsetY = e.offsetY;
    } else {
      offsetX = e.touches[0].clientX;
      offsetY = e.touches[0].clientY - this.container.getBoundingClientRect().y;
    }
    for (let i = 0; i < BaseChart.showData.length; i++) {
      let item = BaseChart.showData[i];
      if (
        offsetX * 2 < item.rightCoordinate &&
        offsetX * 2 >= item.leftCoordinate - BaseChart.candleMargin
      ) {
        X =
          (item.rightCoordinate / 2 - item.leftCoordinate / 2) / 2 +
          item.leftCoordinate / 2;
        Y = offsetY;
      }
    }
    if (Y >= 5 && Y <= this.container.clientHeight - 10) {
      this.drawCrossAxis(X * 2, Y * 2);
    }
  }

  canvasMouseDown(e: MouseEvent | TouchEvent) {
    this.clearCanvas();
    let X = 0,
      Y = 0;
    for (let i = 0; i < BaseChart.showData.length; i++) {
      let item = BaseChart.showData[i];
      let offsetX;
      let offsetY;
      if ('touches' in e) {
        offsetX = e.touches[0].clientX;
      } else {
        offsetX = e.offsetX;
      }
      if ('touches' in e) {
        offsetY =
          e.touches[0].clientY - this.container.getBoundingClientRect().y;
      } else {
        offsetY = e.offsetY;
      }
      if (
        offsetX * 2 < item.rightCoordinate &&
        offsetX * 2 >= item.leftCoordinate - BaseChart.candleMargin
      ) {
        X =
          (item.rightCoordinate / 2 - item.leftCoordinate / 2) / 2 +
          item.leftCoordinate / 2;
        Y = offsetY;
      }
    }
    this.findCurCandle(X * 2);
    if (Y >= 5 && Y <= this.container.clientHeight - 10) {
      this.drawCrossAxis(X * 2, Y * 2);
    }
    this.drawCurCandleBg(
      document.getElementById('curCandleOHLCInfoContainer') != null
    );
  }

  /**
   * 绘制十字坐标轴
   * @param x
   * @param y
   */
  drawCrossAxis(x: number, y: number) {
    if (this.option.mode === 'pc') {
      this.clearCanvas();
      this.findCurCandle(x);
      this.drawCurCandleBg(
        document.getElementById('curCandleOHLCInfoContainer') != null
      );
    }
    this.drawLine(0, y, this.option.width, y, {
      dottal: { x: 5, y: 5 },
      color: '#fff',
      width: 1
    });
    if (BaseChart.chartType === 'line') {
      this.drawLine(x, 0, x, this.option.height, {
        dottal: { x: 5, y: 5 },
        color: '#fff',
        width: 1
      });
    }
    this.ctx.stroke();
    this.drawXLegend(x);
    this.drawYLegend(y);
  }

  //绘制x轴实时文本
  drawXLegend(x: number) {
    if (BaseChart.curCandle) {
      let text = this.dateFormat(
        'dd-mm-YYYY HH:MM',
        new Date(Number(BaseChart.curCandle.time))
      );
      let rectWidth = text.length * 12;
      let y = this.option.height - this.cPadding - BaseChart.TimeHorizonHeight;

      this.drawRect(
        x - rectWidth / 2,
        y,
        rectWidth,
        BaseChart.TimeHorizonHeight,
        {
          fillStyle: '#5e606d'
        }
      );
      this.ctx.font = '20px Arial';
      this.ctx.fillStyle = '#fff';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(
        text,
        x,
        this.option.height - this.cPadding - BaseChart.TimeHorizonHeight / 2
      );
    }
  }

  //绘制y轴实时文本
  drawYLegend(y: number) {
    let X = this.originX + this.option.width;
    let diff = BaseChart.maxVal - BaseChart.minVal;
    let height = this.option.height - 2 * this.cPadding;
    let text = (BaseChart.maxVal - (y * diff) / height).toFixed(
      this.option.priceDigitnumber
    );
    this.drawRect(
      X - BaseChart.yAxisLegendTextLength,
      y - BaseChart.TimeHorizonHeight / 2,
      BaseChart.yAxisLegendTextLength,
      BaseChart.TimeHorizonHeight,
      {
        fillStyle: '#5e606d'
      }
    );
    this.ctx.font = '20px Arial';
    this.ctx.fillStyle = '#fff';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, X - BaseChart.yAxisLegendTextLength / 2, y);
  }

  //绘制当前蜡烛背景色
  drawCurCandleBg(bool: boolean) {
    if (BaseChart.chartType !== 'candle') {
      return;
    }
    if (!bool) {
      return;
    }
    if (!BaseChart.curCandle.leftCoordinate) {
      return;
    }
    let linearGradient = this.ctx.createLinearGradient(
      BaseChart.curCandle.leftCoordinate,
      0,
      BaseChart.curCandle.leftCoordinate,
      this.option.height - this.cPadding
    );
    linearGradient.addColorStop(0, 'rgba(0,0,0,0.2)');
    linearGradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
    linearGradient.addColorStop(1, 'rgba(0,0,0,0.2)');
    this.drawRect(
      BaseChart.curCandle.leftCoordinate,
      0,
      BaseChart.curCandle.rightCoordinate - BaseChart.curCandle.leftCoordinate,
      this.option.height - this.cPadding,
      { fillStyle: linearGradient }
    );
  }

  //定位当前鼠标所指的蜡烛，绘制信息面板
  findCurCandle(x: number) {
    BaseChart.isTimeToUpdateCurCandle = true;
    for (let i = 0; i < BaseChart.showData.length; i++) {
      let item = BaseChart.showData[i];
      if (
        //@ts-ignore
        x < item.rightCoordinate &&
        //@ts-ignore
        x >= item.leftCoordinate - BaseChart.candleMargin
      ) {
        /**
         *  如果当前鼠标所指的不是最后一根蜡烛(最后一根蜡烛会实时更新)
         *  就不需要自动更新当前鼠标所指的蜡烛
         */
        if (i !== BaseChart.showData.length - 1) {
          BaseChart.isTimeToUpdateCurCandle = false;
        }
        /**
         *  如果当前鼠标坐标小于屏幕宽度的一半，面板显示在右边
         *  如果当前鼠标坐标大于屏幕宽度的一半，面板显示在左边
         */
        if (i < BaseChart.showData.length / 2) {
          BaseChart.infoContainerPosition = InfoContainerPosition.right;
        } else {
          BaseChart.infoContainerPosition = InfoContainerPosition.left;
        }
        /**
         * 如果是PC模式且当前找到的蜡烛不同于上一次找到的就更新+绘制
         * 如果是手机就直接更新+绘制
         */
        if (
          this.option.mode === 'pc' &&
          BaseChart.curCandle &&
          BaseChart.curCandle.time !== item.time
        ) {
          //更新当前蜡烛信息
          BaseChart.curCandle = item;
          //如果是蜡烛图，才需要绘制当前蜡烛信息面板
          if (BaseChart.chartType === 'candle') {
            this.quotePanel.drawCurCandleOHLCInfo();
            this.quotePanel.drawCurCandleMAInfo();
          }
        } else if (this.option.mode === 'mobile') {
          BaseChart.curCandle = item;
          if (BaseChart.chartType === 'candle') {
            this.quotePanel.drawCurCandleOHLCInfo();
            this.quotePanel.drawCurCandleMAInfo();
          }
        }
        break;
      }
    }

    this.quotePanel.updateCurCandleInfo();
  }
}

export default CursorChart;
