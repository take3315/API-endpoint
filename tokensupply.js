//Input treasury wallet addresses
const mywalletaddresses = [
    "0x24dd242c3c4061b1fcaa5119af608b56afbaea95",
    "0x153d9dd730083e53615610a0d2f6f95ab5a0bc01",
    "0x4534f4968006ca9eca3bac922022c7ecba066e9e",
    "0xdc94eeeb3260d0b9bf22849e8f5d236d286cdba1"
];

function doGet(e) {
    let value = getsupplydata();
    var q = e.parameter.q;
    if (q == "totalcoins") {
        value = 210000;
    } else if (q == "circulating") {
        value = 210000 - value;
    } else {
        var error = {
            message: "Invalid parameter value. Please specify either 'totalcoins' or 'circulating'."
        };
        var out = ContentService.createTextOutput();
        out.setMimeType(ContentService.MimeType.JSON);
        out.setContent(JSON.stringify(error));
        return out;
    }

    var out = ContentService.createTextOutput();
    out.setMimeType(ContentService.MimeType.JSON);
    out.setContent(JSON.stringify(value));
    return out;

}

function getsupplydata() {
    var USERNAME = "zk_dev_API KEY HERE"
    var suburl = 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer';
    var output = [];
    var authheader = { "Authorization": "Basic " + Utilities.base64Encode(USERNAME + ":") };
    var params = { "method": "GET", "headers": authheader };
    let sum = 0;

    for (var a = 0; a < mywalletaddresses.length; a++) {
        var myaddress = mywalletaddresses[a];
        var url = `https://api.zerion.io/v1/wallets/${myaddress}/positions/?currency=jpy&sort=value`;
        var json = JSON.parse(UrlFetchApp.fetch(url, params));

        for (var i = 0; i < json.data.length; i++) {
            var obj = json.data[i];
            if (obj.attributes.fungible_info.symbol == "BPT-V1") {
                var lpTokenAddress = obj.attributes.fungible_info.implementations[0].address;
                var lpTokenQuery = `
            query {
              pool(id: "${lpTokenAddress}") {
              totalShares
              tokens {
                  symbol
                  balance
                }
              }
            }
            `;
                var lpTokenResponse = UrlFetchApp.fetch(suburl, {
                    'method': 'post',
                    'payload': JSON.stringify({ 'query': lpTokenQuery }),
                    'contentType': 'application/json'
                });
                var lpTokenJson = JSON.parse(lpTokenResponse);

                for (var j = 0; j < lpTokenJson.data.pool.tokens.length; j++) {
                    var underlyingToken = lpTokenJson.data.pool.tokens[j].symbol;
                    var underlyingTokenBalance = lpTokenJson.data.pool.tokens[j].balance * obj.attributes.quantity.numeric / lpTokenJson.data.pool.totalShares;
                    if (underlyingToken == "TXJP") {
                        output.push(
                            underlyingTokenBalance,
                        );
                    }
                }
            } else

                if (obj.attributes.fungible_info.symbol == "TXJP") {
                    output.push(
                        +obj.attributes.quantity.numeric,
                    );
                }
        };
    };

    for (var number of output) {
        sum += number;
    }

    return sum;

}
