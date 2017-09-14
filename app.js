var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var redis = require('redis');

var app = express();

// Cria Cliente Redis
var clienteRedis = redis.createClient();

clienteRedis.on('connect', function () {
    console.log('Servidor Redis Conectado ...');
});

// Configuração do Renderizador de Páginas (EJS)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Captura o caminho '/' na URL
app.get('/', function (req, res) {
    var titulo = 'OLX Data Science';

    clienteRedis.lrange('produtos', 0, -1, function (err, produtos) {
		clienteRedis.hgetall('contato', function(err, contato){
			res.render('produtos', {
				titulo: titulo,
				produtos: produtos,
				contato: contato
			});
		});
    });
});

app.post('/acao/adicionar', function(req, res){
	var produto = req.body.produto;

    clienteRedis.rpush('produtos', produto, function(err, reply){
		if(err){
			console.log(err);
		}
		console.log('Produto Adicionado ...');
		res.redirect('/');
    });
});

app.post('/tarefa/remover', function(req, res){
	var produtosParaRemover = req.body.produtos;

	clienteRedis.lrange('produtos', 0, -1, function(err, produtos){
		for(var posicao = 0; posicao < produtos.length; posicao++){
			if(produtosParaRemover.indexOf(produtos[posicao]) > -1){
				clienteRedis.lrem('produtos',0,produtos[posicao], function(){
					if(err){
						console.log(err);
					}
				});
			}
		}
		res.redirect('/');
	});
});

app.post('/contato/editar', function(req, res){
	var contato = {};

	contato.nome 		= req.body.nome;
	contato.produto 	= req.body.produto;
	contato.telefone 	= req.body.telefone;

	clienteRedis.hmset('contato', 
	         ['nome', contato.nome,
			  'produto', contato.produto, 
			  'telefone', contato.telefone], 
			  function(err, reply){
		if(err){
			console.log(err);
		}
		console.log(reply);
		res.redirect('/');
	});
});


app.listen(3000);
console.log('Servidor Inicializado na Porta 3000 ...',
    'URL: http://localhost:3000/');

module.exports = app;