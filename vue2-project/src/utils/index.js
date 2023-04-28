import * as echarts from 'echarts'

/**
 *  页面charts 全局 resize
 * */
let reCharts = {
  timer: null,
  /**
   * 页面echarts resie
   * */
  resizeCharts() {
    // console.log('resizeCharts...')
    // let echarts = require('echarts/lib/echarts') // 引入基本模板
    let $echartsDoms = document.querySelectorAll('[_echarts_instance_]')
    let einstance = null

    for (let i = 0, len = $echartsDoms.length; i < len; i++) {
      einstance = echarts.getInstanceByDom($echartsDoms[i])
      einstance && einstance.resize && einstance.resize({animation:{
        duration: 500,
        // easing: 'linear'
    }})
    }
  },
  /**
   *  window resize时resize 所有的echarts
   * */
  windowListenResizeECharts() {
    this._handler = this._handler.bind(this)
    // 页面echarts resize
    window.addEventListener("resize", this._handler, false)
  },
  windowRemoveResizeECharts() {
    window.removeEventListener("resize", this._handler)
  },
  _handler() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    this.timer = setTimeout(()=>{
      this.resizeCharts && this.resizeCharts()
    }, 500)
  }
}

export {
  reCharts
}
