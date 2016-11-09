var rabbitMQuri = 'amqp://localhost';
var seneca = require('seneca')()
  .use('seneca-rabbitmq-ipc-transport')
  .client({
    type: 'seneca-rabbitmq-ipc-transport',
    url: rabbitMQuri,
    exchange: 'edge_ipc',
    pin:'role:ipc,cmd:send'
  })
  .listen({
    type: 'seneca-rabbitmq-ipc-transport',
    url: rabbitMQuri,
    exchange: 'edge_ipc',
    processId: process.pid,
    pin:'role:ipc,cmd:receive'
  })
  .add('role:ipc,cmd:receive',function(msg, respond){
    console.log(msg.body);
    return respond(null,{});
  });

console.log("Process started with id "+process.pid);

var readline = require('readline');
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter recipient Process Id? ', (answer) => {

  seneca.act('role:ipc,cmd:send',{processId:parseInt(answer), body:'message send by process '+process.pid});
  console.log('message send to process '+answer);

  rl.close();
});
