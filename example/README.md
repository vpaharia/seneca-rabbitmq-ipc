seneca-rabbitmq-ipc-transport-example
======================

### Install

npm install

You'll also need [RabbitMQ](http://www.rabbitmq.com)

## Run
Run
```
node app.js
```
in two different terminal. By this you would have two different process of same application.

Application prints the process id and asks for recipient's process id.

Enter the process id from one terminal to another. This will send a inter-process message
