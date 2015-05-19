/*
(c) 2014 +++ Philippe Possemiers, ppossemiers@telenet.be +++
THIS CODE IS FREE - LICENSED UNDER THE MIT LICENSE
ACTIVE URL: https://github.com/ppossemiers/mycroft
*/

var tl_NL = {};
tl_NL.save = 'Uw resultaten werden opgeslagen';
tl_NL.test = 'Verkeerde testnaam';
tl_NL.pwd = 'Verkeerd paswoord';
tl_NL.pwdchanged = 'Uw paswoord is veranderd';
tl_NL.email = 'Verkeerd email adres';
tl_NL.send = 'Uw paswoord kon niet worden verstuurd';
tl_NL.sent = 'Gelieve uw email te checken. Vergeet ook niet in de spam te kijken.';
tl_NL.notfound = 'Vraag niet gevonden';
tl_NL.wrong = 'Niet correct';
tl_NL.evals = 'U hebt het maximum aantal evaluaties bereikt';
tl_NL.correct = 'Correct!';
tl_NL.checkcorrect = 'correct';
tl_NL.checknotcorrect = 'niet correct';
tl_NL.questionsaved = 'De vraag werd opgeslagen';
tl_NL.questiondeleted = 'De vraag werd verwijderd';
var tl_EN = {}
tl_EN.save = 'Your results have been saved';
tl_EN.test = 'Wrong testname';
tl_EN.pwd = 'Wrong password';
tl_EN.pwdchanged = 'Your password has been changed';
tl_EN.email = 'Wrong email address';
tl_EN.send = 'Your password could not be sent';
tl_EN.sent = 'Please check your email. Do not forget to check your spam folder.';
tl_EN.notfound = 'Question not found';
tl_EN.wrong = 'Not correct';
tl_EN.evals = 'You have reached the maximum amount of evaluations';
tl_EN.correct = 'Correct!';
tl_EN.checkcorrect = 'correct';
tl_EN.checknotcorrect = 'not correct';
tl_EN.questionsaved = 'The question has been saved';
tl_EN.questiondeleted = 'The question has been deleted';

function compare(arr1, arr2){
  if (arr1.length != arr2.length){ return false; }
  for(var i = 0, l=arr1.length; i < l; i++) {
    if(arr1[i] instanceof Array && arr2[i] instanceof Array){
      if(!arr1[i].compare(arr2[i])){ return false; }
    }
    else if(!isEqual(arr1[i], arr2[i])){ return false; }
  }
  return true;
}

function isEqual(object1, object2){
  //First check types
  for(propName in object1){
    if(object1.hasOwnProperty(propName) != object2.hasOwnProperty(propName)){ return false; }
    else if (typeof object1[propName] != typeof object2[propName]){ return false; }
  }
  // Now check details
  for(propName in object2){
    if(object1.hasOwnProperty(propName) != object2.hasOwnProperty(propName)) { return false; }
    else if(typeof object1[propName] != typeof object2[propName]) { return false; }
    if(!object1.hasOwnProperty(propName)){ continue; }

    if(object1[propName] instanceof Array && object2[propName] instanceof Array) {
      if(!compare(object1[propName], object2[propName])){ return false; }
    }
    else if(object1[propName] instanceof Object && object2[propName] instanceof Object) {
      if(!isEqual(object1[propName], object2[propName])){ return false; }
    }
    // Normal value comparison for strings and numbers. Don't check variable names.
    else if(object1[propName] != object2[propName] && propName != 'name'){
      //console.log(object1[propName] + ' / ' + object2[propName]);
      return false; 
    }
  }
  return true;
}

function getMsg(obj, lang){
  if(lang === 'NL'){ return obj.msg_NL; }
  else{ return obj.msg_EN; }
}

function getTranslation(key, lang){
  if(lang === 'NL'){ return tl_NL[key]; }
  else{ return tl_EN[key]; }
}

function calculateResult(req){
  var score = 0;
  var percent = 0;
  var result = {};
  result.type = 'result';
  result.name = req.session.user_name;
  result.checks = req.session.checks;
  result.test = req.session.test;
  var d = new Date();
  result.date = d.toUTCString();
  result.checks = req.session.checks;
  for(var i = 0; i < req.session.checks.length; i++){ score += req.session.checks[i].points; }
  result.score = score;
  percent = Math.round((score / req.session.allQuestions.length) * 100);
  result.percent = percent;
  return result;
}

function preCheck(req, res){
  var check = true;
  var time = new Date();
  if(!req.session.user_name || req.session.user_name == ''){
    check = false;
    res.redirect('/logout');
  }
  var diff = time.getTime(time) - req.session.start;
  if(req.session.duration <= diff){
    check = false;
    res.redirect('/logout');
  }
  return check;
}

function shuffle(o){
  for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
}

exports.compare = compare;
exports.isEqual = isEqual;
exports.getMsg = getMsg;
exports.getTranslation = getTranslation;
exports.calculateResult = calculateResult;
exports.preCheck = preCheck;
exports.shuffle = shuffle;

