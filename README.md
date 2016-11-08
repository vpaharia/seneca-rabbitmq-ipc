seneca-rabbitmq-ipc-transport
======================

Seneca micro-services inter-process message transport over RabbitMQ messaging using RabbitMQ exchange.

Messages are send between processes by sending messages to RabbitMQ exchange which distributes them based on process id attached to each message. Process id attached to each message is the process id of recipient.

### Install

Not on npm yet
Download and npm install
You'll also need [RabbitMQ](http://www.rabbitmq.com)

## Example

```js
var seneca = require('seneca')()
  .use('rabbitmq_ipc')
  .client({
    type: 'rabbitmq_ipc',
    url: rabbitMQuri,
    exchange: 'edge_ipc',
    pin:'role:ipc,cmd:send'
  })
  .listen({
    type: 'rabbitmq_ipc',
    url: rabbitMQuri,
    exchange: 'edge_ipc',
    processId: process.pid,
    pin:'role:ipc,cmd:receive'
  })
  .add('role:ipc,cmd:receive',function(msg, respond){
    console.log(msg);
  });

send message by
seneca.act('role:ipc,cmd:send',{processId:recipientProcessId, body:msg});
```
