/**
 * 创建HTML元素
 * @param tag 标签名
 * @param attrs 初始属性
 * @returns html
 */
export function createElm(tag: string, attrs: any = {}) {
  let el = document.createElement(tag)
  for (const key in attrs) {
    if (Object.prototype.hasOwnProperty.call(attrs, key)) {
      //@ts-ignore
      el[key] = attrs[key]
    }
  }
  return el
}

/**
 * 设置样式
 * @param element dom
 * @param styles 样式
 */
export function setStyle(element: any, styles: { [key: string]: string }) {
  for (let key in styles) {
    if (Object.prototype.hasOwnProperty.call(styles, key)) {
      element.style[key] = styles[key]
    }
  }
}

/**
 * 高仿Java线程sleep
 * @param duration 睡眠时间
 * @returns
 */
export function sleep(duration: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve()
    }, duration)
  })
}

/**
 * 根据传入的时间判断当前的二元期权的状态,状态为:交易中,开始,结束
 * @param startMin 第一盘开始的时间 分钟为单位
 * @param interval 周期 多少时间一盘 分钟为单位
 * @param purchaseTime 交割时间 秒为单位
 */
export function genJudgeOptionStatusFn(
  startMin: number,
  interval: number,
  purchaseTime: number
) {
  /**
   * 生成当前的交易状态为 购买中 或者 交割中
   * @param prev 本周期开始的分钟数
   * @param val 当前的分钟数 带秒值
   * @param next 本周期结束的分钟数
   * @returns
   */
  function genTradingStatus(prev: number, val: number, next: number) {
    //已经过去的时间
    let past
    if (val >= prev) {
      past = (val - prev) * 60
    } else {
      past = interval * 60 - (next - val) * 60
    }
    if (past <= purchaseTime) {
      return 'purchasing'
    } else {
      return 'delivering'
    }
  }

  /**
   * @param val 当前的分钟数,需带上秒.如:当前为03分30秒,传入的val为3.5
   */
  return function (val: number) {
    let arrTotal: any = []
    let minLoop = false
    /**
     * 生成周期枚举数组,比如:startMin=1,interval=3,生成的结果为[[1,4],[4,7],[7,10],[10,13]...]
     */
    function genIntervalArray(_startMin: number, interval: number) {
      if (_startMin >= 60) {
        minLoop = true
        _startMin = _startMin - 60
      }

      let end = interval + _startMin
      let arr = []
      if (interval + _startMin >= 60) {
        end = interval + _startMin - 60
        arr = [_startMin, end]
        arrTotal.push(arr)
      }

      if (_startMin + interval > startMin && minLoop) return

      arr = [_startMin, end]
      arrTotal.push(arr)
      genIntervalArray(interval + _startMin, interval)
    }

    genIntervalArray(startMin, interval)

    let res = {
      prev: 0,
      status: '',
      now: 0,
      next: 0
    }

    /**
     * 判断当前的时间处于哪个周期内,并且判断当前交易处于什么生命周期.
     * 生成一个res对象
     */
    for (let index = 0; index < arrTotal.length; index++) {
      let v = arrTotal[index]
      const prev = v[0]
      const next = v[1]
      if (prev > next) {
        if (val === prev) {
          res.prev =
            next - interval < 0 ? 60 - next + interval : next - interval
          res.status = 'start'
          res.next =
            prev - interval < 0 ? 60 - prev + interval : prev - interval
          break
        } else if (val === next) {
          res.prev =
            prev + interval >= 60 ? 60 - prev - interval : prev + interval
          res.status = 'end'
          res.next =
            next + interval >= 60 ? 60 - next - interval : next + interval
          break
        } else if (prev < val && next + 60 > val) {
          res.prev = prev
          res.status = genTradingStatus(prev, val, next)
          res.next = next
          break
        }
      } else {
        if (prev < val && next > val) {
          res.prev = prev
          res.status = genTradingStatus(prev, val, next)
          res.next = next
          break
        } else if (val === prev) {
          res.prev = prev
          res.status = 'start'
          res.next = next
          break
        } else if (val === next) {
          res.prev =
            prev + interval >= 60 ? 60 - prev - interval : prev + interval
          res.status = 'end'
          res.next =
            next + interval >= 60 ? 60 - next - interval : next + interval
          break
        }
      }
    }
    res.now = val
    return res
  }
}
