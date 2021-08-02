import QuoteChart from './quoteChart/QuoteChart'
import OptionChart from './optionChart/OptionChart'
import CursorChart from './CursorChart'
import UserOption from './interface/UserOption'
import _Option from './interface/_Option'
import Candle from './interface/Candle'
import CandleStatus from './enum/CandleStatus'
import Chart from './interface/Chart'
import ChartSeries from './enum/ChartSeries'
import './tradeChart.css'


/**
 * @description 主类
 * @author 抓住一股仙气 <1013697816@qq.com> HtwoO <1549914423@qq.com>
 * @Date 2020/12/03
 * @version 3.1
 */

class TradeChart {
  option!: _Option
  container: any
  cursorChart!: CursorChart
  mainChart!: Chart

  constructor(option: UserOption) {
    this.initOption(option)
    //@ts-ignore
    this.addStatus(this.option.data)
    this.patchChart()
  }

  //初始化配置
  initOption(option: UserOption) {
    this.mergeOption(option)
    this.initOptionFun(option)
  }

  //合并配置
  mergeOption(userOption: UserOption) {
    let _userOption = JSON.parse(JSON.stringify(userOption))

    let _option = {
      //高清化处理
      width: _userOption.originalWidth * 2,
      height: _userOption.originalHeight * 2,
      ..._userOption
    }

    this.option = _option
  }

  //初始化配置选项里面的函数
  initOptionFun(userOption: UserOption) {
    let keys = Object.keys(userOption)

    for (let index = 0; index < keys.length; index++) {
      const key = keys[index]
      //@ts-ignore
      const item = userOption[key]
      if (typeof item === 'function') {
        //@ts-ignore
        this.option[key] = item
      }
    }
  }

  //patch chart to DOM
  patchChart() {
    if (document.getElementById(this.option.container) !== null) {
      this.container = document.getElementById(
        this.option.container
      ) as HTMLElement
      this.container.className = '__tcContainer__'
      this.container.style.position = 'relative'
      this.container.style.cursor = 'crosshair'
      this.container.innerHTML = ''

      //展示层
      //@ts-ignore
      switch (this.option.chartSeries) {
        case ChartSeries.quote:
          //行情图表
          this.mainChart = new QuoteChart(this.container, this.option)
          break
        case ChartSeries.option:
          //期权图表
          this.mainChart = new OptionChart(this.container, this.option)
          break
        default:
          //默认加载行情图表
          this.mainChart = new QuoteChart(this.container, this.option)
          break
      }
      //鼠标层
      this.cursorChart = new CursorChart(this.container, this.option)
      //绑定事件
      this.bindEvents()
      this.cursorChart.drawLogo()
    } else {
      throw new Error('container not found')
    }
  }

  async subscribeBars(timeStamp: number, close: number) {
    await this.mainChart.subscribeBars(timeStamp, close)
  }

  //记录涨跌状况
  addStatus(origin: Array<Candle>) {
    origin.forEach((item, index, arr) => {
      if (item.open > item.close) {
        arr[index].status = CandleStatus.down
      } else {
        arr[index].status = CandleStatus.up
      }
    })
  }

  //注册鼠标事件
  bindEvents() {
    if (this.option.mode === 'mobile') {
      this.container.ontouchstart = this.canvasMouseDown.bind(this)
    } else {
      this.container.onmousedown = this.canvasMouseDown.bind(this)
    }
    this.container.onmousewheel = this.canvasMouseWheel.bind(this)
    this.container.addEventListener(
      'DOMMouseScroll',
      this.canvasMouseWheel.bind(this),
      false
    )
    if (this.option.mode === 'pc') {
      this.container.onmousemove = this.cursorChart.canvasMouseMove.bind(
        this.cursorChart
      )
    }
  }

  //点击事件
  canvasMouseDown(e: any) {
    this.container.style.cursor = 'move'
    //触发子图表的点击事件
    this.cursorChart.canvasMouseDown(e)
    this.mainChart.canvasMouseDown(e)
    //将父级的移动事件、鼠标松开事件绑定至子级
    if (this.option.mode === 'pc') {
      this.container.onmousemove = this.canvasMouseMove.bind(this)
      this.container.onmouseup = this.canvasMouseUp.bind(this)
    } else {
      this.container.ontouchmove = this.canvasMouseMove.bind(this)
      this.container.ontouchend = this.canvasMouseUp.bind(this)
    }
  }

  //移动事件
  async canvasMouseMove(e: any) {
    if (e.touches && e.touches.length > 1) {
      this.canvasMouseWheel(e)
    }
    if (e.touches && e.touches.length === 1) {
      this.cursorChart.canvasMouseMove(e)
      await this.mainChart.canvasMouseMove(e)
    }
    if (this.option.mode === 'pc') {
      this.cursorChart.canvasMouseMove(e)
      await this.mainChart.canvasMouseMove(e)
    }
  }

  //鼠标滚轮事件
  canvasMouseWheel(e: any) {
    // 屏蔽页面滚动
    e.preventDefault()
    this.mainChart.canvasMouseWheel(e)
    this.cursorChart.canvasMouseWheel(e)
  }

  //鼠标松开事件
  canvasMouseUp(e: any) {
    this.mainChart.canvasMouseUp(e)
    this.cursorChart.canvasMouseUp(e)
    this.container.onmousemove = null
    this.container.ontouchmove = null
    this.container.onmouseup = null
    this.container.ontouchend = null
    if (this.option.mode === 'pc') {
      this.container.onmousemove = this.cursorChart.canvasMouseMove.bind(
        this.cursorChart
      )
    }
    this.container.style.cursor = 'crosshair'
  }

  mark(type: CandleStatus) {
    if (this.mainChart instanceof OptionChart) {
      this.mainChart.mark(type)
    }
  }

  skipDelivery() {
    if (this.mainChart instanceof OptionChart) {
      this.mainChart.skipDelivery()
    }
  }
}

export default TradeChart
