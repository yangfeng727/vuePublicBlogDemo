/**
 * 纵向缩放chart扩展插件
 * @author：yangfeng
 * @time: 20220817
 * */
/*
  注意事项：
  1.y轴必须是value类型，使用前提dataZoom需要指定xAxisIndex 和yAxisIndex
  2.可以不设置y轴max，min，不设置会取对应系列的最大最小值，若设置了则初始以设置的为准
  3.每个y轴都必须有一个唯一dataZoom匹配，因为缩放的是dataZoom
  4.保留横向缩放功能
  5.因为y轴要缩放用，则x轴会被设置为脱离y轴0刻度
*/
export default {
  data() {
    return {
      yDataZoomTimer: null,// y轴缩放时用于防抖
      saveInfo: {}, // 存储缩放后的状态信息，针对定时任务的场景
    }
  },
  methods: {
    isNull(val) {
      return val === null || val === void 0 || val === '' || (val).toString() === 'NaN'
    },
    // 节流函数 - 每段时间执行一次
    throttle(fn,wait) {
      let pre = Date.now();
      return function () {
        let context = this;
        let args = arguments;
        let now = Date.now();
        if (now - pre >= wait) {
          fn.apply(context, args);
          pre = Date.now();
        }
      }
    },
      // y轴缩放配置 start ----------------

    // 清除用于防抖缩放的定时器
    clearYDataZoomTimer() {
      this.yDataZoomTimer && clearTimeout(this.yDataZoomTimer)
    },

    // 重新给y轴赋值足够大的max，min值【这样初始就可以缩放】，并给对应y轴dataZoom赋值startValue和endValue
    setYMaxMin(option) {
      if (!option || !option.yAxis) return
      if (!Array.isArray(option.yAxis)) { // y轴修改为数组
        option.yAxis = [option.yAxis]
      }

      option.yAxis.map((item, yAxisIndex) => {
        let {
          max,
          min
        } = this.getSeriesItemYMaxMin(option, option.series.find(subItem => subItem.yAxisIndex === yAxisIndex)) // 根据数据获取最大最小值

        // 没有给y轴设置最大最小值，则使用数据中的极值
        let yMax = !this.isNull(item.max) ? item.max : max
        let yMin = !this.isNull(item.min) ? item.min : min
        // console.log(item, max, min,)
        // console.log('xxx', yMax, yMin)
        // 修改当前y轴对应的dataZoom startValue和endValue
        let findZoom = option.dataZoom.find(subItem => subItem.yAxisIndex === yAxisIndex)
        if (findZoom) { // 有对应的dataZoom
          delete findZoom.start
          delete findZoom.end
          let seriesItem = option.series.find(subItem => subItem.yAxisIndex === yAxisIndex)
          findZoom.startValue = yMin
          findZoom.endValue = yMax
          findZoom.id = `yZoom-${yAxisIndex}-${seriesItem.name}` // seriesItem,给对应dataZoom赋值id
          this.$set(findZoom, 'disabled', true) // 给option的dataZoom设置此属性，重要！！

          // 重新设置最大最小值, 放大缩小最大最小值，这样初始就可以拖动了 - 解决初始没法拖动的问题
          let rang = Math.abs(yMax - yMin)
          item.max = yMax + rang * 10000 // 这里设置一万倍
          item.min = yMin - rang * 10000
        }
      })

      // 让x轴脱离y轴0刻度
      if (Array.isArray(option.xAxis)) {
        option.xAxis.map(item => {
          !item.axisLine && (item.axisLine = {})
          item.axisLine.onZero = false
        })
      } else {
        !option.xAxis.axisLine && (option.xAxis.axisLine = {})
        option.xAxis.axisLine.onZero = false
      }
    },

    /**
     * 获取当前系列的y值最大最小值
     * @option: chart 的optin配置
     * @seriesItem：需要找极值的series项
     * @return {max,min}
     * */
    getSeriesItemYMaxMin(option, seriesItem) {
      let yDATA = [] // 取出对应series的y值
      seriesItem.data.map(item => { // 取出
        if (this.isNull(item)) return
        if (Array.isArray(item)) { // 数组取第二项
          yDATA.push(item[1])
        } else if (typeof item === 'object') { // 针对echarts 的data数据类型进行取值
          yDATA.push(item.value)
        } else { // 数值类型
          yDATA.push(item)
        }
      })
      // 取出对应series的y值最大最小值
      return {
        max: Math.max(...yDATA),
        min: Math.min(...yDATA)
      }
    },

    // 关闭缩放并取消高亮
    closeZoomHighLight(option) {
      option.dataZoom.map(item => {
        if (item.type !== 'slider') { // slider的保持缩放，
          item.disabled = true
        }
      })

      // 取消高亮
      // myChart.dispatchAction({
      //     type: 'downplay',
      //     seriesIndex: option.series.map((item, index) => index)
      // });
      // console.log(option, 111)

      // 设置透明度来达到高亮效果
      option.series.map(item => {
        !item.lineStyle && (item.lineStyle = {})
        item.lineStyle.opacity = 1

        !item.itemStyle && (item.itemStyle = {})
        item.itemStyle.opacity = 1
      })
    },
    /**
     * 高亮缩放指定seriesIndex的项，只有高亮的系列或者slider类型的才能缩放
     * */
    openZoomHighLight(option, seriesIndex) {
      let yAxisIndex = option.series[seriesIndex].yAxisIndex
      let findItem = option.dataZoom.find(item => item.yAxisIndex === yAxisIndex)
      findItem.disabled = false
      // myChart.dispatchAction({
      //     type: 'highlight',
      //     seriesIndex: seriesIndex
      // });

      // 设置透明度来达到高亮效果
      option.series.map(item => {
        !item.lineStyle && (item.lineStyle = {})
        item.lineStyle.opacity = 0.3

        !item.itemStyle && (item.itemStyle = {})
        item.itemStyle.opacity = 0.3
      })
      option.series[seriesIndex].lineStyle.opacity = 1
      option.series[seriesIndex].itemStyle.opacity = 1
      // console.log(option.series)
    },

    /**
     * 点击到系列上，高亮此系列
     * @option
     * @seriesIndex：需要高亮系列的索引
     * */
    highLightSeries(option, seriesIndex) {
      if (seriesIndex !== null && seriesIndex > -1) {
        this.closeZoomHighLight(option) // 关闭所有缩放
        this.openZoomHighLight(option, seriesIndex) // 开启缩放并选中
      }
    },
    /**
     * 取消高亮系列
     * */
    closeHighLightSeries(option) {
      this.closeZoomHighLight(option) // 关闭所有缩放
      // 开启x轴缩放 - 没有指定yAxisIndex的，认定为x轴
      option.dataZoom.map(item => {
        if (this.isNull(item.yAxisIndex)) {
          item.disabled = false
        }
      })
    },

    /**
     * 开启y轴缩放功能
     * @option：该echarts的option
     * @chartInstance: echart 渲染的实例，用于绑定事件
     * @keepAlive: Boolean 是否继承上次的缩放状态，针对定时刷新图表情况，能保留之前x,y缩放、高亮、legend选中状态
     *             Object:若是对象类型，该对象将会和之前存储的saveInfo对象合并【针对某些不需要完全继承上次状态的场景，在改组件外部修改了状态信息，需要以修改的为准】
     * */
    initYZoom(option, chartInstance, keepAlive = true) {
      if (!chartInstance) {
        console.error('echarts 实例不存在, 开启y轴缩放失败')
        return
      }

      // option属性赋值
      this.setYMaxMin(option) // 重新给y轴赋值max，min值
      // 给x轴对应的系列赋值id
      option.dataZoom.map((item, index) => {
        if (!item.id) {
          item.id = `${item.xAxisIndex}-${item.type}-${index}-zoom`
        }
      })
      // console.log(option, 6666)

      if (keepAlive) { // 继承上次缩放状态
        this.extendZoomInfo(option, chartInstance, keepAlive)
      } else {
        this.saveInfo = {} // 清空
      }

      // 利用getZr方法获取点击事件，点击开启缩放
      chartInstance.getZr().on('click', (params) => {
        // console.log(params, 222)
        let target = params.target
        if (target) { // 点击线条，开启缩放
          let seriesIndex = target.seriesIndex || null // 【注意：echarts 版本不一样这里可能不一样】
          if (!seriesIndex) {
            Object.keys(target).map(key => {
              if (~key.indexOf('__ec_inner_')) {
                'seriesIndex' in target[key] && (seriesIndex = target[key].seriesIndex)
              }
            })
          }

          this.highLightSeries(option, seriesIndex)
        } else { // 未点击线条，闭关缩放功能并取消高亮
          this.closeHighLightSeries(option)
        }
        this.$emit('dataYZoom', params, this.saveZoomInfo(option)) // 将缩放后的上下限抛出，方便父组件使用
      });

      // 因为在取消缩放后 echarts并没有保存缩放值，而且还需要对超出显示范围的缩放进行处理。因此这里需要dataZoom方法
      chartInstance.on('dataZoom', (params) => {
        // console.log(params, 'dataZoom')
        let dataZoomId; // 缩放的dataZoom id
        let start; // 当前缩放开始百分比
        let end; // 当前缩放结束百分比
        if (params.batch) { // 【注意：echarts 版本不一样这里可能不一样】
          let data = params.batch[0]
          dataZoomId = data.dataZoomId // 当前缩放的dataZoom
          start = data.start
          end = data.end
        } else {
          dataZoomId = params.dataZoomId
          start = params.start
          end = params.end
        }

        // 对x轴缩放时，存储start end
        if (dataZoomId && !dataZoomId.startsWith('yZoom-')) {
          this.setXDataZoom(option, chartInstance, {id: dataZoomId, start, end}) // 存储x轴缩放信息
        }

        // 换算为比例
        start = start / 100
        end = end / 100
        this.clearYDataZoomTimer() // 清除定时器

        // 对某条线进行缩放时，将对应y轴dataZoom的startValue和endValue重新赋值【因为更改了y轴min和max，直接返回的start 和end是百分比，不能直接使用】
        if (dataZoomId && dataZoomId.startsWith('yZoom-')) { // 是y轴缩放的逻辑

          // 根据y轴的最大最小值将当前缩放的start end 换算为startValue和endValue
          let currentDataZoom = option.dataZoom.find(item => item.id === dataZoomId)
          if (!currentDataZoom) return
          // 对应的y轴
          let yAxisIndex = currentDataZoom.yAxisIndex
          let {max, min} = option.yAxis[yAxisIndex] // 这里的最大最小值是放大了区间后的值
          let rang = Math.abs(max - min)
          let startValue = min + rang * start // 注意都是min开始的，因为start、end是占比
          let endValue = min + rang * end // 注意都是min开始的，因为start、end是占比

          // 处理边界条件，缩放时保证所有数据都在可视区域内
          let seriesItem = option.series[yAxisIndex] // 获取对应的series项
          let {max: yMax, min: yMin} = this.getSeriesItemYMaxMin(option, seriesItem)
          // console.log('y值', `${yMin}-${yMax}`,`${startValue}-${endValue}`)
          // 超出范围处理，保证缩放后的数据都在可视范围内
          let dispatchZoom = false // 是否调用dispatchAction
          if (yMax > endValue) {
            endValue = yMax
            dispatchZoom = true
          }
          if (yMin < startValue) {
            startValue = yMin
            dispatchZoom = true
          }
          // console.log(currentDataZoom.startValue,'-',currentDataZoom.endValue)

          // 保存当前缩放值
          currentDataZoom.startValue = startValue
          currentDataZoom.endValue = endValue

          if (dispatchZoom) { // 只有在超出界限的时候才需要调用这个，如果不限定每次都调用这个将会出现卡顿
            this.yDataZoomTimer = setTimeout(() => { // 防抖，防止数据量太大的卡顿
              let dataZoomIndex = option.dataZoom.findIndex(item => item.id === dataZoomId)
              chartInstance.dispatchAction({
                type: 'dataZoom',
                dataZoomIndex,
                // 开始位置的数值
                startValue: startValue,
                // 结束位置的数值
                endValue: endValue
              })
            })
          }

          // console.log(startValue,'-', endValue, dataZoomIndex, option.dataZoom[dataZoomIndex])

          this.$emit('dataYZoom', params, this.saveZoomInfo(option)) // 将缩放后的上下限抛出，方便父组件使用
        }
        // })
      })

      // legend 选择
      chartInstance.on('legendselectchanged', (params) => {
        // console.log(params.selected, 555)
        this.saveZoomInfo(option, {
          legendSelected: params.selected // 记录legend的选中状态
        })
      })

      // y轴缩放加载完成事件
      this.$emit('dataYZoomFinished', this.saveZoomInfo(option))
    },

    /**
     * 获取y轴可缩放的对应系列当前上下限
     * @option: chart的option 配置
     * @return [{seriesName:系列名,upper:上限,lower:下限}]
     * */
    getSeriesUpperLower(option) {
      let arr = option.dataZoom.filter(item => item.id && item.id.startsWith('yZoom-'))
      let resArr = arr.map(item => {
        let IdInfo = item.id.split('-')
        return {
          seriesName: IdInfo[2],
          upper: item.endValue, // 上限
          lower: item.startValue, // 下限
        }
      })
      return resArr
    },
    // 获取当前高亮的系列
    getHighLightSeriesName(option) {
      let filterArr = option.series.filter(item => item.lineStyle && item.lineStyle.opacity === 1)
      // console.log(option,filterArr, 'nnn')
      if (filterArr.length > 1) { // 多个则说明没有选择
        return ''
      } else if (filterArr.length === 1) {
        return filterArr[0].name
      } else {
        return ''
      }
    },

    /**
     * 缩放时存储x轴的缩放信息
     * */
    setXDataZoom(option, chartInstance, {id, start, end}) {
      let findItem = option.dataZoom.find(item => item.id === id)
      let xAxisIndex = findItem.xAxisIndex || 0 // xAxisIndex可能为数组

      // 将缩放相同x轴的dataZoom，缩放设置为当前值
      option.dataZoom.map((item, index) => {
        if (Array.isArray(xAxisIndex) || Array.isArray(item.xAxisIndex)) { // 是数组
          if (JSON.stringify(item.xAxisIndex) === JSON.stringify(xAxisIndex)) {
            item.start = start
            item.end = end
          }
        } else if (item.xAxisIndex === xAxisIndex) {
          item.start = start
          item.end = end

          // chartInstance.dispatchAction({
          //   type: 'dataZoom',
          //   index,
          //   // 开始位置的数值
          //   start,
          //   // 结束位置的数值
          //   end
          // })
        }
      })
      // console.log(option, 'xxxxxxxx')

      this.saveZoomInfo(option)
    },

    /**
     * 存储必要的缩放的信息，若有定时任务让图形可继承上次状态
     * @option: 当前chart option
     * @obj：其他信息
     * */
    saveZoomInfo(option, obj) {
      // console.log(option, 222)
      // x轴对应的dataZoom的缩放信息
      let xDataZoomInfo = []
      option.dataZoom.map(item => {
        if (!item.id.startsWith('yZoom-')) {
          xDataZoomInfo.push({
            id: item.id,
            start: item.start,
            end: item.end
          })
        }
      })
      let info = {
        seriesInfo: this.getSeriesUpperLower(option), // 每个系列的上下限
        xDataZoomInfo, //  x轴对应的dataZoom的缩放信息
        highLightSeriesName: this.getHighLightSeriesName(option) // 当前高亮的seriesName
      }
      this.saveInfo = {
        ...this.saveInfo,
        ...info,
        ...obj
      }
      // console.log(info, 7777)
      return this.saveInfo
    },

    // 继承之前的缩放状态 start ----------
    extendZoomInfo(option, chartInstance, obj) {
      // 传递了对象的以对象为准
      if (obj && typeof obj === 'object' && Object.keys(obj).length) {
        this.saveInfo = {
          ...this.saveInfo,
          ...obj
        }
      }
      if (!this.saveInfo || !Object.keys(this.saveInfo).length) return
      let oldInfo = this.saveInfo
      // console.log(this.saveInfo, 333)
      // 保持高亮状态
      let seriesName = oldInfo.highLightSeriesName
      if (seriesName) {
        let seriesIndex = option.series.findIndex(item => item.name === seriesName)
        this.highLightSeries(option, seriesIndex)
      }

      // 保持y轴缩放
      let seriesInfo = oldInfo.seriesInfo
      if (seriesInfo && seriesInfo.length) {
        option.dataZoom.map(item => {
          if (item.id && item.id.startsWith('yZoom-')) {
            let IdInfo = item.id.split('-')
            let findInfo = seriesInfo.find(sub => sub.seriesName === IdInfo[2])
            if (findInfo) { // 更新为上次的上下限
              item.endValue = findInfo.upper
              item.startValue = findInfo.lower
            }
          }
        })
      }

      // 保持x轴缩放
      let xDataZoomInfo = oldInfo.xDataZoomInfo
      if (xDataZoomInfo && xDataZoomInfo.length) {
        option.dataZoom.map(item => {
          if (!item.id.startsWith('yZoom-')) {
            let findInfo = xDataZoomInfo.find(sub => sub.id === item.id)
            if (findInfo) {
              item.start = findInfo.start
              item.end = findInfo.end
            }
          }
        })
      }

      // 继承之前legend的选中状态
      let legendSelected = oldInfo.legendSelected // 格式如[true,false,xxx]
      if (option.legend && legendSelected && Object.keys(legendSelected).length) {
        option.legend.selected = legendSelected
      }
    }
    // 继承之前的缩放状态 end ----------

    // y轴缩放配置 end ----------------
  },
  beforeDestroy() {
    this.clearYDataZoomTimer() // 清除定时器
  }
}
