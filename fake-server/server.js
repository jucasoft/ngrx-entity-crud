const jsonServer = require('json-server');
const server = jsonServer.create();
const path = require('path');
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(router);

router.render = (req, res) => {
  res.jsonp({
    data: res.locals.data
  })
};

server.listen(3000, (res) => {
  console.log('JSON Server is running on: http://localohost:3000');
});
