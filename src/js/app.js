require( [
    'js/lib/vue.js',
    'http://cdn.bootcss.com/fastclick/1.0.3/fastclick.min.js',
    'js/store.js',
    'js/util.js',
    'js/nav.js'
], function(Vue, FastClick, Store) {   
    'use strict';
    console.log("module app loaded..");
    
    
    // Filters
    Vue.filter('getDay', function (_dateStr) {
        var _date = new Date(_dateStr),
            _day = _date.getDay(),
            _dayMap = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    
        return _dayMap[_day];
    });
    
    Vue.filter('getDayType', function (_dateStr) {
        var _diff = getDateDiff(_dateStr, getTodayDate()),
            _dayMap = ["今天", "明天", "后天", "大后天", "第五天", "第六天", "第七天", "下周今天"];
        
        if (_dayMap[_diff]) {
            return _dayMap[_diff];
        } else {
            return _diff > 0 ? (_diff + "天后") : (-_diff + "天前");
        }
    });
    
    
    /**
     * App 的全局状态
     *
     * @enum state
     */
    var states = {
        INPUT : "INPUT",
        LIST  : "LIST"
    }
    
    /**
     * App 
     * 
     * app.js
     */    
    var app = new Vue({
        el: '#app',
        data: {
            appName: "BusyWeek!",
            loaded: false,
            state:states.LIST,
            
            /**
             * Todo 类
             *
             * @class todo
             */
            newTodo: {
                date: getTodayDate(),
                dayType: '0',
                done: false,
                text: ''
            },
            
            /**
             * 时间轴 Map 对象
             *
             * @object Timeline  { date: {DayObject} }        
             * @object DayObject { date: {Date}, todos: [{Todo}] }
             * @object Todo      { date: {Date}, dayType: {Number}, done: {Bool}, text:{String}}
             */
            timeline: todoStorage.fetch(),
            
            /**
             * 当前过滤器
             * 
             * @param {string} all
             * @param {string} done
             * @param {string} active
             */
             activeFilter: "all"

        },
        created: function () {
            this.detectLanguage();
        },
        ready: function () {
            
            // store _timeline
            this.$watch('timeline', function (_timeline) {
                //console.log(JSON.stringify(_timeline));
                todoStorage.save(_timeline);
            }, true);
    
            // vue 11+ 解决了死循环 watch 的稳定问题 (oldVal = newVal && break;)
            this.$watch('newTodo.dayType', function (_dayType, _dayType_old) {
                var _dateStr = getDiffDate(_dayType);
                this.newTodo.date = _dateStr;
            });
            
            this.$watch('newTodo.date', function (_date, _date_old) {
                var _diff = getDateDiff(_date, getTodayDate());
                if (_diff >= 0 && _diff <= 7) {
                    this.newTodo.dayType = String(_diff);
                }
            });
            
            // App.loaded 
            console.log("vue working...");
            this.loaded = true;
        },
        
        methods: {
            
            onActionAdd: function(e){
                this.state = (this.state == "LIST" ) ? states.INPUT : states.LIST;
            },
            
            // Todo 
            addTodo: function (e) {
                e.preventDefault()
                
                var _new = this.newTodo,
                    _date = _new.date,
                    _dayType = _new.dayType,
                    _timeline = this.timeline; 
                
                // change state and update view
                this.state = states.LIST;
                
                // calculate the newTodo position
                var sorted = (function(){
                    var arr = [];
                    for(var key in _timeline){
                        arr.push(key);
                    }
                    return arr.sort(function(a,b){
                        return a === b ? 0 : a > b ? 1 : -1
                    })
                })()
                
                var before = (function(){
                    var arr = [];
                    sorted.forEach(function(val){
                        if(val <= _date){
                            arr.push(val);
                        }
                    })
                    return arr;
                })()
                
                var position = (function(){
                    var day = before.length,
                        items = 0;
                    
                    before.forEach(function (date) {
                        var dayList = _timeline[date];
                        items += dayList.todos.length;
                    }) 
                    
                    //console.log("day:"+day+" items:"+items);
                    
                    return day*36+(items+7)*48+58;
                })()
                
                var scrollY = (function(){
                    var edge = window.innerHeight || window.screen.availHeight;
                    
                    if(position < edge){
                        return 0;
                    }else{
                        return position - edge;
                    }
                })()
                
//                console.log(before);
//                console.log("position:"+ position);
//                console.log("scrollTo:"+ scrollY);
                
                
                // jump to the target Scroll Position at NEXT View Update
                // this method falls back to setTimeout(fn, 0)
                Vue.nextTick(function(){ 
                    scroll(0,scrollY);
                    
//                    console.log("document.body.clientHeight"+document.body.clientHeight);
//                    console.log("document.body.offsetHeight"+document.body.offsetHeight);
//                    console.log("window.innerHeight"+window.innerHeight);
//                    console.log("window.outerHeight"+window.outerHeight);
//                    console.log("window.screen.height"+window.screen.height);
//                    console.log("window.screen.availHeight"+window.screen.availHeight);
                })
                
                
                // set default todo text 
                if (!this.newTodo.text) {
                    this.newTodo.text = "写点啥呀！"
                }
    
                // create new dayObject in timeline
                if (!_timeline[_date]) {
                    _timeline.$add(_date, {
                        date: _date,
                        todos: []
                    })
                }
    
                // push newTodo to corresponding dayObject
                _timeline[_date].todos.push(this.newTodo);
    
                // reset newTodo
                this.newTodo = {
                    dayType: _dayType,  //
                    date: _date,        // save date 
                    text: '',
                    done: false
                }
    
            },
            removeTodo: function (todo) {
                // remove todo
                this.timeline[todo.date].todos.$remove(todo.$data);
    
                // if day empty
                if (this.timeline[todo.date].todos.length == 0) {
                    this.timeline.$delete(todo.date);
                }
            },
            checkTodo: function (todo) {
                todo.done = !todo.done;
            },
            editTodo: function (todo) {
    
            },
            hackCheckbox: function (e) {
                return false;
            },
            enterInputMode: function (e) {
                //this.inputMode = true;
            },
            exitInputMode: function (e) {
                //this.inputMode = false;
            },
            ifToday: function (_dateStr) {
                if (_dateStr == getTodayDate()) {
                    return true;
                }
                return false;
            },
            // if todo show in activeFilter
            ifTodoShow: function(done){
                if (this.activeFilter == "active"){
                    return !done;
                }else if(this.activeFilter == "done"){
                    return done;
                }else{
                    return true;
                }
                
            },
            // if day show in activeFilter
            ifDayShow: function(todos){
                
                var activeTodos = todos.filter(function(todo){
                    return !todo.done
                })
                
                // 完成数与活动数
                var actives = activeTodos.length;
                var dones = todos.length - actives;
               
                // 只要有未完成的，今天就需要显示
                if (this.activeFilter == "active"){
                    if(actives > 0){
                        return true;
                    }else{
                        return false;
                    }
                
                // 只要有完成的，今天就需要展示
                }else if(this.activeFilter == "done"){
                    if (dones > 0) {
                        return true;
                    }else{
                        return false;
                    }
                }else{
                    return true;
                }
               
            },
            // export to scope
            getDiffDate: function(_dayType){
                return getDiffDate(_dayType)
            },
            detectLanguage: function(){
                var _nav = navigator;
                var _lang = (_nav.language || _nav.browserLanguage || _nav.userLanguage || "").substr(0, 2);
            
                if (_lang == "zh") {
                    this.appName = "好忙啊";
                }
            }
            
    
        }
    })
    

    // export app to global
    window.vue = Vue;
    window.app = app;
    
    // deal with load
    //app.loaded = true;
    
    // FastClick
    FastClick.attach(document.body);
    console.log("fastclick working...");
});



