import Candle from './interface/Candle'
import ChartType from './enum/ChartType'
import InfoContainerPosition from './enum/InfoContainerPosition'
import _Option from './interface/_Option'
import CandleStatus from './enum/CandleStatus'

/**
 * @description 图表基类
 * @author 抓住一股仙气 <1013697816@qq.com> HtwoO <1549914423@qq.com>
 * @Date 2020/12/03
 * @version 3.1
 */

class BaseChart {
  //y轴图例宽度
  static yAxisLegendTextLength: number
  // y轴字体高度
  static tHeight: number = 15
  // 各方块高度
  static TimeHorizonHeight: number = 30
  //当前区域最小的收盘价
  static minVal: number = 9999999
  //当前区域最大的收盘价
  static maxVal: number = 0
  //y轴图列外边距
  static legendYMargin: number
  //所有数据
  static allData: Candle[]
  //此时在屏幕上显示的数据
  static showData: Candle[]
  //蜡烛的总数量
  static showDataNum: number
  //蜡烛的外边距
  static candleMargin = 1
  //当前鼠标所在区域对应的蜡烛，初始化为最后一根蜡烛
  static curCandle: Candle
  //是时候更新curCandle了
  static isTimeToUpdateCurCandle: boolean
  //图形类型
  static chartType: ChartType
  //是否点击
  static isTouch: boolean = false
  //当前蜡烛信息面板的定位方向
  static infoContainerPosition: InfoContainerPosition =
    InfoContainerPosition.left

  ctx: any
  canvas: any
  option!: _Option
  container!: HTMLElement
  fontSize!: string
  cPadding!: number
  tSpace!: number
  originX!: number
  originY!: number
  chartRightPadding!: number
  static curCandleCoord = {
    offsetX: 0,
    offsetY: 0
  }

  constructor(container: HTMLElement, option: _Option) {
    this.initState(container, option)
  }

  canvasMouseDown(e: MouseEvent | TouchEvent) {}

  canvasMouseWheel(e: MouseEvent | TouchEvent) {}

  canvasMouseMove(e: MouseEvent | TouchEvent) {}

  canvasMouseUp(e: MouseEvent | TouchEvent) {}

  //初始化状态
  initState(container: HTMLElement, option: _Option) {
    this.ctx = null
    this.canvas = null
    BaseChart.isTimeToUpdateCurCandle = true
    this.option = option
    //记录涨跌状况
    //@ts-ignore
    this.addStatus(this.option.data)
    //@ts-ignore
    BaseChart.allData = this.option.data
    BaseChart.chartType = this.option.chartType || 'candle'
    BaseChart.showDataNum = this.option.mode === 'pc' ? 50 : 30
    this.container = container
    //字体大小
    this.fontSize = this.option.fontSize || '18px'
    //内边距
    this.cPadding = this.option.cPadding
    this.tSpace = this.option.tSpace || 100
    //原点x坐标
    this.originX = this.option.cPadding
    //原点y坐标
    this.originY = this.option.height - this.cPadding
    //图表右内边距
    this.chartRightPadding =
      this.option.mode === 'mobile'
        ? this.option.width * 0.15
        : this.option.width * 0.08
  }

  // 绘制三角形
  drawTrigon(x: number, y: number, text: any, position: string, state: string) {
    // 镜像对对称
    if (position === 'right') {
      let x1 = x
      let y1 = state === 'maxHigh' ? y - 10 : y + 10
      this.ctx.beginPath()
      this.ctx.setLineDash([])
      this.ctx.strokeStyle = '#A0A4AB'
      this.ctx.moveTo(x1 + 40, y1)
      this.ctx.lineTo(x1 + 10, y1)
      this.ctx.stroke()
      this.ctx.beginPath()
      this.ctx.moveTo(x1 + 10, y1)
      this.ctx.lineTo(x1 + 25, y1 - 10)
      this.ctx.lineTo(x1 + 15, y1)
      this.ctx.lineTo(x1 + 25, y1 + 10)
      this.ctx.fillStyle = '#A0A4AB'
      this.ctx.fill()
      // 设置垂直对齐方式
      this.ctx.font = '20px Arial'
      this.ctx.textBaseline = 'middle'
      text = (text / 1).toFixed(this.option.priceDigitnumber)
      this.ctx.fillText(text, x1 + this.ctx.measureText(text).width, y1)
    } else {
      let x2 = x + 10
      let y2 = state === 'maxHigh' ? y - 10 : y + 10
      this.ctx.beginPath()
      this.ctx.setLineDash([])
      this.ctx.strokeStyle = '#A0A4AB'
      this.ctx.moveTo(x2 - 10, y2)
      this.ctx.lineTo(x2 - 40, y2)
      this.ctx.stroke()
      this.ctx.beginPath()
      this.ctx.moveTo(x2 - 10, y2)
      this.ctx.lineTo(x2 - 25, y2 - 10)
      this.ctx.lineTo(x2 - 15, y2)
      this.ctx.lineTo(x2 - 25, y2 + 10)
      this.ctx.fillStyle = '#A0A4AB'
      this.ctx.fill()
      // 设置垂直对齐方式
      this.ctx.font = '20px Arial'
      this.ctx.textBaseline = 'middle'
      text = (text / 1).toFixed(this.option.priceDigitnumber)
      this.ctx.fillText(text, x2 - this.ctx.measureText(text).width, y2)
    }
  }

  //绘制线的方法
  drawLine(
    x: number,
    y: number,
    X: number,
    Y: number,
    option: {
      color?: string
      dottal?: { x: number; y: number }
      width?: number
    } = {}
  ) {
    this.ctx.setLineDash([])
    this.ctx.moveTo(x, y)

    if (option) {
      if (option.color) {
        this.ctx.strokeStyle = option.color
      }
      if (option.dottal) {
        this.ctx.setLineDash([option.dottal.x, option.dottal.y])
      }
      if (option.width) {
        this.ctx.lineWidth = option.width
      }
    }

    this.ctx.lineTo(X, Y)
  }

  //绘制矩形的方法
  drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    options: { fillStyle?: string }
  ) {
    this.ctx.beginPath()
    if (options) {
      this.ctx.fillStyle = options.fillStyle
    }
    this.ctx.fillRect(x, y, width, height)
  }

  //清除canvas
  clearCanvas() {
    this.canvas.height = this.option.height
    this.canvas.width = this.option.width
  }

  /**
   * @description 日期格式化
   * @param {string} fmt 格式
   * @param {Date} date 时间
   */
  dateFormat(fmt: string, date: Date) {
    let ret
    const opt: any = {
      'Y+': date.getFullYear().toString(), // 年
      'm+': (date.getMonth() + 1).toString(), // 月
      'd+': date.getDate().toString(), // 日
      'H+': date.getHours().toString(), // 时
      'M+': date.getMinutes().toString(), // 分
      'S+': date.getSeconds().toString() // 秒
      // 有其他格式化字符需求可以继续添加，必须转化成字符串
    }
    for (let k in opt) {
      if (opt.hasOwnProperty(k)) {
        ret = new RegExp('(' + k + ')').exec(fmt)
        if (ret) {
          fmt = fmt.replace(
            ret[1],
            ret[1].length === 1 ? opt[k] : opt[k].padStart(ret[1].length, '0')
          )
        }
      }
    }
    return fmt
  }

  //绘制logo
  drawLogo() {
    let img = document.createElement('img')
    img.setAttribute('src', require('./logo.png'))
    img.style.position = 'absolute'
    img.style.left = '1%'
    img.style.maxWidth = '100px'
    img.style.opacity = '0.5'
    img.style.bottom = '5%'
    img.style.userSelect = 'none'
    this.container.appendChild(img)
  }

  //勾股定理
  Pythagorean(touchObj1: MouseEvent, touchObj2: MouseEvent) {
    let rightAngleSide1 = Math.abs(touchObj1.clientX - touchObj2.clientX)
    let rightAngleSide2 = Math.abs(touchObj1.clientY - touchObj2.clientY)
    return Math.sqrt(
      Math.pow(rightAngleSide1, 2) + Math.pow(rightAngleSide2, 2)
    )
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
}

export default BaseChart
