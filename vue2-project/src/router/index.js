import Vue from 'vue'
import Router from 'vue-router'
import Main from '@/layout/Mian.vue'

// 页面
import DragZoomLine from '../views/echarts/DragZoomLine.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Main,
      children:[
        {
          path: 'dragZoomLine',
          name: 'dragZoomLine',
          component: DragZoomLine,
        }
      ]
    }
  ]
})
