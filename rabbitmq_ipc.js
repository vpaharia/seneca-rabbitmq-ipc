var _    = require('underscore');
var amqp = require('amqplib/callback_api');

//seneca transport plugin for ipc
module.exports = function( options ) {
  var seneca = this;
  var plugin = 'rabbitmq_ipc';

  var so = seneca.options();

  options = seneca.util.deepextend(
    {
      rabbitmq_ipc: {
        type: 'rabbitmq_ipc',
        url: 'amqp://localhost',
     		exchange: 'edge_ipc',
        socketoptions: {}
      }
    },
    so.transport,
    options);

  var tu = seneca.export('transport/utils');

  seneca.add({role:'transport',hook:'listen',type:'rabbitmq_ipc'}, hook_listen_rabbitmq);
  seneca.add({role:'transport',hook:'client',type:'rabbitmq_ipc'}, hook_client_rabbitmq);

	//create ipc queue per process, bind it to exchange with its process id and start listening on it
  function hook_listen_rabbitmq( args, done ) {
    var seneca         = this;
    var type           = args.type;
    var listen_options = seneca.util.clean(_.extend({},options[type],args));

    amqp.connect(listen_options.url, listen_options.socketoptions, function (error, connection) {
      if (error) return done(error);

      connection.createChannel(function (error, channel) {
        if (error) return done(error);

        channel.on('error', done);

				var ex = listen_options.exchange;
				var processId = listen_options.processId;

        tu.listen_topics( seneca, args, listen_options, function ( topic ) {

					channel.assertExchange(ex, 'direct', {durable:false});

					channel.assertQueue('',{exclusive:true}, function(err, q){
						channel.bindQueue(q.queue, ex, processId.toString());
          	seneca.log.debug('listen', 'bind queue', q, listen_options, seneca);
						// Subscribe
						channel.consume(q.queue, on_message, {noAck:false});
					});

          function on_message ( message ) {
            var content = message.content ? message.content.toString() : undefined;
            var data = tu.parseJSON( seneca, 'listen-'+type, content );

            channel.ack(message);

            // Publish
						tu.handle_request( seneca, data, listen_options, function(out){
							if( null === out ) return;
							var outstr = tu.stringifyJSON( seneca, 'listen-'+type, out );
							//currently no response is send back
						});
          }
        });


        seneca.add('role:seneca,cmd:close',function( close_args, done ) {
          var closer = this;
          channel.close();
          connection.close();
          closer.prior(close_args,done);
        });


        seneca.log.info('listen', 'open', listen_options, seneca);

        done();
      });
    });
  }

	//find out the process and send it to exchange
  function hook_client_rabbitmq( args, client_done ) {
    var seneca         = this;
    var type           = args.type;
    var client_options = seneca.util.clean(_.extend({},options[type],args));

    amqp.connect(client_options.url, client_options.socketoptions, function (error, connection) {
      if (error) return client_done(error);

      connection.createChannel(function (error, channel) {
        if (error) return client_done(error);

				var ex = client_options.exchange;

        tu.make_client( seneca, make_send, client_options, client_done );

        function make_send( spec, topic, send_done ) {

          channel.on('error', send_done);

          channel.assertExchange(ex,'direct',{durable:false});

          seneca.log.debug('client', 'exchange', ex, client_options, seneca);

          // Subscribe only sending messages no response handling
					//channel.consume(restopic, function ( message ) {
            //var content = message.content ? message.content.toString() : undefined
            //var input = tu.parseJSON(seneca,'client-'+type,content)

            //channel.ack(message)

            //tu.handle_response( seneca, input, client_options )
          //})

          // Publish
          send_done( null, function ( args, done ) {
	          //var str = args.pin;
	          //args.pin = str.match(/cmd:.+,/)?str.replace(/cmd:.+,/,"cmd:receive,"):str.replace(/cmd:.*.$/,"cmd:receive");
	          args.cmd='receive';
            var outmsg = tu.prepare_request( this, args, done );
            var outstr = tu.stringifyJSON( seneca, 'client-'+type, outmsg );
            //channel.sendToQueue(acttopic, new Buffer(outstr));
            var processId = args.processId;
            console.log('in send_done with processid '+processId);
            channel.publish(ex, processId.toString(),new Buffer(outstr));
        		done(null,{response:'message send'});
            //var input = tu.parseJSON(seneca, 'client'+type, undefined);
            //tu.handle_response( seneca, input, client_options );
          });

          seneca.add('role:seneca,cmd:close',function( close_args, done ) {
            var closer = this;
            channel.close();
            connection.close();
            closer.prior(close_args,done);
          });

        }
        //client_done();
      });
    });
  }

  return {
    name: plugin,
  };
};

//this.act('role:ipc,cmd:process',{processId:<find out  process id>,data:<data>},function())
//this.add('role:ipc,cmd:process',function())
