<!--
可拖拽组件
-->
<template>
  <div class="chart-base">
    <div style="width:100%;height:100%;" :id="id" ref="chartRef"></div>
    <div v-if="isChartNull(option)" class="noData">暂无数据</div>
  </div>
</template>
<script>
  import * as echarts from 'echarts'
import dragLineMixin from './dragLineMixin'

export default {
  name: 'dragLineChart',
  mixins: [dragLineMixin],
  data() {
    return {
      myChart: '',
    }
  },
  props: {
    id: {
      type: String,
      default: 'ChartBox'
    },
    option: {
      type: Object,
      default() {
        return {}
      }
    }
  },
  mounted() {
    // this.myChart = this.$echarts.init(this.$refs.chartRef)
    this.myChart = echarts.init(this.$refs.chartRef)
    this.drawLine()
    // this.initEvent() // event
  },
  methods: {
    isChartNull(chartOption) {
      let bool = true
      if (chartOption && chartOption.series) {
        if (Object.prototype.toString.call(chartOption.series) === '[object Array]') {
          chartOption.series.map(item => {
            if (item.data && item.data.length) bool = false
          })
        } else {
          chartOption.series.data && chartOption.series.data.length && (bool = false)
        }
      }
      return bool
    },

    initEvents() {
      this.myChart.on('dataZoom', (params) => {
        this.$emit('dataZoom', params)
      })
    },
    drawLine() { // 绘制图表
      this.myChart.clear()
      this.myChart.setOption(this.option)

      this.initEvents()
    },
    resetChartData() { // 刷新数据
      this.myChart.setOption(this.option, true)
    },
    /*    showLoading() { // 显示加载动画
          this.myChart.showLoading()
        },
        hideLoading() { // 关闭加载动画
          this.myChart.hideLoading()
        } */
  },
  watch: {
    option: {
      deep: true,
      handler: function (value) {
        this.resetChartData()
      }
    }
  },
  beforeDestroy() {
    this.myChart && this.myChart.dispose()
  }
}
</script>
<style scoped>
.chart-base {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: initial;
}

.noData {
  width: 200px;
  height: 100px;
  line-height: 100px;
  position: absolute;
  left: 50%;
  top: 50%;
  margin-left: -100px;
  margin-top: -50px;
  font-size: 28px;
}
</style>
