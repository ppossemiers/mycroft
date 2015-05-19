var mycroft = (function(){
   var editor1 = CodeMirror.fromTextArea(document.getElementById('codeEditor1'), { lineNumbers: true, mode: 'javascript', theme: 'default' });
   editor1.setSize(650, 300);
   var editor2 = CodeMirror.fromTextArea(document.getElementById('codeEditor2'), { lineNumbers: true, mode: 'javascript', theme: 'default' });
   editor2.setSize(650, 300);
	return{
         save: function(questionNr){
            var code1 = editor1.getValue();
            var code2 = editor2.getValue();
            var msg = document.getElementById('msgEditor').value;
            var result = document.getElementById('result').value;
            var formData = '&code1=' + encodeURIComponent(code1);
            formData += '&code2=' + encodeURIComponent(code2);
            formData += '&msg=' + encodeURIComponent(msg);
            formData += '&result=' + encodeURIComponent(result);
            formData += '&save=1';
            window.location.replace('/editQuestion?nr=' + questionNr + formData);
         },
         delete: function(questionNr){
            window.location.replace('/editQuestion?nr=' + questionNr + '&save=0');
         }
    }
})();