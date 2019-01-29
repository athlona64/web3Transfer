const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const admin = require("firebase-admin");
var session = require('express-session')
var Web3 = require('web3');
var Promise = require('promise');

var await = require('await')``
var EthereumTx = require('ethereumjs-tx')
var keyth = require('keythereum');
var moment = require('moment-timezone');
var txutils = require('./lib/txutils.js')
var encryption = require('./lib/encryption.js')
var signing = require('./lib/signing.js')
var lightwallet = require('./lib/keystore.js')
var upgrade = require('./lib/upgrade.js')
var numberToBN = require('number-to-bn');
var elasticsearch = require('elasticsearch');
var await = require('await');
var request = require('request');
var dateFormat = require('dateformat');
var mysql = require('mysql');

var listenPort = "4000";
var gethIPCPath = "";

const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://rinkeby.infura.io/ws'));

const abi = [{ "constant": true, "inputs": [], "name": "totalSupply", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transfer", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "from", "type": "address" }, { "indexed": true, "name": "to", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" }];
const contractAddress = '0x41b7a0ae98212f423c01409c8a3958981d0cc5a3';
const code = '608060405234801561001057600080fd5b50610396806100206000396000f300608060405260043610610057576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff16806318160ddd1461005c57806370a0823114610087578063a9059cbb146100de575b600080fd5b34801561006857600080fd5b5061007161012b565b6040518082815260200191505060405180910390f35b34801561009357600080fd5b506100c8600480360381019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610131565b6040518082815260200191505060405180910390f35b3480156100ea57600080fd5b50610129600480360381019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919050505061017a565b005b60005481565b6000600160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b6040600481016000369050101561019057600080fd5b6101e282600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205461032490919063ffffffff16565b600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000208190555061027782600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205461033d90919063ffffffff16565b600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef846040518082815260200191505060405180910390a3505050565b60006103328383111561035b565b818303905092915050565b60008082840190506103518482101561035b565b8091505092915050565b80151561036757600080fd5b505600a165627a7a7230582041d33868e2c825d9563ee8afe2d65cd121c2638eb5a4a239baf51c7f972e91880029';
//function transfer token

var myContract = new web3.eth.Contract(abi, contractAddress);
// Generate filter options
const options = {

    fromBlock: 'latest'
}

var db_config = {
    host: 'host',
    user: 'user',
    password: 'password',
    database: '',
    timezone: "UTC+0"
};
var con;
var waiting = 0;

function handleDisconnect() {
    con = mysql.createPool(db_config);

  
    con.getConnection(function(err) {              // The server is either down
      if(err) {                                     // or restarting (takes a while sometimes).
        console.log('error when connecting to db:', err);
        setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
      }                                     // to avoid a hot loop, and to allow our node script to
    });                                     // process asynchronous requests in the meantime.
                                            // If you're also serving http, display a 503 error.
    con.on('error', function(err) {
      console.log('db error', err);
      if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
        handleDisconnect();                         // lost due to either server restart, or a
      } else {                                      // connnection idle timeout (the wait_timeout
        throw err;                                  // server variable configures this)
      }
    });
  }
  
  handleDisconnect();
// Subscribe to Transfer events matching filter criteria
myContract.events.Transfer(options, async (error, event) => {
    if (error) {
        console.log(error)
        return
    }
    // handleDisconnect();
    console.log('got transfer: '+ event);
        const check = async function () {
            const checkUser = await con.query("SELECT * FROM balanceOf where address = '" + event.returnValues.from + "'", (err, result, fields) => {
                waiting++;
                if (result.length > 0) {
                    myContract.methods.balanceOf(event.returnValues.from)
                        .call()
                        .then(value => {
                            con.query("UPDATE balanceOf SET balance = ? WHERE address = ?", [value / 10e17, event.returnValues.from], (err, result, fields) => {
                                // waiting--;
                                // checkProccess(con);
                                console.log(value/10e17);
                                console.log(event.returnValues.from);
                            });
                        });
                } else {
                    myContract.methods.balanceOf(event.returnValues.from)
                        .call()
                        .then(value => {
                            sql = "INSERT INTO balanceOf (address, balance) VALUES ?";
                            values = [[event.returnValues.from, value / 10e17]];
                            con.query(sql, [values],  (err, result, fields) => {
                                // waiting--;
                                // checkProccess(con);
                            });
                        });
                }

            });
            const checkUser2 = await con.query("SELECT * FROM balanceOf where address = '" + event.returnValues.to + "'", (err, result, fields) =>{
                 waiting++;
                if(result.length > 0) {
                myContract.methods.balanceOf(event.returnValues.to)
                    .call()
                    .then(value => {
                        con.query("UPDATE balanceOf SET balance = ? WHERE address = ?", [value / 10e17, event.returnValues.to], (err, result, fields) => {
                            // waiting--;
                            // checkProccess(con);
                            console.log(value/10e17);
                            console.log(event.returnValues.to);
                        });
                    });
            } else {
                myContract.methods.balanceOf(event.returnValues.to)
                    .call()
                    .then(value => {
                        sql = "INSERT INTO balanceOf (address, balance) VALUES ?";
                        values = [[event.returnValues.to, value / 10e17]];
                        con.query(sql, [values], (err, result, fields) => {      
                            // waiting--;
                            // checkProccess(con);
                        });
                    });
            }
            }); 
        }
        check();
     


})
function checkProccess(con) {
    console.log(waiting);
    if (!waiting) {
        con.end();
        waiting = 0;
        console.log('end');
    }
}
