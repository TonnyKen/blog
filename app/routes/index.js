var express = require('express');
var router = express.Router();
var crypto = require('crypto');

var User = require('../models/user.js');
var Post = require('../models/post.js');

/* GET home page. */
router.get('/', function (req, res) {
  Post.getAll(null, function (err, posts) {
    if (err) {
      posts = [];
    } 
    res.render('index', {
      title: '主页',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString(),
      posts: posts
    });
  });
});

router.get('/reg', checkNotLogin);
router.get('/reg', function (req, res) {
  res.render('reg', {
    title: '注册',
    user: req.session.user,
    success: req.flash('success').toString(),
    error: req.flash('error').toString()
  });
});

router.post('/reg', checkNotLogin);
router.post('/reg', function (req, res) {
  var name = req.body.name,
      password = req.body.password,
      password_re = req.body['password-repeat'];
  if (password_re != password) {
    req.flash('error', '两次输入的密码不一致!'); 
    return res.redirect('/reg');
  }

  var md5 = crypto.createHash('md5'),
      password = md5.update(req.body.password).digest('hex');
  var newUser = new User({
      name: name,
      password: password,
      email: req.body.email
  });

  User.get(newUser.name, function (err, user) {
    if (err) {
      req.flash('error', err);
      return res.redirect('/');
    }
    if (user) {
      req.flash('error', '用户已存在!');
      return res.redirect('/reg');
    }
  
    newUser.save(function (err, user) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/reg');
      }
      req.session.user = newUser;
      req.flash('success', '注册成功!');
      res.redirect('/');
    });
  });
});

router.get('/login', checkNotLogin);
router.get('/login', function (req, res) {
    res.render('login', {
        title: '登录',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()});
});

router.post('/login', checkNotLogin);
router.post('/login', function (req, res) {
  //生成密码的 md5 值
  var md5 = crypto.createHash('md5'),
      password = md5.update(req.body.password).digest('hex');
  //检查用户是否存在
  User.get(req.body.name, function (err, user) {
    if (!user) {
      req.flash('error', '用户不存在!'); 
      return res.redirect('/login');//用户不存在则跳转到登录页
    }
    //检查密码是否一致
    if (user.password != password) {
      req.flash('error', '密码错误!'); 
      return res.redirect('/login');//密码错误则跳转到登录页
    }
    //用户名密码都匹配后，将用户信息存入 session
    req.session.user = user;
    req.flash('success', '登陆成功!');
    res.redirect('/');//登陆成功后跳转到主页
  });
});

router.get('/post', checkLogin);
router.get('/post', function (req, res) {
	res.render('post', { 
    title: 'Post',
    user: req.session.user,
    success: req.flash('success').toString(),
    error: req.flash('error').toString()
  });
});

router.post('/post', checkLogin);
router.post('/post', function (req, res) {
  var currentUser = req.session.user,
      tags = [req.body.tag1, req.body.tag2, req.body.tag3],
      post = new Post(currentUser.name, req.body.title, tags, req.body.post);
  post.save(function (err) {
    if (err) {
      req.flash('error', err); 
      return res.redirect('/');
    }
    req.flash('success', '发布成功!');
    res.redirect('/');//发表成功跳转到主页
  });
});


router.get('/archive', function (req, res) {
  Post.getArchive(function (err, posts) {
    if (err) {
      req.flash('error', err); 
      return res.redirect('/');
    }
    res.render('archive', {
      title: '存档',
      posts: posts,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});


router.get('/tags', function (req, res) {
  Post.getTags(function (err, posts) {
    if (err) {
      req.flash('error', err);
      return res.redirect('/');
    }
    res.render('tags', {
      title: '标签',
      posts: posts,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});


router.get('/tags/:tag', function (req, res) {
  Post.getTag(req.params.tag, function (err, posts) {
    if (err) {
      req.flash('error',err); 
      return res.redirect('/');
    }
    res.render('tag', {
      title: 'TAG:' + req.params.tag,
      posts: posts,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});


router.get('/u/:name', function(req, res) {
  User.get(req.params.name, function (err, user) {
    if(!user) {
      req.flash('error', '用户不存在!');
      return res.redirect('/');
    }

    Post.getAll(user.name, function (err, posts) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      var userTitle = user.name + "的文章"
      res.render('user', {
        title: userTitle,
        posts: posts,
        user : req.session.user,
        success : req.flash('success').toString(),
        error : req.flash('error').toString()
      });
    });
  });
});

router.get('/u/:name/:_id', function (req, res){
  Post.getOne(req.params._id, function(err, post){
    if(err) {
      req.flash('error', err);
      return res.redirect('/');
    }
    res.render('article',{
      title: post.title,
      post: post,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString() 
    });
  });
});

router.get('/edit/:name/:_id', checkLogin);
router.get('/edit/:name/:_id', function (req, res) {
  var currentUser = req.session.user;
  Post.edit(req.params._id, currentUser.name, function (err, post) {
    if (err) {
      req.flash('error', err);
      return res.redirect('back');
    }
    res.render('edit', {
      title: 'Edit',
      post: post,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});

router.post('/edit/:name/:_id', checkLogin);
router.post('/edit/:name/:_id', function(req, res) {
  var currentUser = req.session.user,
      tags = [req.body.tag1, req.body.tag2, req.body.tag3];

  Post.update(req.params._id, currentUser.name, req.body.title, tags, req.body.post, function(err) {
    var url = encodeURI('/u/' + currentUser.name+ '/' +req.params._id );
    if (err) {
      req.flash('error', err);
      return res.redirect(url);
    }
    req.flash('success','编辑成功');
    res.redirect(url);
  });
});

router.get('/remove/:name/:_id', checkLogin);
router.get('/remove/:name/:_id', function(req, res) {
  var currentUser = req.session.user;
  Post.remove(req.params._id, currentUser.name, function(err) {
    if (err) {
      req.flash('error', err);
      return res.redirect('back');
    }
    req.flash('success','删除成功');
    res.redirect('/');
  });
});

router.get('/logout', checkLogin);
router.get('/logout', function (req, res) {
  req.session.user = null;
  req.flash('success', '登出成功!');
  res.redirect('/');//登出成功后跳转到主页
});


function checkLogin(req, res, next) {
  if (!req.session.user) {
    req.flash('error', '未登录!'); 
    res.redirect('/login');
  }
  next();
}

function checkNotLogin(req, res, next) {
  if (req.session.user) {
    req.flash('error', '已登录!'); 
    res.redirect('back');//返回之前的页面
  }
  next();
}

module.exports = router;
