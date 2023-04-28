<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
  import {reCharts} from './utils/index'
export default {
  name: 'App',
  mounted() {
    reCharts.windowListenResizeECharts()
  },
  beforeDestroy() {
    reCharts.windowRemoveResizeECharts()
  }
}
</script>

<style>
  #app{
    width: 100%;
    height: 100%;
  }
</style>
