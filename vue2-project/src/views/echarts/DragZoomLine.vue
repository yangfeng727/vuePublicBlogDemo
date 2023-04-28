<template>
  <div>

    <div class="wrap">
      <!--路径图2-->
      <div class="com-box">
        <h1>可拖拽缩放的方式配置上下限
          <el-button type="primary" @click="openTimerTick(true)" v-if="!timer">开启定时任务</el-button>
          <el-button type="primary" @click="openTimerTick(false)" v-else>关闭定时任务</el-button>
        </h1>
        <div class="flex-box">
          <div class="info">
            <div>
              右侧趋势图上下限为：<br/>
              <template v-for="(item,index) in chartInfoArr">
                <div :style="{color: item.color}">{{ item.seriesName }}<br/>
                  <div class="input-box">
                    <span>下限:</span>
                    <el-input v-model="item.lower" type="number" :disabled="!!timer" placeholder="下限" :style="{color: item.color}" @change="changeUpLow"/>
                    <span>上限:</span>
                    <el-input v-model="item.upper" type="number" :disabled="!!timer" placeholder="上限" :style="{color: item.color}" @change="changeUpLow"/>
                  </div>
                </div>
              </template>
            </div>
            <hr/>
          </div>
          <div class="line-chart" style="height: 700px;">
            <drag-line-chart :option="chartOption"
                             @dataYZoom="chartDataZoom"
                             @dataYZoomFinished="(val)=>chartDataZoom(null,val)"
                             ref="dragLineChart"/>
          </div>
        </div>
        <div class="content-info">
          <div style="background: rgba(245,199,137,0.31);">
            <p style="color: blue;">组件使用注意事项：</p>
            1.每条线也就是每个series对应一个y轴，每个y轴对应一个dataZoom【纵向缩放原理其实就是借用的echarts 的dataZoom功能实现的】<br/>
            2.在取得chart 实例后，最后调用initYZoom方法开启纵向缩放功能，内部需要chart 实例绑定事件，如click, 缩放，legend点击<br/>
            3.这里组件通过mixin的方式嵌入到基础chart中【也可以单独抽离成js文件引入，但是需要在合适的地方将内部用于节流的定时器清除,vue 的$set也要修改，然后自己找准时机将chart更新】<br/>
            4.组件支持使用多个x轴，保留缩放功能，但在高亮时禁用内部x轴缩放<br/>
          </div>

          <div style="background: rgba(151,155,248,0.31);">
            <p style="color: red;font-weight: bold;">下面是组件开发要点，写出自己的组件：</p>
            <p style="color: red;">一、点击线条进行拖拽缩放功能点</p>
            1.点击线条高亮，这里采用的是降低其他线条的透明度<br/>
            2.初始可以缩放，初始时需要重新更改y轴的max和min，扩大范围<br/>
            3.在y轴缩放时需要将dataZoom事件返回的start，end换算为 startValue 和 endValue，因为start，end是百分比，我们扩大了纵向的范围的，不能使用百分比<br/>
            4.为了不让x轴跳动，组件内设置x轴的onZero为false，脱离y轴0刻度<br/>
            5.保留x轴缩放功能，内部缩放的方式在高亮时被禁用，slider方式无限制<br/>
            <p style="color: red;">二、扩展功能，可以定时刷新图表需要考虑的功能点有：</p>
            1.需要保证选择线的高亮不变<br/>
            2.y轴缩放不变<br/>
            3.x轴缩放不变<br/>
            4.legend的选中状态不变<br/>
            以上功能都需要在各自触发时将信息存储起来,由组件内部会在合适的地方记录这些信息，initYZoom方法第三个参数是是否开启状态继承，默认是true，即后续chart更新将保留之前的状态
          </div>

        </div>
      </div>

    </div>

  </div>
</template>

<script>
import dragLineChart from '@/components/chart/dragLineChart'

export default {
  name: 'eharts',
  components: {
    dragLineChart
  },
  data() {
    return {
      chartOption: {},

      chartData: [], // 记录chart原始数据
      chartDataMaxMin: { // 记录图表数据的上下限，格式{lineSeriesName:{max:xx,min:xx}}
      },
      chartInfoArr: [], // 显示右侧图表的上下限并可编辑
      timer: null
    }
  },
  methods: {
    // 范围内随机数
    rand(m, n) {
      return Math.ceil(Math.random() * (n-m) + m)
    },
    // 重新刷新chart
    changeUpLow() {
      let option = this.chartOption
      // console.log(option, 111)
      this.chartInfoArr.map(item => {
        this.chartDataMaxMin[item.seriesName] = { // 记录当前上下限
          max: +item.upper,
          min: +item.lower
        }
      })

      this.renderChart(this.chartData) // 修改上下限后重新渲染chart

    },

    // 显示上下限具体信息
    chartDataZoom(params, ulInfoArr) {
      // console.log(ulInfoArr, 3333)
      let {color} = this.getOption()
      let chartInfoArr = []
      ulInfoArr.seriesInfo.map(({seriesName, upper, lower}) => {
        this.chartDataMaxMin[seriesName] = { // 记录当前上下限
          max: upper,
          min: lower
        }
        let colorIndex = this.chartOption.series.findIndex(subItem => subItem.name === seriesName)
        chartInfoArr.push({
          color: color[colorIndex],
          seriesName,
          upper: (upper).toFixed(2),
          lower: (lower).toFixed(2)
        })
      })
      this.chartInfoArr = chartInfoArr
    },
    getOption() {
      let option = {
        tooltip: {
          trigger: 'axis'
        },
        legend: {},
        grid: [{
          show: false,
          left: '3%',
          right: '4%',
          bottom: 380,
          top: 50,
          containLabel: false
        },{
          show: false,
          left: '3%',
          right: '4%',
          bottom: 80,
          top: 400,
          containLabel: false
        }],
        xAxis: [{
          // scale:true,
          type: 'category',
          boundaryGap: false,
          splitLine: {show: false},
          gridIndex:0,
        },{
          // scale:true,
          type: 'category',
          boundaryGap: false,
          splitLine: {show: false},
          gridIndex:1,
        }],
        yAxis: [],
        series: []
      };
      return {
        option,
        color: [
          '#fab83e',
          '#e733a3',
          '#7482f2',
          '#51bcff',
          '#47d5e4',
        ]
      }
    },
    renderChart(resData) {
      this.chartData = resData // 记录原始数据
      // console.log(resData, 11)
      // option赋值
      let {option, color} = this.getOption()
      let yAxis = [] // y轴
      let dataZoom = [ // 缩放设置
        {
          type: 'inside',
          id: 'x-inside-zoom0',
          xAxisIndex: [0]
        },
        {
          type: 'slider',
          id: 'x-slider-zoom0',
          xAxisIndex: [0],
          top: 350,
          height:20,
        },
        {
          type: 'inside',
          id: 'x-inside-zoom1',
          xAxisIndex: [1]
        },
        {
          type: 'slider',
          id: 'x-slider-zoom1',
          xAxisIndex: [1],
          bottom:30,
          height:20
        }
      ]
      resData.map((item, index) => {
        let {data, name} = item
        let maxMin = this.chartDataMaxMin[name]
        let showLine = false
        let gridIndex = index < 2 ? 0 : 1 // 前面两条线放上面，后面的放下面
        yAxis.push({
          type: 'value',
          max: maxMin.max, // 上下浮动
          min: maxMin.min,
          axisLine: {show: showLine},
          axisTick: {show: showLine},
          axisLabel: {show: showLine},
          splitLine: {show: showLine},
          gridIndex: gridIndex,
        })
        option.series.push({
          name: name,
          type: 'line',
          triggerLineEvent: true,
          yAxisIndex: index,
          xAxisIndex:gridIndex,
          data: data,
          symbol: 'none',
          lineStyle: {
            color: color[index]
          },
          itemStyle: {
            color: color[index]
          },
          // animation:false
        })

        dataZoom.push({
          type: 'inside',
          // disabled: true,
          yAxisIndex: index,
        })

      })

      option.yAxis = yAxis
      option.dataZoom = dataZoom
      // console.log(option, 5555)
      this.chartOption = option

      // 以外部设置线的上下限为准，不使用内部的y方向上下限,两种方式
      // 方式一：通过设置keepAlive.seriesInfo为对象的方式覆盖原有状态,这样y轴的max和min可以不指定
      // this.$refs['dragLineChart'].initYZoom(this.chartOption, this.$refs['dragLineChart'].myChart, {
      //   // 以当前上下限为准，y轴上下限交由外部控制，不传则完全交由内部控制
      //   seriesInfo: Object.keys(this.chartDataMaxMin).map(seriesName => {
      //     return {
      //       seriesName,
      //       lower: +this.chartDataMaxMin[seriesName].min,
      //       upper: +this.chartDataMaxMin[seriesName].max
      //     }
      //   })
      // })

      // 方式二：通过设置keepAlive.seriesInfo为false的方式,这样内部将以y轴的max，min作为上下限，因为这里手动维护了chartDataMaxMin
      this.$refs['dragLineChart'] && this.$refs['dragLineChart'].initYZoom && this.$refs['dragLineChart'].initYZoom(this.chartOption, this.$refs['dragLineChart'].myChart, {seriesInfo:false})
    },
    getChartData() {
      // 构造测试数据
      let resData = []
      for (let j = 0; j <= 4; j++) {
        resData.push({
          name: `line${j + 1}`,
          data: []
        })
      }
      for (let i = 1; i < 300; i++) {
        resData[0].data.push([i, this.rand(30, 100)])
        resData[1].data.push([i, this.rand(-30, -3)])
        resData[2].data.push([i, this.rand(5000, 6000)])
        resData[3].data.push([i, this.rand(0, 10)])
        resData[4].data.push([i, this.rand(800, 900)])
      }

      // 构造初始数据的上下限
      resData.map(item => {
        let dataY = item.data.map(item => item[1])
        let max = Math.max(...dataY)
        let min = Math.min(...dataY)
        let jc = Math.abs(max - min)

        this.chartDataMaxMin[item.name] = {
          max: max + 0.1 * jc, // 上下浮动
          min: min - 0.1 * jc,
        }
      })

      this.renderChart(resData)
    },
    // 定时任务相关 start --------------------

    // 清除定时器
    clearTimerTick() {
      this.timer && clearTimeout(this.timer)
      this.timer = null
    },
    // 开启定时任务，模拟定时刷新数据的情况，
    openTimerTick(bool) {
      if (bool) {
        this.timer = setTimeout(() => {
          // 构造测试数据
          let resData = this.chartData
          let x = resData[0].data[resData[0].data.length - 1][0] + 1
          // 末尾追加一项
          resData[0].data.push([x, this.rand(30, 100)])
          resData[1].data.push([x, this.rand(-30, -3)])
          resData[2].data.push([x, this.rand(5000, 6000)])
          resData[3].data.push([x, this.rand(0, 10)])
          resData[4].data.push([x, this.rand(800, 900)])

          // 删除首项
          resData.map(item => {
            item.data = item.data.slice(1)
          })
          this.renderChart(resData)

          this.openTimerTick(true)
        }, 1000)
      } else {
        this.clearTimerTick()
      }
    },

    // 定时任务相关 end --------------------

  },
  mounted() {
    this.getChartData()
  },
  beforeDestroy() {
    this.clearTimerTick()
  }
}
</script>

<style scoped lang="less">
.wrap {
  background: #f8f8f8;
  overflow: hidden;
  display: flex;
  justify-content: space-around;
  /*flex-direction: ;*/
  flex-wrap: wrap;
  align-items: center;
}

.line-chart {
  width: 100%;
  height: 330px;
  flex: auto;
}

.com-box {
  margin: 60px;
  width: 100%;
  background: rgba(255, 255, 255, 1);
  box-shadow: -.02rem .07rem .15rem 1px rgba(203, 204, 204, 0.18);
  border-radius: .03rem;
  /*margin: 20px auto;*/
  box-sizing: border-box;
  padding: 15px 60px;
  /deep/ .el-input__inner{
    height: 35px;
    line-height: 35px;
  }
}

.info {
  font-size: 20px;
  text-align: left;
  width: 1000px;
  margin-right: 10px;
  line-height: 40px;
  border: 1px solid #cccccc;
  box-sizing: border-box;
  padding: 5px;
}

.flex-box {
  display: flex;
  justify-content: space-between;
  align-content: flex-start;
  margin-top: 10px;
}

.input-box {
  display: flex;
  justify-content: space-between;
  align-content: center;
  margin-bottom: 5px;

  > span {
    align-self: center;
    flex: none;
    width: 50px;
    margin-right: 5px;
  }
}

.content-info{
  text-align: left;
  line-height: 30px;
  font-size: 16px;
  >div{
    padding: 10px;
  }

}
</style>
