
$(function() {
    var htmlCm, jsCm, consoleCm;
    
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
        if((!step) && this.data.writeMode){
          step = {};
          steps.push(step);
        }
        this.set({
          'step': step
        , stepIndex: index + 1
        , hasFixCode: !step.fixCode
        });
        htmlCm.setValue($('#template').val());
        jsCm.setValue($('#javascript').val())
        consoleCm.setValue($('#console').val())
        step.autorun && this.run();
      }
    , setChapter: function(title, stepIndex) {
        var index, chapter, tutorials = this.data.tutorials;
        if(typeof title === 'number'){
          index = title;
        }else{
          tutorials.forEach(function(chapter, i) {
            if(chapter.title === title){
              index = i;
            }
          });
          index = index || 0;
        }
        chapter = tutorials[index];
        
        if((!chapter) && this.data.writeMode){
          chapter = {steps: []};
          tutorials.push(chapter);
        }
        
        this.set({'chapter': chapter, chapterIndex: index + 1});

        if(stepIndex){
          this.setStep(stepIndex);
        }else{
          this.setStep(0);
        }
      }
    });
    
    !window.notSupport && $.ajax('data.json', {dataType: 'json'}).done(function(data){
      
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
          }
      
      var tutor = new TuTor($('.container')[0], {
        data: {tutorials:tutorials, writeMode: false}
      , events: {
          'keypress textarea': executeHandler
        , 'click button': executeHandler
        , 'click #prev-step': function() {
            if(this.data.stepIndex > 1){
              this.setStep(this.data.stepIndex - 2);
            }
          }
        , 'click .next-step': function() {
            if(this.data.stepIndex < this.get('chapter.steps').length || this.data.writeMode){
              this.setStep(this.data.stepIndex);
            }else{
              $(this.el).find('#next-chapter').trigger('click');
            }
          }
        , 'click #prev-chapter': function() {
            if(this.data.chapterIndex > 1){
              this.setChapter(this.data.chapterIndex - 2);
            }
          }
        , 'click #next-chapter': function() {
            if(this.data.chapterIndex < this.get('tutorials').length || this.data.writeMode){
              this.setChapter(this.data.chapterIndex);
            }
          }
        , 'click .fixcode': function(e){
            if(!$(e.target).hasClass('disabled') && this.data.step.fixCode){
               this.data.step.fixCode.html && htmlCm.setValue(this.data.step.fixCode.html);
               this.data.step.fixCode.javascript && jsCm.setValue(this.data.step.fixCode.javascript);
               this.data.step.fixCode.console && consoleCm.setValue(this.data.step.fixCode.console);
               this.run();
            }
          }
        , 'click #reset': function(e){
            this.setStep(this.data.stepIndex - 1);
          }
          
          //编辑模式 only
        , 'click #save': function() {
            var step = {
                  note: $('#notes').html()
                , fixCode: {}
                }
              , html = htmlCm.getValue()
              , js = jsCm.getValue()
              , console = consoleCm.getValue()
              ;
            
            html && ((this.get('isFixHTML') ? step.fixCode : step).html = html);
            js && ((this.get('isFixJavascript') ? step.fixCode : step).javascript = js);
            console && ((this.get('isFixConsole') ? step.fixCode : step).console = console);
            
            if(!this.data.isFixHTML && !this.data.isFixJavascript && !this.data.isFixConsole){
              delete step.fixCode;
            }
            this.set('step', step);
            localStorage.setItem('tutorials', JSON.stringify(this.data.tutorials))
          }
        , 'click #show': function() {
            $('#output').text((JSON.stringify(this.data.tutorials)));
          }
        , 'update': function(e, info) {
            if(info.step && ('noteMarked' in info.step)) {
              var that = this;
              marked(info.step.noteMarked, {}, function(err, html){
                err || that.set('step.note', html);
              });
            }
          }
        }
      });
      
      Ant.router.start({
        '*': function(info) {
          tutor.set('writeMode', info.searchObj && info.searchObj.write === 'true');
        }
      });
    });
});