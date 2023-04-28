<template>
  <div class="main">
    <el-menu :default-active="activeIndex" mode="horizontal" router>
      <el-menu-item index="dragZoomLine">拖拽缩放配置chart上下限</el-menu-item>
    </el-menu>
    <div class="content">
      <router-view/>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      activeIndex:'dragZoomLine'
    }
  }
}
</script>

<style scoped lang="less">
  .main{
    width: 100%;
    height: 100%;
    .content{
      width: 100%;
      height: calc(100vh - 62px);
    }
  }
</style>
