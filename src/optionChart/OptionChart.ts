import BaseChart from '../BaseChart'
import _Option from '../interface/_Option'
import Candle from '../interface/Candle'
import Chart from '../interface/Chart'
import OptionPanel from './OptionPanel'
import { createElm } from '../utils'
import CandleStatus from '../enum/CandleStatus'
import TradeChart from '../TradeChart'

/**
 * @description 二元期权图表类
 * @author 抓住一股仙气 <1013697816@qq.com> HtwoO <1549914423@qq.com>
 * @Date 2021/03/01
 * @version 1.0
 */
class OptionChart extends BaseChart implements Chart {
  // 线性背景开始颜色
  lineBgColorBegin: string
  // 线性背景结束颜色
  lineBgColorEnd: string
  //折线颜色
  BrokenLineColor: string
  //y轴图例个数
  yLegendNum: number
  //x轴图例个数
  xLegendNum: number
  //上一次鼠标所在的X轴坐标
  lastClientX: number
  //最右边蜡烛的偏移值
  // 正数是向右偏移数量
  // 负数是向左偏移数量
  rightCandleOffset: number
  //最左边蜡烛的偏移值
  leftCandleOffset: number
  //蜡烛数量
  candleNum: number
  //蜡烛的宽
  candleWidth: number
  container: HTMLElement
  optionPanel: OptionPanel
  lastDiff = 0

  constructor(container: HTMLElement, option: _Option) {
    super(container, option)

    this.container = container
    this.createCanvasElement(container)
    this.ctx = this.canvas.getContext('2d')
    this.lineBgColorBegin =
      this.option.lineBgColorBegin || 'rgba(36,145,227,0.6)'
    this.lineBgColorEnd = this.option.lineBgColorEnd || 'rgba(36,145,227,0.2)'
    this.BrokenLineColor = this.option.BrokenLineColor || '#3696F3'

    this.yLegendNum = 10
    BaseChart.legendYMargin =
      (this.option.height - 4 * this.option.cPadding) / (this.yLegendNum - 1) //每个间距
    this.xLegendNum = 7
    this.lastClientX = 0
    this.rightCandleOffset = 0
    this.leftCandleOffset = 0

    this.chartRightPadding =
      this.option.mode === 'mobile'
        ? this.option.width * 0.34
        : this.option.width * 0.5
    this.formatData()
    //此时在屏幕上显示的数据
    BaseChart.showData = BaseChart.allData.slice(-200)
    this.candleNum = BaseChart.showData.length
    //文字大小？
    this.candleWidth =
      (this.option.width -
        this.chartRightPadding -
        (3 * this.cPadding - BaseChart.candleMargin) -
        BaseChart.candleMargin * (this.candleNum - 1)) /
      this.candleNum
    this.ctx.font = '24px Arial'
    this.ctx.textAlign = 'end'

    //初始化期权元素
    this.optionPanel = new OptionPanel(
      this.container,
      this.originX,
      this.cPadding,
      this.chartRightPadding,
      this.BrokenLineColor,
      this.option
    )

    this.drawChart()
  }

  //创建canvas元素
  createCanvasElement(container: HTMLElement) {
    this.canvas = createElm('canvas')
    //高清化处理
    this.canvas.height = this.option.height
    this.canvas.width = this.option.width
    this.canvas.style.width = this.option.originalWidth + 'px'
    this.canvas.style.height = this.option.originalHeight + 'px'

    container.appendChild(this.canvas)
  }

  formatData() {
    BaseChart.allData.forEach((item, index, arr) => {
      arr[index].formatedTime = this.dateFormat(
        'MM:SS',
        new Date(Number(item.time))
      )
    })
  }

  //绘制图表
  drawChart() {
    this.clearCanvas()
    this.getYlegend()
    this.drawCandles()
    this.drawAxis()
    this.drawGrid(15)
    this.optionPanel.update()
  }

  // 绘制网格
  drawGrid(interval: number) {
    let endTime: any = BaseChart.showData[BaseChart.showData.length - 1].time
    let startTime: any = BaseChart.showData[0].time
    let diffTime = (endTime - startTime) / 1000
    let diffTimeNum = Math.ceil(diffTime / interval)
    console.log(this.dateFormat('MM:SS', new Date(endTime)))
    // 显示区域的15s的总宽度
    let showDateWidth =
      this.option.width -
      this.chartRightPadding -
      // this.originX -
      BaseChart.yAxisLegendTextLength
    // this.candleWidth -
    // this.originX +
    // BaseChart.candleMargin;

    //每15s的宽度
    let diffTimeNumlWidth = showDateWidth / diffTimeNum
    //图标中15s X轴总条数
    // let diffTimeNumTotalNum: any =
    //   (this.option.width - this.originX - BaseChart.yAxisLegendTextLength) /
    //   diffTimeNumlWidth;
    // if (isNaN(diffTimeNumTotalNum)) return;
    // console.log(BaseChart.allData[BaseChart.allData.length - 1].leftCoordinate);
    // 开始画的坐标
    let startlocation =
      (BaseChart.showData[BaseChart.showData.length - 1].rightCoordinate +
        BaseChart.showData[BaseChart.showData.length - 1].leftCoordinate) /
      2
    this.ctx.font = '20px Arial'
    this.ctx.textAlign = 'center'

    this.ctx.fillStyle = this.option.legendColor
    // 绘制x轴 显示时间

    for (let index = 0; index <= diffTimeNum + 1; index++) {
      // 每15s显示的间隔时间
      let showTime = endTime - interval * 1000 * index
      this.drawLine(
        startlocation - index * diffTimeNumlWidth,
        0,
        startlocation - index * diffTimeNumlWidth,
        this.option.height - this.originX,
        {
          color: '#4A5269',
          width: 2,
          dottal: { x: 10, y: 5 }
        }
      )
      // 画时间间隔
      this.ctx.fillText(
        this.dateFormat('MM:SS', new Date(showTime)), //@ts-ignore
        startlocation - index * diffTimeNumlWidth,
        this.option.height - this.option.cPadding
      )
    }

    diffTimeNum = this.chartRightPadding / diffTimeNumlWidth

    for (let index = 1; index <= diffTimeNum + 1; index++) {
      // 每15s显示的间隔时间
      let showTime = endTime + interval * 1000 * index
      this.drawLine(
        startlocation + index * diffTimeNumlWidth,
        0,
        startlocation + index * diffTimeNumlWidth,
        this.option.height - this.originX,
        {
          color: '#4A5269',
          width: 2,
          dottal: { x: 10, y: 5 }
        }
      )
      // 画时间间隔
      this.ctx.fillText(
        this.dateFormat('MM:SS', new Date(showTime)), //@ts-ignore
        startlocation + index * diffTimeNumlWidth,
        this.option.height - this.option.cPadding
      )
    }
    // 绘制y轴
    for (let index = 1; index < this.yLegendNum - 1; index++) {
      this.drawLine(
        0,
        index * BaseChart.legendYMargin,
        this.option.width - BaseChart.yAxisLegendTextLength,
        this.originX + index * BaseChart.legendYMargin,
        {
          color: '#4A5269',
          width: 2,
          dottal: { x: 10, y: 5 }
        }
      )
    }
    this.ctx.stroke()
  }

  //获取y轴最大最小值
  getYlegend() {
    BaseChart.maxVal = 0
    BaseChart.minVal = 9999999
    BaseChart.showData.forEach((item) => {
      if (item.high > BaseChart.maxVal) {
        BaseChart.maxVal = Number(item.high)
      }
      if (item.low < BaseChart.minVal) {
        BaseChart.minVal = Number(item.low)
      }
    })
    let diff = BaseChart.maxVal - BaseChart.minVal
    BaseChart.maxVal += diff * 0.15
    BaseChart.minVal -= diff * 0.05
    BaseChart.yAxisLegendTextLength =
      BaseChart.maxVal.toFixed(this.option.priceDigitnumber).length * 12
  }

  //绘制坐标轴
  drawAxis() {
    // 绘制x轴
    this.drawLine(
      this.originX,
      this.originY,
      this.option.width - this.option.cPadding,
      this.originY,
      {
        color: this.option.axisColor
      }
    )

    // 绘制y轴
    this.drawLine(
      this.originX,
      this.originY,
      this.originX,
      this.option.cPadding,
      { color: this.option.axisColor }
    )
    this.drawYAxis()
    this.drawXAxis()
  }

  //绘制y轴
  drawYAxis() {
    this.ctx.beginPath()
    let legendDiff =
      (BaseChart.maxVal - BaseChart.minVal) / (this.yLegendNum - 1) //每个图例间隔值

    this.ctx.fillStyle = this.option.legendColor

    for (let index = 0; index < this.yLegendNum; index++) {
      const y =
        this.originY - BaseChart.tHeight - BaseChart.legendYMargin * index
      const textContet = (BaseChart.minVal + index * legendDiff).toFixed(
        this.option.priceDigitnumber
      )

      this.ctx.font = '20px Arial'
      if (
        this.option.yAxisDirection === 'left' ||
        !this.option.yAxisDirection
      ) {
        this.ctx.fillText(textContet, this.originX, y)
      } else if (this.option.yAxisDirection === 'right') {
        this.ctx.textBaseline = 'top'
        this.ctx.textAlign = 'right'
        this.ctx.fillText(
          textContet,
          this.option.width - this.option.cPadding,
          y
        )
      }
      this.ctx.textBaseline = 'alphabetic'
    }
  }

  //绘制x轴
  drawXAxis() {
    let interval = Math.round(BaseChart.showData.length / this.xLegendNum) + 1 //间隔数
    this.ctx.textAlign = 'center'
    for (let index = 0; index < BaseChart.showData.length; index += interval) {
      let candle = BaseChart.showData[index]

      // if (candle.formatedTime) {
      //   this.ctx.fillText(
      //     candle.formatedTime, //@ts-ignore
      //     // candle.leftCoordinate + //@ts-ignore
      //     (candle.rightCoordinate + candle.leftCoordinate) / 2,
      //     this.option.height - this.option.cPadding
      //   );
      // }
    }
  }

  //绘制阴阳线
  drawCandlestick(item: Candle, index: number) {
    this.ctx.beginPath()

    this.ctx.lineWidth = 3
    let x =
      this.originX +
      this.option.cPadding +
      index * this.candleWidth +
      (index - 1) * BaseChart.candleMargin +
      this.candleWidth / 2

    let y =
      ((BaseChart.maxVal - item.high) / (BaseChart.maxVal - BaseChart.minVal)) *
      (this.option.height - this.option.cPadding)
    let Y =
      ((BaseChart.maxVal - item.low) / (BaseChart.maxVal - BaseChart.minVal)) *
      (this.option.height - this.option.cPadding)

    if (item.open > item.close) {
      this.drawLine(x, y, x, Y, { color: this.option.downColor, width: 3 })
    } else {
      this.drawLine(x, y, x, Y, { color: this.option.upColor, width: 3 })
    }
    this.ctx.stroke()
  }

  //绘制蜡烛
  drawCandle(item: Candle, index: number) {
    let x =
      this.originX +
      this.option.cPadding +
      index * this.candleWidth +
      (index - 1) * BaseChart.candleMargin
    let y
    let candleHeight //蜡烛的高

    if (item.open > item.close) {
      //跌
      candleHeight =
        ((item.open - item.close) / (BaseChart.maxVal - BaseChart.minVal)) *
        (this.option.height - this.option.cPadding)

      y =
        ((BaseChart.maxVal - item.open) /
          (BaseChart.maxVal - BaseChart.minVal)) *
        (this.option.height - this.option.cPadding)

      this.drawRect(x, y, this.candleWidth, candleHeight, {
        fillStyle: this.option.downColor
      })
    } else {
      //涨
      candleHeight =
        ((item.close - item.open) / (BaseChart.maxVal - BaseChart.minVal)) *
        (this.option.height - this.option.cPadding)

      y =
        ((BaseChart.maxVal - item.close) /
          (BaseChart.maxVal - BaseChart.minVal)) *
        (this.option.height - this.option.cPadding)

      this.drawRect(x, y, this.candleWidth, candleHeight, {
        fillStyle: this.option.upColor
      })
    }
  }

  //绘制折线
  drawBrokenLine(
    item: Candle,
    index: number,
    config: { color?: string; width?: number } = {}
  ) {
    let x =
      this.originX +
      this.option.cPadding +
      index * this.candleWidth +
      (index - 1) * BaseChart.candleMargin +
      this.candleWidth / 2
    let y =
      ((BaseChart.maxVal - item.close) /
        (BaseChart.maxVal - BaseChart.minVal)) *
      (this.option.height - this.cPadding)

    if (index === 0) {
      this.ctx.moveTo(x, y)
    } else {
      this.ctx.lineTo(x, y)
    }
    this.ctx.strokeStyle = config.color || this.BrokenLineColor
    if (config.width) {
      this.ctx.lineWidth = config.width
    }
  }

  //绘制K线
  drawCandles() {
    this.ctx.beginPath()
    this.ctx.setLineDash([])

    for (let index = 0; index < BaseChart.showData.length; index++) {
      const item = BaseChart.showData[index]
      if (BaseChart.chartType === 'line') {
        this.addCandleCoordinate(item, index, BaseChart.showData)
        this.drawBrokenLine(item, index, { width: 3 })
      } else {
        this.addCandleCoordinate(item, index, BaseChart.showData)
        this.drawCandle(item, index)
        this.drawCandlestick(item, index)
      }
    }

    this.ctx.stroke()
    if (BaseChart.chartType === 'line') {
      //背景
      let firstCandleX =
        this.originX +
        this.option.cPadding -
        Number(BaseChart.candleMargin) +
        this.candleWidth / 2
      let lastCandleX =
        this.originX +
        this.option.cPadding +
        (BaseChart.showData.length - 1) * this.candleWidth +
        (BaseChart.showData.length - 2) * BaseChart.candleMargin +
        this.candleWidth / 2
      this.ctx.lineTo(lastCandleX, this.originY)
      this.ctx.lineTo(firstCandleX, this.originY)
      //背景渐变色
      let gradient = this.ctx.createLinearGradient(0, 0, 0, 300)
      gradient.addColorStop(0, this.lineBgColorBegin)
      gradient.addColorStop(1, this.lineBgColorEnd)
      this.ctx.fillStyle = gradient
      this.ctx.fill()
      this.ctx.closePath()
    }
  }

  //给每根蜡烛添加左坐标和右坐标
  addCandleCoordinate(candle: Candle, index: number, showData: Candle[]) {
    let x =
      this.originX +
      this.option.cPadding +
      index * this.candleWidth +
      (index - 1) * BaseChart.candleMargin

    //每根蜡烛的左坐标
    showData[index].leftCoordinate = Number(x.toFixed(2))
    showData[index].leftCoordinate = Number(showData[index].leftCoordinate)
    //每根蜡烛的右坐标
    showData[index].rightCoordinate = Number((x + this.candleWidth).toFixed(2))
    showData[index].rightCoordinate = Number(showData[index].rightCoordinate)
  }

  //监听拖拽
  canvasMouseDown(e: MouseEvent | TouchEvent) {
    if ('offsetX' in e && this.lastClientX === 0) {
      this.lastClientX = e.offsetX
    }
  }

  //滚轮
  canvasMouseWheel(event: any) {
    let delta = 0
    if (!event.touches) {
      if (event.wheelDelta) {
        //IE、chrome浏览器使用的是wheelDelta，并且值为“正负120”
        delta = event.wheelDelta / 120
        if ((window as any).opera) delta = -delta //因为IE、chrome等向下滚动是负值，FF是正值，为了处理一致性，在此取反处理
      } else if (event.detail) {
        //FF浏览器使用的是detail,其值为“正负3”
        delta = -event.detail / 3
      }
    } else {
      if (this.lastDiff === 0) {
        this.lastDiff = this.Pythagorean(event.touches[0], event.touches[1])
      }
      delta =
        this.Pythagorean(event.touches[0], event.touches[1]) / this.lastDiff > 1
          ? 1
          : -1
      this.lastDiff = this.Pythagorean(event.touches[0], event.touches[1])
    }

    if (delta) this.chartZoom(delta)
  }

  //缩放
  chartZoom(delta: number) {
    let speed = Math.round(BaseChart.showDataNum / 25)
    if (speed < 3) {
      speed = 3
    }
    if (delta < 0) {
      //向下滚动
      // 显示的数量
      if (BaseChart.showDataNum >= BaseChart.allData.length) return

      BaseChart.showDataNum += speed //显示数量

      if (this.rightCandleOffset === 0) {
        BaseChart.showData = BaseChart.allData.slice(-BaseChart.showDataNum)
      } else {
        BaseChart.showData = BaseChart.allData.slice(
          -BaseChart.showDataNum - this.rightCandleOffset,
          BaseChart.allData.length - this.rightCandleOffset
        )
      }
      this.candleNum = BaseChart.showData.length

      this.candleWidth =
        (this.option.width -
          this.chartRightPadding -
          (3 * this.cPadding - BaseChart.candleMargin) -
          BaseChart.candleMargin * (this.candleNum - 1)) /
        this.candleNum
      this.drawChart()
    } else {
      //向上滚动
      if (BaseChart.showDataNum <= 13) return
      BaseChart.showDataNum -= speed
      BaseChart.showData = BaseChart.allData.slice(
        -BaseChart.showDataNum - this.rightCandleOffset,
        BaseChart.allData.length - this.rightCandleOffset
      )
      if (this.rightCandleOffset === 0) {
        BaseChart.showData = BaseChart.allData.slice(-BaseChart.showDataNum)
      }
      this.candleNum = BaseChart.showData.length
      this.candleWidth =
        (this.option.width -
          this.chartRightPadding -
          (3 * this.cPadding - BaseChart.candleMargin) -
          BaseChart.candleMargin * (this.candleNum - 1)) /
        this.candleNum
      this.drawChart()
    }
  }

  //移动
  canvasMouseMove(e: any) {
    //这一次鼠标所在x坐标
    let offsetX
    //移动的蜡烛数量
    let candleMoveNum = parseInt(String(BaseChart.showData.length / 50))
    if (candleMoveNum < 1) {
      candleMoveNum = 1
    }

    if (e.touches) {
      offsetX = e.touches[0].clientX
    } else {
      offsetX = e.clientX
    }

    if (this.lastClientX < offsetX) {
      this.rightCandleOffset += candleMoveNum
      if (this.rightCandleOffset >= BaseChart.allData.length - this.candleNum) {
        this.rightCandleOffset = BaseChart.allData.length - this.candleNum
      }
    } else if (this.lastClientX > offsetX) {
      this.rightCandleOffset -= candleMoveNum

      if (this.rightCandleOffset <= 0) {
        this.rightCandleOffset = 0
      }
    }

    BaseChart.showData = BaseChart.allData.slice(
      -this.candleNum - this.rightCandleOffset,
      BaseChart.allData.length - this.rightCandleOffset
    )
    this.lastClientX = offsetX
    this.leftCandleOffset =
      BaseChart.allData.length - this.rightCandleOffset - this.candleNum
    this.drawChart()
  }

  /**
   * 更新最后一根蜡烛
   * @param timeStamp
   * @param close
   */
  updateLastCandle(timeStamp: number, close: number) {
    let prevCandleOpen = BaseChart.allData[BaseChart.allData.length - 1].close

    let newCandle = {
      open: prevCandleOpen,
      low: prevCandleOpen < close ? prevCandleOpen : close,
      close,
      high: prevCandleOpen > close ? prevCandleOpen : close,
      time: timeStamp,
      formatedTime: this.dateFormat('MM:SS', new Date(Date.now()))
    }
    //@ts-ignore
    BaseChart.allData.push(newCandle)
    //如果显示的数据正好在最右边,执行修改showData
    //否则,偏移量+1
    if (this.rightCandleOffset === 0) {
      BaseChart.showData = BaseChart.allData.slice(-this.candleNum)
    } else {
      this.rightCandleOffset++
    }
  }

  //时间检查
  private timeCheck(lastCandleTime: number, nowTime: number) {
    if (!this.option.timeCheckErrorHandler) return
    let diffTime = Math.abs(
      new Date(nowTime).getMinutes() - new Date(lastCandleTime).getMinutes()
    )
    switch (this.option.interval) {
      case '1m':
        if (diffTime > 1) {
          this.option.timeCheckErrorHandler(diffTime - 1)
        }
        break
      case '5m':
        if (diffTime > 5) {
          this.option.timeCheckErrorHandler(diffTime - 5)
        }
        break
      case '15m':
        if (diffTime > 15) {
          this.option.timeCheckErrorHandler(diffTime - 15)
        }
        break
      case '30m':
        if (diffTime > 30) {
          this.option.timeCheckErrorHandler(diffTime - 30)
        }
        break
      case '60m':
        if (diffTime > 60) {
          this.option.timeCheckErrorHandler(diffTime - 60)
        }
        break
      case '1d':
        if (diffTime > 1440) {
          this.option.timeCheckErrorHandler(diffTime - 1440)
        }
        break
    }
  }

  /**
   * @description 订阅数据
   * @param timeStamp
   * @param {number|string} close 收盘价
   */
  subscribeBars(timeStamp: number, close: number) {
    timeStamp = Number(timeStamp)
    let lastCandle = BaseChart.allData[BaseChart.allData.length - 1]
    let lastCandleTime = new Date(Number(lastCandle.time))
    this.timeCheck(lastCandleTime.getTime(), timeStamp)

    this.updateLastCandle(timeStamp, close)

    this.drawChart()
  }

  //标记
  mark(type: CandleStatus) {
    this.optionPanel.mark(type)
  }

  //跳过交割期
  skipDelivery() {
    this.optionPanel.skipDelivery()
  }
}

export default OptionChart
