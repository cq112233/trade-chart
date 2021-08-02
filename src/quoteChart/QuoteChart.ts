import BaseChart from '../BaseChart'
import _Option from '../interface/_Option'
import Candle from '../interface/Candle'
import CandleStatus from '../enum/CandleStatus'
import Chart from '../interface/Chart'
import { createElm } from '../utils'
import QuotePanel from './QuotePanel'

/**
 * @description 行情图表类
 * @author 抓住一股仙气 <1013697816@qq.com> HtwoO <1549914423@qq.com>
 * @Date 2020/11/09
 * @version 3.1
 */

class QuoteChart extends BaseChart implements Chart {
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
  // 动画参数
  ctr: number
  numctr: number
  speed: number
  //用于记录上次双指间隔
  lastDiff: number
  //开始加载下一页数据
  loadMore: boolean = false
  quotePanel: QuotePanel

  constructor(container: HTMLElement, option: _Option) {
    super(container, option)
    this.quotePanel = new QuotePanel(container, option)
    this.createCanvasElement(container)
    this.ctx = this.canvas.getContext('2d')
    this.lineBgColorBegin =
      this.option.lineBgColorBegin || 'rgba(133,171,212,0.6)'
    this.lineBgColorEnd = this.option.lineBgColorEnd || 'rgba(133,171,212,0.1)'
    this.BrokenLineColor = this.option.BrokenLineColor || '#3696F3'
    this.yLegendNum = 10

    BaseChart.legendYMargin =
      (this.option.height - 4 * this.option.cPadding) / (this.yLegendNum - 1) //每个间距
    this.xLegendNum = 4
    this.lastClientX = 0
    this.rightCandleOffset = 0
    this.leftCandleOffset = 0
    this.formatData()
    //此时在屏幕上显示的数据
    BaseChart.showData = BaseChart.allData.slice(-BaseChart.showDataNum)
    //初始化curCandle information
    this.quotePanel.updateCurCandleInfo()
    this.candleNum = BaseChart.showData.length
    this.candleWidth =
      (this.option.width -
        this.chartRightPadding -
        (3 * this.cPadding - BaseChart.candleMargin) -
        BaseChart.candleMargin * (this.candleNum - 1)) /
      this.candleNum
    this.ctr = option.animate ? 1 : 100
    this.numctr = 100
    this.speed = 3
    this.ctx.font = '24px Arial'
    this.ctx.textAlign = 'end'
    this.drawChart()
    this.lastDiff = 0
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

  //定位最大值，最小值
  drawMinMaxText() {
    // 最大值
    let maxHighIndex = 0
    //@ts-ignore
    let showhighData: Candle = { high: 0, low: 0, close: 0, open: 0 }
    BaseChart.showData.forEach((candle, index) => {
      if (candle.high > showhighData.high) {
        showhighData = candle
        maxHighIndex = index
      }
    })

    let x =
      this.originX +
      this.option.cPadding +
      maxHighIndex * this.candleWidth +
      (maxHighIndex - 1) * BaseChart.candleMargin +
      this.candleWidth / 2
    let y =
      ((BaseChart.maxVal - showhighData.high) /
        (BaseChart.maxVal - BaseChart.minVal)) *
      (this.option.height - this.option.cPadding)
    let MaxshowPositon = 'left'
    if (maxHighIndex <= 15) {
      MaxshowPositon = 'right'
    }
    // 画出最大值三角标识符
    this.drawTrigon(
      x,
      y,
      showhighData.high.toString(),
      MaxshowPositon,
      'maxHigh'
    )

    // 最小值
    let minlowIndex = 0
    //@ts-ignore
    let showlowData: Candle = {
      high: 0,
      low: Number.MAX_VALUE,
      close: 0,
      open: 0
    }
    BaseChart.showData.forEach((candle, index) => {
      if (candle.low < showlowData.low) {
        showlowData = candle
        minlowIndex = index
      }
    })

    let X =
      this.originX +
      this.option.cPadding +
      minlowIndex * this.candleWidth +
      (minlowIndex - 1) * BaseChart.candleMargin +
      this.candleWidth / 2
    let Y =
      ((BaseChart.maxVal - showlowData.low) /
        (BaseChart.maxVal - BaseChart.minVal)) *
      (this.option.height - this.option.cPadding)
    let MinshowPositon = 'left'
    if (minlowIndex <= 15) {
      MinshowPositon = 'right'
    }
    // 画出最小值三角标识符
    this.drawTrigon(X, Y, showlowData.low.toString(), MinshowPositon, 'minLow')
  }

  formatData() {
    BaseChart.allData.forEach((item, index, arr) => {
      if (this.option.interval === '1m' || this.option.interval === '5m') {
        this.xLegendNum = 8
      } else if (
        this.option.interval === '15m' ||
        this.option.interval === '30m' ||
        this.option.interval === '60m'
      ) {
        this.xLegendNum = 5
        this.tSpace = 50
      } else if (this.option.interval === '1d') {
        this.xLegendNum = 8
      }
      arr[index].formatedTime = this.dateFormat(
        this.formatTimeRule(),
        new Date(Number(item.time))
      )
    })
  }
  //根据不同周期 显示不同时间格式
  formatTimeRule() {
    if (this.option.interval === '1m' || this.option.interval === '5m') {
      return 'HH:MM'
    } else if (
      this.option.interval === '15m' ||
      this.option.interval === '30m' ||
      this.option.interval === '60m'
    ) {
      return 'mm/dd HH:MM'
    } else if (this.option.interval === '1d') {
      return 'mm/dd'
    } else {
      return 'yyyy-mm-dd HH:MM:SS'
    }
  }

  //绘制图表
  drawChart() {
    this.clearCanvas()
    this.getYlengend()
    this.drawCandles()
    this.drawAxis()
    this.drawRealTimeHorizon()
    if (BaseChart.chartType === 'candle') {
      this.drawMinMaxText()
      this.drawMAs()
    }
  }

  //获取y轴最大最小值
  getYlengend() {
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
    this.ctx.textAlign = 'left'
    for (let index = 0; index < BaseChart.showData.length; index += interval) {
      let candle = BaseChart.showData[index]
      if (candle.formatedTime) {
        this.ctx.fillText(
          candle.formatedTime,
          candle.leftCoordinate +
            (candle.rightCoordinate - candle.leftCoordinate) / 2,
          this.option.height - this.option.cPadding
        )
      }
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

      this.drawRect(
        x,
        y,
        (this.candleWidth * this.ctr) / this.numctr,
        candleHeight,
        {
          fillStyle: this.option.downColor
        }
      )
    } else {
      //涨
      candleHeight =
        ((item.close - item.open) / (BaseChart.maxVal - BaseChart.minVal)) *
        (this.option.height - this.option.cPadding)

      y =
        ((BaseChart.maxVal - item.close) /
          (BaseChart.maxVal - BaseChart.minVal)) *
        (this.option.height - this.option.cPadding)

      this.drawRect(
        x,
        y,
        (this.candleWidth * this.ctr) / this.numctr,
        candleHeight,
        {
          fillStyle: this.option.upColor
        }
      )
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
    BaseChart.showData.forEach((item, index, arr) => {
      if (BaseChart.chartType === 'line') {
        this.addCandleCoordinate(item, index, arr)
        this.drawBrokenLine(item, index, { width: 3 })
      } else {
        this.addCandleCoordinate(item, index, arr)
        this.drawCandle(item, index)
        this.drawCandlestick(item, index)
      }
    })

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
    if (this.ctr < this.numctr) {
      this.ctr++
      setTimeout(() => {
        this.drawChart()
        this.drawRealTimeHorizon()
      }, this.speed)
    }
  }

  //绘制实时水平线
  drawRealTimeHorizon() {
    this.ctx.beginPath()
    this.ctx.textAlign = 'left'
    const length = BaseChart.allData.length
    const lastIndex = length - 1
    const lastCandle = BaseChart.allData[lastIndex]
    const viewLength = BaseChart.showData.length
    const viewLastIndex = viewLength - 1
    this.ctx.font = '20px Arial'
    let x =
      this.originX +
      this.option.cPadding +
      viewLastIndex * (this.candleWidth + BaseChart.candleMargin)
    let color
    let y
    if (BaseChart.chartType === 'line') {
      color = this.BrokenLineColor
      y =
        ((BaseChart.maxVal - lastCandle.close) /
          (BaseChart.maxVal - BaseChart.minVal)) *
        (this.option.height - 2 * this.cPadding)
    } else {
      color =
        Number(lastCandle.open) > Number(lastCandle.close)
          ? this.option.downColor
          : this.option.upColor
      y =
        ((BaseChart.maxVal - lastCandle.close) /
          (BaseChart.maxVal - BaseChart.minVal)) *
          (this.option.height - 2 * this.cPadding) +
        this.cPadding
    }

    if (this.option.yAxisDirection === 'left' || !this.option.yAxisDirection) {
      this.drawLine(x, y, this.originX, y, {
        color: color,
        dottal: { x: 1, y: 1 }
      })
      this.ctx.stroke()
      this.drawRect(this.originX, y - 7, 50, 15, {
        fillStyle: color
      })
      this.ctx.fillStyle = '#fff'
      this.ctx.fillText(lastCandle.close, this.originX + 5, y + 3.5)
    } else if (this.option.yAxisDirection === 'right') {
      const X = this.originX + this.option.width
      this.drawLine(X, y, this.originX, y, {
        color: color,
        dottal: { x: 1, y: 1 }
      })
      this.ctx.stroke()

      this.drawRect(
        X - BaseChart.yAxisLegendTextLength,
        y - BaseChart.TimeHorizonHeight / 2,
        BaseChart.yAxisLegendTextLength,
        BaseChart.TimeHorizonHeight,
        {
          fillStyle: color
        }
      )
      this.ctx.fillStyle = '#fff'
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillText(
        (lastCandle.close / 1).toFixed(this.option.priceDigitnumber),
        X - BaseChart.yAxisLegendTextLength / 2,
        y
      )
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
    //@ts-ignore
    showData[index].leftCoordinate = x.toFixed(2)
    showData[index].leftCoordinate = Number(showData[index].leftCoordinate)
    //每根蜡烛的右坐标
    //@ts-ignore
    showData[index].rightCoordinate = (
      x +
      (this.candleWidth * this.ctr) / this.numctr
    ).toFixed(2)
    showData[index].rightCoordinate = Number(showData[index].rightCoordinate)
  }

  /**
   * @description 绘制MA线
   * @param {number|string} _interval 间隔
   * @param color
   */
  drawMA(_interval: number, color: string) {
    this.ctx.beginPath()
    const interval = Number(_interval)
    let startIndex //开始截取的索引
    let sliceLength //截取的长度
    let leftTrigger //触发左边界条件
    this.leftCandleOffset =
      BaseChart.allData.length - this.rightCandleOffset - this.candleNum
    if (this.leftCandleOffset < interval) {
      //如果向左移动到 不能再截取更多的数据
      sliceLength = this.candleNum + this.leftCandleOffset
      startIndex = 0
      leftTrigger = true
    } else {
      //如果能截取更多数据
      sliceLength = this.candleNum + interval - 1
      startIndex = -this.candleNum - this.rightCandleOffset - interval + 1
      leftTrigger = false
    }
    let endIndex = startIndex + sliceLength
    if (endIndex === 0) {
      endIndex = BaseChart.allData.length - 1
    }

    let data = BaseChart.allData.slice(startIndex, endIndex + 1)

    for (let index = interval - 1; index < sliceLength; index++) {
      const prevIndex = index - interval + 1 //当前索引 - MA周期 - 1 = 开始算MA值的索引

      let allPrevClosePrice = 0 //初始化 该MA周期内所有收盘价

      for (let indexTemp = prevIndex; indexTemp <= index; indexTemp++) {
        if (data[indexTemp].close === undefined) {
        }
        allPrevClosePrice += Number(data[indexTemp].close) //收集该MA周期内所有收盘价
      }

      const avePrevClosePrice = allPrevClosePrice / interval //计算该MA周期内MA值

      let drawIndex = index - interval + 1

      if (leftTrigger) {
        drawIndex = index - this.leftCandleOffset
      }
      //将MA值保存
      BaseChart.showData[drawIndex]['MA' + interval] = Number(
        avePrevClosePrice.toFixed(this.option.priceDigitnumber)
      )

      this.drawBrokenLine(
        //@ts-ignore
        { open: 0, high: 0, low: 0, close: avePrevClosePrice },
        drawIndex,
        {
          color,
          width: 2
        }
      )
    }
    this.ctx.stroke()
  }

  drawMAs() {
    this.ctx.setLineDash([])
    if (this.option.MA && this.option.MA.length) {
      this.option.MA.forEach((item) => {
        this.drawMA(item.interval, item.color)
      })
    }
  }

  //监听拖拽
  canvasMouseDown(e: MouseEvent | TouchEvent) {
    if ('offsetX' in e && this.lastClientX === 0) {
      this.lastClientX = e.offsetX
    }
  }

  //鼠标滚轮兼容浏览器
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

  //监听移动
  async canvasMouseMove(e: any) {
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
    await this.loadMoreData()
    this.drawChart()
  }

  //加载更多数据
  async loadMoreData() {
    if (
      !this.leftCandleOffset &&
      !this.loadMore &&
      this.option.loadMoreCallback
    ) {
      this.loadMore = true
      let newBars = (await this.option.loadMoreCallback()) as Candle[]
      if (newBars.length === 0) {
        return
      }
      this.addStatus(newBars)
      BaseChart.allData.unshift(...newBars)
      this.formatData()
      this.loadMore = false
    }
  }

  /**
   * 根据不同条件对最后一根蜡烛采取不同操作
   * @param timeStamp
   * @param condition 条件
   * @param close
   * @param lastCandle
   */
  updateLastCandle(
    timeStamp: number,
    condition: boolean,
    close: number,
    lastCandle: Candle
  ) {
    if (condition) {
      //如果是同一分钟就覆盖数据
      if (close > lastCandle.high) {
        BaseChart.allData[BaseChart.allData.length - 1].high = close
        BaseChart.allData[BaseChart.allData.length - 1].close = close
      } else if (close < lastCandle.low) {
        BaseChart.allData[BaseChart.allData.length - 1].low = close
        BaseChart.allData[BaseChart.allData.length - 1].close = close
      } else {
        BaseChart.allData[BaseChart.allData.length - 1].close = close
      }
      // 新增添加涨跌属性
      BaseChart.allData[BaseChart.allData.length - 1].status =
        BaseChart.allData[BaseChart.allData.length - 1].close >
        BaseChart.allData[BaseChart.allData.length - 1].open
          ? CandleStatus.up
          : CandleStatus.down
    } else {
      // 如果是不是一分钟就新增
      let prevCandleOpen = BaseChart.allData[BaseChart.allData.length - 1].close

      let newCandle = {
        open: prevCandleOpen,
        low: prevCandleOpen < close ? prevCandleOpen : close,
        close,
        high: prevCandleOpen > close ? prevCandleOpen : close,
        time: timeStamp,
        formatedTime: this.dateFormat(
          this.formatTimeRule(),
          new Date(Date.now())
        )
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
  }

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
  async subscribeBars(timeStamp: number, close: number) {
    timeStamp = Number(timeStamp)
    let lastCandle = BaseChart.allData[BaseChart.allData.length - 1]
    let lastCandleTime = new Date(Number(lastCandle.time))
    let lastCandleMinuteTime = Number(this.dateFormat('M', lastCandleTime))
    let lastCandleHoursTime = Number(this.dateFormat('H', lastCandleTime))
    let lastCandleDayTime = Number(this.dateFormat('d', lastCandleTime))
    let nowDay = Number(this.dateFormat('d', new Date(timeStamp)))
    let nowMinute = Number(this.dateFormat('M', new Date(timeStamp)))
    let nowHours = Number(this.dateFormat('H', new Date(timeStamp)))
    this.timeCheck(lastCandleTime.getTime(), timeStamp)
    if (this.option.interval === '1m') {
      this.updateLastCandle(
        timeStamp,
        nowMinute === lastCandleMinuteTime,
        close,
        lastCandle
      )
    } else if (this.option.interval === '5m') {
      this.updateLastCandle(
        timeStamp,
        Math.abs(nowMinute - lastCandleMinuteTime) <= 5 ||
          Math.abs(nowMinute - lastCandleMinuteTime) === 55,
        close,
        lastCandle
      )
    } else if (this.option.interval === '15m') {
      this.updateLastCandle(
        timeStamp,
        Math.abs(nowMinute - lastCandleMinuteTime) <= 15 ||
          Math.abs(nowMinute - lastCandleMinuteTime) === 45,
        close,
        lastCandle
      )
    } else if (this.option.interval === '30m') {
      this.updateLastCandle(
        timeStamp,
        Math.abs(nowMinute - lastCandleMinuteTime) <= 30,
        close,
        lastCandle
      )
    } else if (this.option.interval === '60m') {
      this.updateLastCandle(
        timeStamp,
        nowHours === lastCandleHoursTime,
        close,
        lastCandle
      )
    } else if (this.option.interval === '1d') {
      this.updateLastCandle(
        timeStamp,
        lastCandleDayTime === nowDay,
        close,
        lastCandle
      )
    }
    this.quotePanel.updateCurCandleInfo()
    this.drawChart()
  }
}

export default QuoteChart
