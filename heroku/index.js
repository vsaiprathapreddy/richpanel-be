/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

 var bodyParser = require('body-parser');
 var express = require('express');
 const cors = require('cors');
 var app = express();
 
 var xhub = require('express-x-hub');
 
 app.set('port', (process.env.PORT || 5000));
 app.listen(app.get('port'));
 
 app.use(xhub({ algorithm: 'sha1', secret: process.env.APP_SECRET }));
 app.use(cors());
 app.use(bodyParser.json());
 app.use(bodyParser.urlencoded({ extended: false }));
 
 var token = process.env.TOKEN || 'token';
 var received_updates = [{ a: 5 }];
 const PORT = 3001;
 var clients = [];
 var facts = [];
 
 app.get('/status', function(request, response) {
   response.json({ clients: clients.length })
 })

 app.listen(PORT, function (){
  console.log("Listening to the events")
})
 
 function eventsHandler(request, response, next) {
   const headers = {
     'Content-Type': 'text/event-stream',
     'Connection': 'keep-alive',
     'Cache-Control': 'no-cache'
   };
   response.writeHead(200, headers);
   const data = "data: "+JSON.stringify(received_updates)+"\n\n";
   response.write(data);
 
   const clientId = Date.now();
   const newClient = {
     id: clientId,
     response: response
   };
 
   clients.push(newClient);
 
   request.on('close', function(){
     console.log("Connection closed" + clientId);
     clients = clients.filter(function(client) {
       return client.id !== clientId
     });
   });
 }
 
 function sendEventsToAll(newFact) {
   clients.forEach(function(client) {
     const data = "data: "+JSON.stringify(newFact)+"\n\n";
     return client.response.write(data)
   })
 }
 
 app.get('/events', eventsHandler);
 // async function addFact(request, respsonse, next) {
 //   const newFact = request.body;
 //   facts.push(newFact);
 //   respsonse.json(newFact)
 //   return sendEventsToAll(newFact);
 // }
 // app.post('/fact', addFact);
 
 app.get('/', function (req, res) {
   console.log(req);
   res.send('<pre>' + JSON.stringify(received_updates, null, 2) + '</pre>');
 });
 
 app.get(['/facebook', '/instagram'], function (req, res) {
   if (
     req.query['hub.mode'] == 'subscribe' &&
     req.query['hub.verify_token'] == token
   ) {
     res.send(req.query['hub.challenge']);
   } else {
     res.sendStatus(400);
   }
 });
 
 app.post('/facebook', function (req, res) {
   console.log('Facebook request body:', req.body);
 
   if (!req.isXHubValid()) {
     console.log('Warning - request header X-Hub-Signature not present or invalid');
     res.sendStatus(401);
     return;
   }
 
   console.log('request header X-Hub-Signature validated');
   // Process the Facebook updates here
   received_updates.unshift(req.body);
   sendEventsToAll(req.body);
   res.sendStatus(200);
 });
 
 app.post('/instagram', function (req, res) {
   console.log('Instagram request body:');
   console.log(req.body);
   // Process the Instagram updates here
   received_updates.unshift(req.body);
   res.sendStatus(200);
 });
 
 app.listen();