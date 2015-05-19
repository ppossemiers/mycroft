var mycroft = (function(){
    var editor = CodeMirror.fromTextArea(document.getElementById('codeEditor'), { mode: 'javascript', theme: 'default' });
    editor.setSize(850, 300);
	return{
        eval: function(questionNr){
            var input = editor.getValue();
            if(input === ''){ return; }
            var console = document.getElementById('consoleStyled');
            var newLine = '';
            if(input.indexOf('console.log') > -1 || input.indexOf('alert') > -1){ newLine = '\n'; }
            var input2 = input.replace(/console.log/g, 'document.getElementById("consoleStyled").value+="> "+');
            var input3 = input2.replace(/alert/g, 'document.getElementById("consoleStyled").value+="> "+');
            var result = '';
            try{ 
                result = eval(input3);
                console.value += newLine + '> ' + result + '\n';
            }
            catch(error){
               console.value += newLine + '> ' + error + '\n';
               return;
            }
            var formData = 'input=' + encodeURIComponent(input) + '&';
            formData += 'result=' + encodeURIComponent(result) + '&';
            formData += 'console=' + encodeURIComponent(console.value);
            window.location.replace('/question?nr=' + questionNr + '&eval=1&' + formData);
        }
     }
})();