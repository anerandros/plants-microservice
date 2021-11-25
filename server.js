// server.js
const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const app = express();
const port = 4000;

// onoff library for pin
var Gpio = require('onoff').Gpio;
var LED = new Gpio(4, 'out');

app.use(bodyParser.urlencoded({ extended: false }));

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods','GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
})

// Set up home route
app.get('/', (req, res) => {
    var status = LED.readSync();
    res.send(JSON.stringify({
        status: 'ok',
        response: status
    }));
});
// Set up second page
app.get('/activate', (req, res) => {
    LED.writeSync(1);
    setTimeout(function() {
        LED.writeSync(0);
    }, 5*60*1000); // 5 min
    res.send(JSON.stringify({
        status: 'ok',
        response: 'activated'
    }));
});

app.get('/deactivate', (req, res) => {
    LED.writeSync(0);
    res.send(JSON.stringify({
        status: 'ok',
        response: 'deactivated'
    }));
});

app.get('/status', (req, res) => {
    var status = LED.readSync();
    res.send(JSON.stringify({
        status: 'ok',
        response: status
    }));
});

app.listen(port, () => {
    console.log(`Success! Your application is running on port ${port}.`);
    registerToGateway();
});

var c;

function registerToGateway() {
    console.log('Registering to gateway...');
    var data;
    const dataToSend = new TextEncoder().encode(
        JSON.stringify({
            ip: '192.168.1.150',
            name: 'plants-microservice'
        })
    );
    const options = {
        hostname: '192.168.1.100',
        port: 3000,
        path: '/register',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': dataToSend.length
        }
    };
    
    const req = https.request(options, res => {
        res.on('data', d => {
            data += d;
        });

        res.on('end', () => {
            if (res.statusCode === 200) {
                console.log('Microservice registered to gateway');
                if (registeringInterval) {
                    clearTimeout(registeringInterval);
                }
            } else {
                registeringInterval = setTimeout(() => {
                    registerToGateway();
                }, 30*1000); // 30 s 
            }
        });
    });
    
    req.on('error', error => {
        console.error(error);
        registeringInterval = setTimeout(() => {
            registerToGateway();
        }, 30*1000); // 30 s
    });
    
    req.write(dataToSend);
    req.end();
}