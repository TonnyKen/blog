var mongodb = require('./db');
var markdown = require('markdown').markdown
var ObjectID = require('mongodb').ObjectID;

function Post(name, title, post) {
  this.name = name;
  this.title = title;
  this.post = post;
}

module.exports = Post;

//存储一篇文章及其相关信息
Post.prototype.save = function(callback) {
  var date = new Date();
  //存储各种时间格式，方便以后扩展
  var time = {
      date: date,
      year : date.getFullYear(),
      month : date.getFullYear() + "-" + (date.getMonth() + 1),
      day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
      minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
      date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) 
  }
  //要存入数据库的文档
  var post = {
      name: this.name,
      time: time,
      title: this.title,
      post: this.post
  };
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //将文档插入 posts 集合
      collection.insert(post, {
        safe: true
      }, function (err) {
        mongodb.close();
        if (err) {
          return callback(err);//失败！返回 err
        }
        callback(null);//返回 err 为 null
      });
    });
  });
};

//读取文章及其相关信息
Post.getAll = function(name, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var query = {};
      if (name) {
        query.name = name;
      }
      //根据 query 对象查询文章
      collection.find(query).sort({
        time: -1
      }).toArray(function (err, docs) {
        mongodb.close();
        if (err) {
          return callback(err);//失败！返回 err
        }
        docs.forEach(function (doc) {
          doc.post = markdown.toHTML(doc.post);
        });
        callback(null, docs);//成功！以数组形式返回查询的结果
      });
    });
  });
};

Post.getOne = function (_id, callback) {
  mongodb.open(function (err, db) {
    if(err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err){
        mongodb.close();
        return callback(err);
      }

      collection.findOne({
        "_id": new ObjectID(_id)
      }, function (err, doc) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        doc.post = markdown.toHTML(doc.post);
        callback(null, doc);
      });
    });
  });
};

Post.edit = function(_id, callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }

    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }

      collection.findOne({
        "_id": new ObjectID(_id)
      }, function (err, doc) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, doc);
      });
    });
  });
};

Post.update = function(_id, title, post, callback) {
  mongodb.open(function (err, db) {
    if(err) {
      return callback(err);
    }

    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }

      collection.update({
        "_id": new ObjectID(_id)
      }, {
        $set: {
          title: title,
          post: post
        }
      }, function (err) {
        mongodb.close();
        if(err) {
          return callback(err);
        }
        callback(null);
      });
    });
  });
};

Post.remove = function(_id, callback) {
    mongodb.open(function (err, db) {
     if(err) {
        return callback(err);
      }

      db.collection('posts', function (err, collection) {
       if (err) {
        mongodb.close();
        return callback(err);
      }

      collection.remove({
        "_id": new ObjectID(_id)
      }, {
        w: 1
      }, function(err) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null);
      });
    });
  });
};