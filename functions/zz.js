

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(`https://1rpc.io/base`))

async function kek(test) {


    const account = web3.eth.accounts.privateKeyToAccount(test);

console.log(account)


}


kek("9e26e7c55a535d772267f88d202df8c89c2dad034cabdbb880ee41a4cd30aa")