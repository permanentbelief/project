// components/Tabs/Tabs.js
Component({
    /**
     * 组件的属性列表
     */
    // 存放要接收父元素的数据 
    properties: {
        // 属性名 对象类型 Array数组
        tabs: {
            type: Array,
            value: []
        }
    },

    /**
     * 组件的初始数据
     */
    data: {

    },

    /**
     * 组件的方法列表
     */
    methods: {
        //定义点击事件   子组件的点击事件
        handleItemTap(e) {
            console.log("子组件的点击事件", e)
            const { index } = e.currentTarget.dataset;
            console.log("子组件的点击事件中的index", index)
            //2. 触发父组件中的事件， 自定义
            this.triggerEvent("tabsItemChange", { index });
        }
        //1. 获取点击的索引

    }
})