const _ = require('lodash');
const rp = require('request-promise');
const config = require('../config.yml');
const moment = require('moment');

module.exports.main= function main (event, context, callback) {

    let url = " https://lane-breach.herokuapp.com/api/sf311_cases";
    const yest = moment().subtract(1, 'day').endOf('day');
    const weekAgo = moment().subtract(8, 'day').endOf('day');

    let options = {
        uri: url,
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
        },
        qs: {
           "start_time": weekAgo.format('YYYY-MM-DD'),
            "end_time": yest.format('YYYY-MM-DD')
        }
    };

    console.log(options);

    rp(options)
        .then((res) => {
            let reports = JSON.parse(res);

            let fineAmount = 132;
            let parkingProtectedLaneCost = 16000;
            let calculatedFine = (reports.length * fineAmount);
            let laneDist = (calculatedFine / parkingProtectedLaneCost);

            let district = _.countBy(reports,'supervisor_district');

            // paragraph, educational
            let output1 =
                // `Reports ${weekAgo.format('MM/DD')}-${yest.format('MM/DD')}: ${reports.length}\n` +
                `There were ${reports.length} reports from ${weekAgo.format('MM/DD')} to ${yest.format('MM/DD')}\n` +
                `If each report resulted in a fine, \$${calculatedFine.toLocaleString()} would go towards building ${laneDist.toFixed(2)} miles of parking protected lanes.` +
                // `That's ${}% of the 5ish miles SF built in 2018!`;
                // `(we could build ${laneDist.toFixed(2)}mi of parking protected lanes!)\n\n` +


            console.log(output1);

            // list, show change over time
            let output2 = `Reports by district:\n`;

            let max = 0;

            for (const key of Object.keys(district)) {
                if (district[key] > max) {
                    max = district[key];
                }
            }

            for (const key of Object.keys(district)) {
                output2 += `D${key}: ${district[key]}`;

                if (district[key] > 10) {
                    output2 += ` 🆘\n`
                } else {
                    output2 += `\n`
                }

                // if (district[key] ==  max) {
                //     output2 += ` 🥇\n`
                // } else {
                //     output2 += `\n`
                // }

                // if (district[key] ==  max) {
                //     output2 += ` 🆘\n`
                // } else {
                //     output2 += `\n`
                // }
            }

            console.log(output2);

            // map of this weeks reports
            let output3 =
                ``;

            console.log(output3);


            var tweetOptions = {
                method: 'POST',
                uri: process.env["twitter_url"],
                body: {
                    tweet1: output1,
                    tweet2: output2,
                    tweet3: output3,
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

