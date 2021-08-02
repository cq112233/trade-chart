import { createElm, setStyle } from '../utils';
import BaseChart from '../BaseChart';
import _Option from '../interface/_Option';

/**
 * @description 行情面板类
 * @author 抓住一股仙气 <1013697816@qq.com> HtwoO <1549914423@qq.com>
 * @Date 2020/11/09
 * @version 3.1
 */

export default class QuotePanel {
  private curCandleMAContainer!: HTMLElement;
  private curCandleOHLCInfoContainer!: HTMLElement | null;
  private infoContainerPosition!: string;
  private container: HTMLElement;
  private option: _Option;

  constructor(container: HTMLElement, option: _Option) {
    this.container = container;
    this.option = option;
  }

  createInfoElement(id: string) {
    let infoContainer = createElm('div');
    infoContainer.id = id;
    setStyle(infoContainer, {
      minWidth: '25%',
      background: '#1D2027',
      border: '#eee',
      padding: '6px 5px',
      display: 'flex',
      flexDirection: 'column',
      position: 'absolute',
      top: '7%'
    });

    if (this.infoContainerPosition === 'left') {
      setStyle(infoContainer, {
        left: '2%'
      });
    } else {
      setStyle(infoContainer, {
        right: '2%'
      });
    }
    return infoContainer;
  }

  //更新当前鼠标所指蜡烛的信息
  updateCurCandleInfo() {
    if (BaseChart.isTimeToUpdateCurCandle) {
      BaseChart.curCandle = BaseChart.allData[BaseChart.allData.length - 1];
      this.drawCurCandleMAInfo();

      if (this.curCandleOHLCInfoContainer) {
        setStyle(this.curCandleOHLCInfoContainer, {
          color: BaseChart.curCandle.status === 'up' ? '#57CF8D' : '#EB2F34'
        });

        this.appendCurCandleOHLCInfo();
      }
    }
  }

  //绘制当前蜡烛的MA信息
  drawCurCandleMAInfo() {
    if (BaseChart.chartType !== 'candle') {
      return;
    }

    if (!document.getElementById('curCandleMAContainer')) {
      //ma线盒子
      this.curCandleMAContainer = createElm('div');
      this.curCandleMAContainer.setAttribute('id', 'curCandleMAContainer');
      setStyle(this.curCandleMAContainer, {
        position: 'absolute',
        marginTop: '5px',
        display: 'flex',
        top: '0%',
        left: '2%',
        userSelect: 'none'
      });

      this.patchCurCandleMAInfo(this.curCandleMAContainer);

      this.container.appendChild(this.curCandleMAContainer);
    } else {
      //@ts-ignore
      this.curCandleMAContainer = this.container.querySelector(
        '#curCandleMAContainer'
      );
      this.curCandleMAContainer.innerHTML = '';
      this.patchCurCandleMAInfo(this.curCandleMAContainer);
    }
  }

  //将当前蜡烛的MA信息加入DOM
  patchCurCandleMAInfo(element: HTMLElement) {
    let html = '';
    if (this.option.MA && this.option.MA.length) {
      for (let i = 0; i < this.option.MA.length; i++) {
        let MAInfo = this.option.MA[i];
        if (BaseChart.curCandle['MA' + MAInfo.interval]) {
          html += `
        <div style="color: ${
          MAInfo.color
        };text-align: left;margin-top: 5px;margin-right:8px">
            MA${MAInfo.interval}: ${BaseChart.curCandle['MA' + MAInfo.interval]}
        </div>
        `;
        } else {
          html += `
        <div style="color: ${MAInfo.color};text-align: left;margin-top: 5px;margin-right:8px">
             MA${MAInfo.interval} : -- --
        </div>
        `;
        }
      }
      element.innerHTML = html;
    }
  }

  //绘制当前蜡烛的开高低收信息
  drawCurCandleOHLCInfo() {
    if (!this.curCandleOHLCInfoContainer) {
      //如果没有找到Container元素就新建
      this.curCandleOHLCInfoContainer = this.createInfoElement(
        'curCandleOHLCInfoContainer'
      );

      setStyle(this.curCandleOHLCInfoContainer, {
        color: BaseChart.curCandle.status === 'up' ? '#57CF8D' : '#EB2F34',
        userSelect: 'none'
      });

      this.appendCurCandleOHLCInfo();
      this.container.appendChild(this.curCandleOHLCInfoContainer);
    } else if (this.option.mode === 'mobile') {
      this.container.removeChild(this.curCandleOHLCInfoContainer);
      this.curCandleOHLCInfoContainer = null;
    } else {
      //如果找到到Container元素就覆盖到Container元素的innerHTML

      setStyle(this.curCandleOHLCInfoContainer, {
        color: BaseChart.curCandle.status === 'up' ? '#57CF8D' : '#EB2F34'
      });

      if (BaseChart.infoContainerPosition === 'left') {
        setStyle(this.curCandleOHLCInfoContainer, {
          right: 'unset',
          left: '2%'
        });
      } else {
        setStyle(this.curCandleOHLCInfoContainer, {
          left: 'unset',
          right: '2%'
        });
      }
      this.appendCurCandleOHLCInfo();
    }
  }

  //将当前蜡烛的开高低收信息加入DOM
  appendCurCandleOHLCInfo() {
    let profit = BaseChart.curCandle.close - BaseChart.curCandle.open;
    let change = profit / BaseChart.curCandle.open;
    if (this.curCandleOHLCInfoContainer)
      this.curCandleOHLCInfoContainer.innerHTML = `
        <div style="flex:1;display:flex; width:100%;justify-content:space-between;">
        <span>Open:</span>
        <span>${BaseChart.curCandle.open}</span>
        </div>
        <div style="flex:1;display:flex;width:100%;justify-content:space-between;">
        <span>High:</span>
        <span>${BaseChart.curCandle.high}</span>
       </div>
        <div style="flex:1;display:flex;width:100%;justify-content:space-between;">
        <span>Low:</span>
        <span>${BaseChart.curCandle.low}</span>
       </div>
        <div style="flex:1;display:flex;width:100%;justify-content:space-between;">
        <span>Close:</span>
        <span>${BaseChart.curCandle.close}</span>
        </div>
        <div style="flex:1;display:flex;width:100%;justify-content:space-between;">
        <span>change:</span>
        <span>${profit > 0 ? '+' : ''}${profit.toFixed(
        this.option.priceDigitnumber
      )}</span>
        </div>
        <div style="flex:1;display:flex;width:100%;justify-content:space-between;">
        <span>change%:</span>
        <span>${change > 0 ? '+' : ''}${(change * 100).toFixed(2)}%</span>
      </div>
      `;
  }
}
