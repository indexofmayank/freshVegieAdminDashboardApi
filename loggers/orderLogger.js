const winston = require('winston');
require('winston-mongodb');

const orderLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),

    transports: [
        new winston.transports.MongoDB({
            level: 'info',
            db: 'mongodb+srv://admin:f0Z552lDuB8bsl34@cluster0.omelufv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/f0Z552lDuB8bsl34',
            collection: 'orderLogs',
            tryReconnect: true,
            options: {useUnifiedTopology: true}
        })
    ]
});

module.exports = orderLogger;