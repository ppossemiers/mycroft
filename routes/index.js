/*
(c) 2014 +++ Philippe Possemiers, ppossemiers@telenet.be +++
THIS CODE IS FREE - LICENSED UNDER THE MIT LICENSE
ACTIVE URL: https://github.com/ppossemiers/mycroft
*/

var express = require('express');
var router = express.Router();
var helper = require('./helper');

/* GET home page. */
router.get('/', function(req, res, next){
  res.redirect('/login');
});

/* GET login page. */
router.get('/login', function(req, res){
  var l = req.query.lang;
  if(l === 'NL' || l === 'nl'){ req.session.lang = 'NL'; }
  else if(l === 'PL' || l === 'pl'){ req.session.lang = 'PL'; }
  else{ req.session.lang = 'EN'; }
  res.render('login_' + req.session.lang);
});

/* GET logout page. */
router.get('/logout', function(req, res){
  if(!req.session.user_name){ res.redirect('/login'); }
  else if(!req.session.checks){ res.redirect('/login'); }
  else if(req.session.admin){
    delete req.session.admin;
    res.redirect('/login');
  }
  else{
    db.view('views', 'result_by_name', { keys: [req.session.user_name] },  function(err, body){
      if(!body.rows[0]){
        var result = helper.calculateResult(req);
        db.insert(result);
        res.render('blank_' + req.session.lang, { message: helper.getTranslation('save', req.session.lang) });
      }
      else{ res.redirect('/login'); }
      delete req.session.user_name;
      delete req.session.allQuestions;
      delete req.session.theQuestion;
      delete req.session.test;
    });
  }
});

/* POST login page. */
router.post('/doLogin', function(req, res){
  var post = req.body;
  db.view('views', 'student_by_email', { keys: [post.email.toLowerCase()] }, function(err, body){
    if(body.rows[0]){
      var user = body.rows[0].value;
      var sha1Pwd = crypto.createHash('sha1').update(post.password).digest('hex');
      if(sha1Pwd == user.password){
        req.session.user_name = user.name;
        db.view('views', 'config', function(err, body){
          if(post.test === 'admin' && _.find(body.rows[0].value.admin, function(e){ return e == req.session.user_name; })){
            res.redirect('editQuestion');
          }
          else{
            if(body.rows[0].value[post.test]){
              if(body.rows[0].value.shuffle == 1){ req.session.allQuestions = helper.shuffle(body.rows[0].value[post.test]); }
              else{ req.session.allQuestions = body.rows[0].value[post.test]; }
              req.session.evals = body.rows[0].value.evals;
              req.session.test = post.test;
              req.session.checks = [];
              for(var i = 0; i < req.session.allQuestions.length; i++){
                var check = {};
                check.nr = req.session.allQuestions[i];
                check.result = helper.getTranslation('checknotcorrect', req.session.lang);
                check.evals = 0;
                check.points = 0;
                req.session.checks[i] = check;
              }
              req.session.duration = body.rows[0].value.duration * 60 * 1000;
              var time = new Date();
              req.session.start = time.getTime(time);
              res.redirect('/question?nr=0&eval=0');
            }
            else{ res.render('login_' + req.session.lang, { error: helper.getTranslation('test', req.session.lang) }); }
          }
    	   });
      }
      else{ res.render('login_' + req.session.lang, { error: helper.getTranslation('pwd', req.session.lang) }); }
    }
    else{ res.render('login_' + req.session.lang, { error: helper.getTranslation('email', req.session.lang) }); }
  });
});

/* POST createPassword page. */
router.post('/doCreatePassword', function(req, res){
  var email = req.body.email.toLowerCase();
  var user = {};
  db.view('views', 'config', function(err, body){
    var domain = body.rows[0].value.domain;
    if(_.find(domain, function(e){ return email.substring(email.indexOf('@')+1, email.length) == e; })
          && email.indexOf(';') === -1){
      db.view('views', 'student_by_email', { keys: [email] }, function(err, body) {
        var clearPwd = randomstring = Math.random().toString(36).slice(-6);
        var sha1Pwd = crypto.createHash('sha1').update(clearPwd).digest('hex');
        if(body.rows[0]){
          user = body.rows[0].value;
          user.password = sha1Pwd;
        }
        else{
        	try{
        		var nameArray2;
  	        var nameArray1 = email.split('@');
  	        if(nameArray1[0].indexOf('.') > -1){ nameArray2 = nameArray1[0].split('.'); }
  	        else if(nameArray1[0].indexOf('-') > -1){ nameArray2 = nameArray1[0].split('-'); }
            else if(nameArray1[0].indexOf('_') > -1){ nameArray2 = nameArray1[0].split('_'); }
            else{ user.name = nameArray1[0]; }
            if(!user.name){ user.name = nameArray2[0].charAt(0).toUpperCase() + nameArray2[0].slice(1) + ' ' + nameArray2[1].charAt(0).toUpperCase() + nameArray2[1].slice(1); }
            else{ user.name = nameArray1[0]; }
  	        user.email = email;
  	        user.type = 'student';
  	        user.password = sha1Pwd;
  	      }
  	      catch(err){
            res.redirect('/logout');
          }
        }
        db.insert(user);

        res.mailer.send('email_' + req.session.lang, {
          to: email,
          subject: 'Mycroft',
          password: clearPwd,
          url: 'http://ap-mycroft.herokuapp.com/login?lang=' + req.session.lang
        }, function(err) {
            if(err){ res.render('login_' + req.session.lang, { error: helper.getTranslation('send', req.session.lang) }); }
        });
        res.render('login_' + req.session.lang, { msg: helper.getTranslation('sent', req.session.lang) });
      });
    }
    else{ res.render('login_' + req.session.lang, { error: helper.getTranslation('email', req.session.lang) }); }
  });
});

/* GET changePassword page. */
router.get('/changePassword', function(req, res){
  res.render('changePassword_' + req.session.lang);
});

/* POST changePassword page. */
router.post('/doChangePassword', function(req, res){
  var post = req.body;
  db.view('views', 'student_by_email', { keys: [post.email] }, function(err, body){
	 if(body.rows[0]){
	  	var user = body.rows[0].value;
	  	var old_sha1Pwd = crypto.createHash('sha1').update(post.old_password).digest('hex');
	  	if(old_sha1Pwd == user.password){
	  		var new_sha1Pwd = crypto.createHash('sha1').update(post.new_password).digest('hex');
	  		user.password = new_sha1Pwd;
			  db.insert(user);
	  		req.session.user_name = user.name;
	  		db.view('views', 'config',  function(err, body){
          res.render('changePassword_' + req.session.lang, { msg: helper.getTranslation('pwdchanged', req.session.lang) });
    		});
	  	}
	  	else{ res.render('changePassword_' + req.session.lang, { error: helper.getTranslation('pwd', req.session.lang) }); }
	}
	else{ res.render('changePassword_' + req.session.lang, { error: helper.getTranslation('email', req.session.lang) }); }
  });
});

/* GET question page. */
router.get('/question', function(req, res){
  if(helper.preCheck(req, res) === false){ return; }
  var questionNr = 0;
  if(req.query.nr){ questionNr = parseInt(req.query.nr); }
  if(questionNr < 0){ questionNr = 0; }
  // Load / Reload
  if(questionNr === req.session.allQuestions.length && req.query.eval == 0){ res.redirect('/result'); }
  else{
    var check = req.session.checks[questionNr];
    if(req.query.eval == 0){
    	db.view('views', 'question_by_nr', { keys: [req.session.allQuestions[questionNr]] }, function(err, body) {
    		if(body.rows[0]){
    			req.session.theQuestion = body.rows[0].value;
    			res.render('question_' + req.session.lang, { questionNr: questionNr+1, amtQuestions: req.session.allQuestions.length, evals: check.evals, maxEvals: req.session.evals,
                            code: req.session.theQuestion.code1, msg: helper.getMsg(req.session.theQuestion, req.session.lang), console: '' });
    		}
    		else{ res.render('blank', { message: helper.getTranslation('notfound', req.session.lang) }); }
    	});
    }
    // Eval
    else if(req.query.eval == 1){
      var func;
      var evalResult = true;
      // Parse and helper.compare if there is an 'eval', else only the result is checked.
      if(req.session.theQuestion.eval){
        // We have a parsed JS array
        if(req.session.theQuestion.eval instanceof Array){
          var arr1 = req.session.theQuestion.eval;
          var input2 = req.query.input.replace(/document.getElementById/g, '//document.getElementById');
          var arr2 = esprima.parse(input2).body;
          for(var i = 0; i < arr1.length; i++){
            switch(arr1[i].type){
              case 'ExpressionStatement':
                break;
              case 'TryStatement':
                break;
              case 'FunctionDeclaration':
                var elem = _.find(arr2, function(e){ if(e.type == 'FunctionDeclaration'){ return e.id.name == arr1[i].id.name; } });
                if(helper.isEqual(arr1[i], elem) == false){ evalResult = false; }
                break;
              case 'VariableDeclaration':
                break;
              default:
                console.log(arr1[i].type);
                break;
            }
          }
        }
      }
      check.code = req.query.input;
      if(check.evals >= req.session.evals){
        res.render('question_' + req.session.lang, { questionNr: questionNr+1, amtQuestions: req.session.allQuestions.length, evals: check.evals, maxEvals: req.session.evals,
                          code: req.query.input, error: helper.getTranslation('evals', req.session.lang), console: req.query.console });
      }
      else{
        check.evals++;
        var funcResult = (req.query.result == req.session.theQuestion.result);
        // Avoid hardcoded result return
        if(check.code.indexOf('return ' + req.session.theQuestion.result + ';') > -1 || check.code.indexOf('return "' + req.session.theQuestion.result + '";') > -1 ||
              check.code.indexOf('return \'' + req.session.theQuestion.result + '\';') > -1 || check.code.indexOf('return ' + req.session.theQuestion.result) > -1 ||
              check.code.indexOf('return "' + req.session.theQuestion.result + '"') > -1 || check.code.indexOf('return \'' + req.session.theQuestion.result + '\'') > -1){
          funcResult = false;
        }
        if(funcResult == true && evalResult == true){
          check.result = helper.getTranslation('checkcorrect', req.session.lang);
          check.points = req.session.theQuestion.points;
          res.render('question_' + req.session.lang, { questionNr: questionNr+1, amtQuestions: req.session.allQuestions.length, evals: check.evals, maxEvals: req.session.evals,
                          code: req.query.input, msg: helper.getTranslation('correct', req.session.lang), console: req.query.console });
        }
        else{
          res.render('question_' + req.session.lang, { questionNr: questionNr+1, amtQuestions: req.session.allQuestions.length, evals: check.evals, maxEvals: req.session.evals,
                          code: req.query.input, error: helper.getTranslation('wrong', req.session.lang), console: req.query.console });
        }
      }
    }
  }
});

/* GET editQuestion page. */
router.get('/editQuestion', function(req, res){
  if(helper.preCheck(req, res) === false){ return; }
  if(req.session.admin === true){
    var questionNr = 0;
    if(req.query.nr){ questionNr = parseInt(req.query.nr); }
    if(questionNr < 0){ questionNr = 0; }
    if(questionNr > req.session.allQuestions.length){ questionNr = req.session.allQuestions.length }
    // Save question
    if(req.query.save == 1){
      var newQuestion = {};
      if(questionNr < req.session.allQuestions.length){ newQuestion = req.session.allQuestions[questionNr].value; }
      newQuestion.code1 = req.query.code1;
      newQuestion.code2 = req.query.code2;
      if(req.session.lang === 'NL'){ newQuestion.msg_NL = req.query.msg; }
      else{ newQuestion.msg_EN = req.query.msg; }
      newQuestion.points = 1;
      newQuestion.result = req.query.result;
      try{
        if(newQuestion.code2){ newQuestion.eval = esprima.parse(newQuestion.code2).body; }
        else{ newQuestion.eval = ''; }
      }
      catch(e){}
      newQuestion.type = 'question';
      // New question
      if(questionNr === req.session.allQuestions.length){
        //newQuestion.nr = req.session.allQuestions.length + 1;
        req.session.maxNr++;
        newQuestion.nr = req.session.maxNr;
      }
      db.insert(newQuestion, function(err, body){
        // Reload questions
        db.view('views', 'question_by_nr', function(err, body){
          req.session.allQuestions = body.rows;
          res.render('editQuestion_' + req.session.lang, { userName: req.session.user_name, questionNr: questionNr+1, amtQuestions: req.session.allQuestions.length,
                                 code1: newQuestion.code1, code2: newQuestion.code2, edit_msg: req.query.msg, result: req.query.result, msg: helper.getTranslation('questionsaved', req.session.lang) } );
        });
      });
    }
    // Delete question
    else if(req.query.save == 0){
      db.destroy(req.session.allQuestions[questionNr].value._id, req.session.allQuestions[questionNr].value._rev, function(err, body) {
        // Reload questions
        db.view('views', 'question_by_nr', function(err, body){
          req.session.allQuestions = body.rows;
          questionNr -= 1;
          if(questionNr < 0){ questionNr = 0; }
          var q = req.session.allQuestions[questionNr].value;
          res.render('editQuestion_' + req.session.lang, { userName: req.session.user_name, questionNr: questionNr+1, amtQuestions: req.session.allQuestions.length,
                                  code1: q.code1, code2: q.code2, edit_msg: helper.getMsg(q, req.session.lang), result: q.result, msg: helper.getTranslation('questiondeleted', req.session.lang) } );
        });
      });
    }
    // Get question
    else{
      // New question
      if(questionNr === req.session.allQuestions.length){
        res.render('editQuestion_' + req.session.lang, { userName: req.session.user_name, questionNr: questionNr+1, amtQuestions: req.session.allQuestions.length,
                                code1: '', code2: '', edit_msg: '', result: '' } );
      }
      // Existing question
      else{
        var q = req.session.allQuestions[questionNr].value;
        res.render('editQuestion_' + req.session.lang, { userName: req.session.user_name, questionNr: questionNr+1, amtQuestions: req.session.allQuestions.length,
                                code1: q.code1, code2: q.code2, edit_msg: helper.getMsg(q, req.session.lang), result: q.result } );
      }
    }
  }
  else{
    db.view('views', 'config', function(err, body){
      if(_.find(body.rows[0].value.admin, function(e){ return e == req.session.user_name; })){
        req.session.admin = true;
        db.view('views', 'question_by_nr', function(err, body){
          req.session.allQuestions = body.rows;
          req.session.maxNr = req.session.allQuestions[req.session.allQuestions.length - 1].value.nr;
          var q = req.session.allQuestions[0].value;
          res.render('editQuestion_' + req.session.lang, { userName: req.session.user_name, questionNr: 1, amtQuestions: req.session.allQuestions.length,
                                          code1: q.code1, code2: q.code2, edit_msg: helper.getMsg(q, req.session.lang), result: q.result } );
        });
      }
      else{ res.redirect('/logout'); }
    });
  }
});

/* GET result page. */
router.get('/result', function(req, res){
  if(helper.preCheck(req, res) === false){ return; }
  if(!req.session.admin){
    var result = helper.calculateResult(req);
	  res.render('result_' + req.session.lang, { userName: req.session.user_name, percent: result.percent, checks: result.checks });
  }
  else{
    res.render('overview_' + req.session.lang, { userName: req.session.user_name, questions: req.session.allQuestions });
  }
});

module.exports = router;
