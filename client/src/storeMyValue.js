import web3 from './web3';

const address  = '0x11eE444899eE462a6d50C45e468B3313a4C13EE3';

const abi = [
    {
        "constant": false,
        "inputs": [
        {
            "internalType": "string",
            "name": "x",
            "type": "string"
        }
    ],
        "name": "set",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "get",
        "outputs": [
        {
            "internalType": "string",
            "name": "",
            "type": "string"
        }
    ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
];

//export default new web3.eth.Contract(abi, address);