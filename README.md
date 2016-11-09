seneca-rabbitmq-ipc-transport
======================

Seneca micro-services inter-process message transport over RabbitMQ messaging using RabbitMQ exchange.

Messages are send between processes by sending messages to RabbitMQ exchange which distributes them based on process id attached to each message. Process id attached to each message is the process id of recipient.

### Install

npm install seneca-rabbitmq-ipc-transport

You'll also need [RabbitMQ](http://www.rabbitmq.com)

## Example

```js
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
    console.log(msg);
    return respond(null,{});
  });

send message by
seneca.act('role:ipc,cmd:send',{processId:recipientProcessId, body:msg});
```
