const _ = require('lodash');
const rp = require('request-promise');
const moment = require('moment');

module.exports.main= function main (event, context, callback) {

// data sourced from sf.openData
    let url = "https://data.sfgov.org/resource/ktji-gk7t.json";
    let total = 6000000; // some large number for pagination
    let date = moment().local();
    date = date.subtract(7, 'days').format('YYYY-MM-DDTHH:mm:ss');

    let options = {
        uri: url,
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
            'X-App-Token': process.env["open_data_token"]
        },
        qs: {
            "$limit": total,
            "service_subtype": "Blocking_Bicycle_Lane",
            "$select": "*",
            "$where": `requested_datetime > '${date}'`
        }
    };

    rp(options)
        .then((res) => {
            let reports = JSON.parse(res);
            let fineAmount = 132;
            let parkingProtectedLaneCost = 16000;
            let calculatedFine = (reports.length * fineAmount);
            let laneDist = (calculatedFine / parkingProtectedLaneCost);

            let district = _.countBy(reports,'supervisor_district');

            let output =
                `Reports this week: ${reports.length}\n` +
                `Potential fines:   \$${calculatedFine.toLocaleString()}\n` +
                `(we could build ${laneDist.toFixed(2)} miles of parking protected lanes!)\n\n` +
                `D1:  ${district[1]  || 0}\n` +
                `D2:  ${district[2]  || 0}\n` +
                `D3:  ${district[3]  || 0}\n` +
                `D4:  ${district[4]  || 0}\n` +
                `D5:  ${district[5]  || 0}\n` +
                `D6:  ${district[6]  || 0}\n` +
                `D7:  ${district[7]  || 0}\n` +
                `D8:  ${district[8]  || 0}\n` +
                `D9:  ${district[9]  || 0}\n` +
                `D10: ${district[10] || 0}\n` +
                `D11: ${district[11] || 0}\n`;


            console.log(output);

            var tweetOptions = {
                method: 'POST',
                uri: process.env["twitter_url"],
                body: {
                    tweet: output
                },
                json: true
            };

            rp(tweetOptions)
                .then(function (parsedBody) {
                    console.log(parsedBody);
                    callback(null, {statusCode: 200, body: "sent to twitter handler"})
                })
                .catch(function (err) {
                    console.log(err);
                    callback(null, {statusCode: 400, body: "failed to send to twitter handler"})

                });
        });
};

