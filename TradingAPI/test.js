import http from 'http';
import assert from 'assert';

function getOptions(path) {
    return {
        hostname: 'localhost',
        port: 3003,
        path: path,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    }
}

function postOptions(path) {
    return {
        hostname: 'localhost',
        port: 3003,
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    }
}

function createPlayer(playerId, expectedStatusCode, expectedMessage) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            'playerId': playerId
        });

        const options = postOptions('/player');

        const req = http.request(options, (res) => {
            assert.strictEqual(res.statusCode, expectedStatusCode);

            res.setEncoding('utf8');
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                assert.strictEqual(responseData, expectedMessage);
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with request: ${e.message}`);
            reject(e);
        });

        req.write(data);
        req.end();
    });
}

function makeTrade(trade, expectedStatusCode, expectedMessage) {
    return new Promise((resolve, reject) => {
        const { playerId, symbol, side, quantity, T } = trade;
        const data = JSON.stringify({
            'playerId': playerId,
            'symbol': symbol,
            'side': side,
            'quantity': quantity,
            'T': T
        });

        const options = postOptions('/trade');

        const req = http.request(options, (res) => {
            assert.strictEqual(res.statusCode, expectedStatusCode);

            res.setEncoding('utf8');
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                assert.strictEqual(responseData, expectedMessage);
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with request: ${e.message}`);
            reject(e);
        });

        req.write(data);
        req.end();
    });
}

function portfolioHistory(playerId, time, expectedStatusCode, expectedMessage) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            'playerId': playerId
        });

        const options = getOptions('/portfolio/' + playerId + '?T=' + time);

        const req = http.request(options, (res) => {
            assert.strictEqual(res.statusCode, expectedStatusCode);

            res.setEncoding('utf8');
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                assert.strictEqual(responseData, expectedMessage);
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with request: ${e.message}`);
            reject(e);
        });

        req.write(data);
        req.end();
    });
}

async function test_creatingSameOne() {
    try {
        console.log('Creating A first time');
        await createPlayer('A', 200, '{"message":"Player created","playerId":"A"}');
        console.log('Creating A second time');
        await createPlayer('A', 400, '{"error":"Player already exists"}');

        console.log('Creating B first time');
        await createPlayer('B', 200, '{"message":"Player created","playerId":"B"}');
        console.log('Creating B second time');
        await createPlayer('B', 400, '{"error":"Player already exists"}');

        console.log('Creating C first time');
        await createPlayer('C', 200, '{"message":"Player created","playerId":"C"}');
        console.log('Creating C second time');
        await createPlayer('C', 400, '{"error":"Player already exists"}');
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

async function test_makeTrade() {
    try {
        console.log('Making trade for non-existing player');
        await makeTrade(
            { playerId: 'X', symbol: 'AAPL', side: 'BUY', quantity: 10, T: 5 },
            404,
            '{"error":"Player not found"}'
        );

        console.log('Creating player E');
        await createPlayer('E', 200, '{"message":"Player created","playerId":"E"}');

        console.log('Making trade for existing player E');
        await makeTrade(
            { playerId: 'E', symbol: 'AAPL', side: 'BUY', quantity: 10, T: 10 },
            200,
            '{"message":"Trade recorded"}'
        );
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

async function test_portfolioHistory() {
    try {
        console.log('Checking portfolio for non-existing');
        // await portfolioHistory('D', 404, '{"error":"Player not found"}');

        console.log('Creating D');
        await createPlayer('D', 200, '{"message":"Player created","playerId":"D"}');

        console.log('Checking portfolio history');
        await portfolioHistory('D', 5, 200, '[{"cash":{"amount":100000,"price_per_share":1,"value":100000},"timestamp":0},{"cash":{"amount":100000,"price_per_share":1,"value":100000},"timestamp":1},{"cash":{"amount":100000,"price_per_share":1,"value":100000},"timestamp":2},{"cash":{"amount":100000,"price_per_share":1,"value":100000},"timestamp":3},{"cash":{"amount":100000,"price_per_share":1,"value":100000},"timestamp":4},{"cash":{"amount":100000,"price_per_share":1,"value":100000},"timestamp":5}]');

        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 100));

        console.log('Making trade for existing player D');
        await makeTrade(
            { playerId: 'D', symbol: 'AAPL', side: 'BUY', quantity: 100, T: 7 },
            200,
            '{"message":"Trade recorded"}'
        );

        console.log('Checking portfolio history after trade');
        await portfolioHistory('D', 10, 200, '');
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

async function runTests() {
    // await test_creatingSameOne();
    // await test_makeTrade();
    await test_portfolioHistory();
    console.log('All tests passed');
    process.exit(0);
}

runTests();
