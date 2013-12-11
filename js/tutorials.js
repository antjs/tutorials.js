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
        var chapter, tutorials = this.data.tutorials;
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
        , hasNextChapter: index < this.data.tutorials.length - 1 || this.data.writeMode
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
              note: $('#notes').html()
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
        this.data.tutorials[this.data.chapterIndex - 1].steps.splice(this.data.stepIndex - 1, 1, step);
        dataStr = JSON.stringify(this.data.tutorials)
        localStorage.setItem('tutorials', dataStr);
        return dataStr;
      }
    });
    
    !window.notSupport && $.ajax('data.json', {dataType: 'json'}).done(function(data){
      $('#loading').fadeOut();
      
      var tutorials = JSON.parse(localStorage.getItem('tutorials') || JSON.stringify(data) || '[{"steps":[{}]}]');
    
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
      
      tutor = new TuTor($('.container')[0], {
        data: {tutorials:tutorials, writeMode: false}
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
            if(this.data.chapterIndex < this.get('tutorials').length || this.data.writeMode){
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
            e.currentTarget.href = 'data:text/css,' + encodeURIComponent(this.save());
          }
        , 'update': function(e, info) {
            if(info && info.step && ('noteMarked' in info.step)) {
              var that = this;
              marked(info.step.noteMarked, {}, function(err, html){
                err || that.set('step.note', html);
              });
            }
          }
        }
      });
      
      router.start({
        '*': function(info) {
          var write = info.query.write === 'true'
          tutor.set('writeMode', write);
          if(write){
            this.autoSaveTimer = setInterval(function() { tutor.save() }, 30000);
          }else{
            clearInterval(this.autoSaveTimer);
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
    });
    
    marked.setOptions({
      highlight: function (code, lang) {
        return hljs.highlightAuto(code, lang).value;
      }
    });
});