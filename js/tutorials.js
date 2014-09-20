$(function() {
    var htmlCm, jsCm, consoleCm
      , router = Ant.router
      , tutor
      ;
      
    var TuTor = Ant.extend({
      //运行示例代码
      run: function() {
        var html = $('#output').html(htmlCm.getValue())[0];
        eval(jsCm.getValue());
        //同步控制台的作用域
        this.runConsole = function() {
          eval(consoleCm.getValue());
        };
      }
    , runConsole: function() {
        eval(consoleCm.getValue());
      }
    , init: function() {
        $('#loading').fadeOut();
        $(this.el).fadeIn();
        htmlCm = CodeMirror.fromTextArea(document.getElementById('template'), {
          lineNumbers: true
        , lineWrapping: true
        , mode: 'text/html'
        , theme: "base16-dark"
        , profile: 'xhtml'
        });
        
        jsCm = CodeMirror.fromTextArea(document.getElementById('javascript'), {
          lineNumbers: true
        , lineWrapping: true
        , mode: 'javascript'
        , theme: "base16-dark"
        });
        
        consoleCm = CodeMirror.fromTextArea(document.getElementById('console'), {
          lineNumbers: true
        , mode: 'javascript'
        , lineWrapping: true
        , theme: "base16-dark"
        });
        this.setChapter(0);
      }
    , setStep: function(index) {
        var steps = this.get('chapter').steps;
        var step = steps[index];
        index = index * 1;
        if((!step) && this.data.writeMode){
          step = {};
          steps.push(step);
        }
        this.set('step', step);
        this.set({
          stepIndex: index + 1
        , hasNextStep: index < this.data.chapter.steps.length - 1 || this.data.hasNextChapter || this.data.writeMode
        });
        htmlCm.setValue($('#template').val());
        jsCm.setValue($('#javascript').val())
        consoleCm.setValue($('#console').val())
        step.autorun && this.run();
        setTimeout(function(){ step.init && eval(step.init); }, 0);
      }
    , setChapter: function(index, stepIndex) {
        var chapter, tutorials = this.data.tutorial.list;
        index = index * 1;
        if(isNaN(index)){
          return;
        }
        chapter = tutorials[index];
        
        if((!chapter) && this.data.writeMode){
          chapter = {steps: []};
          tutorials.push(chapter);
        }
        this.set('chapter', chapter);
        this.set({
          chapterIndex: index + 1
        , hasNextChapter: index < this.data.tutorial.list.length - 1 || this.data.writeMode
        });

        if(stepIndex * 1){
          this.setStep(stepIndex);
        }else{
          this.setStep(0);
        }
      }
    , navigate: function(hash) {
        router.navigate(hash + (this.data.writeMode ? '?write=true' : ''));
      }

      //保存数据到 localStorage
    , save: function(){
        var step = {
              note: this.data.step.note
            , init: this.data.step.init
            , autorun: this.data.step.autorun
            , fixCode: {}
            }
          , html = htmlCm.getValue()
          , js = jsCm.getValue()
          , console = consoleCm.getValue()
          , dataStr
          ;
        
        (this.get('isFixHTML') ? step.fixCode : step).html = html || undefined;
        (this.get('isFixJavascript') ? step.fixCode : step).javascript = js || undefined;
        (this.get('isFixConsole') ? step.fixCode : step).console = console || undefined;
        
        if(!this.data.isFixHTML && !this.data.isFixJavascript && !this.data.isFixConsole){
          delete step.fixCode;
        }
        this.data.tutorial.list[this.data.chapterIndex - 1].steps.splice(this.data.stepIndex - 1, 1, step);
        dataStr = JSON.stringify(this.data.tutorial)
        localStorage.setItem('tutorial-' + filePath, dataStr);
        return dataStr;
      }
    });
    
    var query = router.urlParse(location.query, true).query
      , filePath = query.data || 'data.json'
      , fileName
      ;
    
    fileName = filePath.split('/');
    fileName = fileName[fileName.length - 1].replace(/\?.+$/, '');
    
    if(!window.notSupport){
      var plain = '{"list": [{"steps": []}], "title": "教程示例"}';
    
      $.ajax(filePath, {dataType: 'json'}).always(function(data, stat) {
        if(stat !== 'success') {
          data = void(0);
        }
        init(JSON.parse(localStorage.getItem('tutorial-' + filePath) || JSON.stringify(data) || plain));
      });
    }
    
    function init(tutorial){
      var executeHandler = function(e) {
        that = this;
        if(e.ctrlKey && e.keyCode === 13 || e.type == 'click'){
          var $target = $(e.target);
          if($target.parents('.javascript').length){
            that.run();
          }else if($target.parents('.console').length){
            that.runConsole();
          }
        }
      };
      
      window.tutor = tutor = new TuTor($('.container')[0], {
        data: {
          tutorial:tutorial
        , fileName: fileName
        , canDownload: 'download' in document.createElement('a')
        }
      , filters: {
          marked: function(note) {
            return marked(note);
          }
        }
      , events: {
          'keypress textarea': executeHandler
        , 'click button': executeHandler
        , 'click #prev-step': function() {
            if(this.data.stepIndex > 1){
              //this.setStep(this.data.stepIndex - 2);
              this.navigate(this.data.chapterIndex + '/' + (this.data.stepIndex - 1))
            }
          }
        , 'click .next-step': function() {
            if(this.data.stepIndex < this.get('chapter.steps').length || this.data.writeMode){
              //this.setStep(this.data.stepIndex);
              this.navigate(this.data.chapterIndex + '/' + (this.data.stepIndex + 1));
            }else{
              $(this.el).find('#next-chapter').trigger('click');
            }
          }
        , 'click #prev-chapter': function() {
            if(this.data.chapterIndex > 1){
              //this.setChapter(this.data.chapterIndex - 2);
              this.navigate(this.data.chapterIndex - 1);
            }
          }
        , 'click #next-chapter': function() {
            if(this.data.chapterIndex < this.get('tutorial.list').length || this.data.writeMode){
              //this.setChapter(this.data.chapterIndex);
              this.navigate(this.data.chapterIndex + 1);
            }
          }
        , 'click .fixcode': function(e){
            if(!$(e.target).hasClass('disabled') && this.data.step.fixCode){
               this.data.step.fixCode.html && htmlCm.setValue(this.data.step.fixCode.html);
               this.data.step.fixCode.javascript && jsCm.setValue(this.data.step.fixCode.javascript);
               this.data.step.fixCode.console && consoleCm.setValue(this.data.step.fixCode.console);
            }
          }
        , 'click #reset': function(e){
            this.setStep(this.data.stepIndex - 1);
          }
          
          //编辑模式 only
        , 'click #save': function(e) {
            this.save();
          }
        , 'click #download': function(e) {
            e.currentTarget.href = 'data:text/json,' + encodeURIComponent(this.save());
          }
        , 'click .write-pad .nav-tabs li:not(.active)': function(e) {
            var $li = $(e.currentTarget)
              , index = $li.index()
              ;
              
            $li.siblings('.active').removeClass('active');
            $li.addClass('active');
            
            $('.write-pad .tab-content .tab-pane').removeClass('active').eq(index).addClass('active');
          }
        }
      , watchers : {
          'tutorial.title': function(val) {
            document.title = val;
          }
        }
      });
      
      tutor.init();
      
      router.start({
        '*': function(info) {
          var write = info.query.write === 'true'
          tutor.set('writeMode', write);
          clearInterval(this.autoSaveTimer);
          
          if(write){
            this.autoSaveTimer = setInterval(function() { tutor.save() }, 30000);
          }
        }
      , ':chapter/:step?': function(info) {
          var params = info.params
            , chapter = params.chapter - 1
            , step = (params.step ? params.step : 1) - 1
            ;
            
          tutor.setChapter(chapter, step);
        }
      });
    };
    
    marked.setOptions({
      highlight: function (code, lang) {
        return hljs.highlightAuto(code, lang).value;
      }
    });
});