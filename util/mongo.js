const MongoClient = require('mongodb').MongoClient;
const {mdb_address, mdb_port, mdb_database} = require('../config/config.json');
const logger = require('logger');

const MongoUrl = "mongodb://" + mdb_address + ":" + mdb_port + "/";

logger.info(MongoUrl);

let client;

module.exports = {
    connect: async function () {
        if (client instanceof MongoClient && client.isConnected()) {
            return client;
        }

        const client = await MongoClient.connect(MongoUrl);

        return client;
    },
    client
};