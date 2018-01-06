const express = require('express')
const ejs = require('ejs')
const paypal = require('paypal-rest-sdk')
const keys = require('./config/keys')

const app = express()
app.set('view engine', 'ejs')

const port = 3000 || process.env.PORT

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': keys.clientKey,
    'client_secret': keys.secretKey
});

app.get('/', (req, res) => {
    res.render('index')
})

app.post('/pay', (req, res) => {

    var create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:3000/success",
            "cancel_url": "http://localhost:3000/cancel"
        },
        "transactions": [
            {
                "item_list": {
                    "items": [
                        {
                            "name": "Red Soc Hat",
                            "sku": "001",
                            "price": "25.00",
                            "currency": "USD",
                            "quantity": 1
                        }
                    ]
                },
                "amount": {
                    "currency": "USD",
                    "total": "25.00"
                },
                "description": "Hat for look like a hacker"
            }
        ]
    };

    paypal
        .payment
        .create(create_payment_json, function (error, payment) {
            if (error) {
                throw error;
            } else {
                console.log("Create Payment Response");
                console.log(payment);
                payment
                    .links
                    .forEach((link) => {
                        if (link.rel === 'approval_url') {
                            res.redirect(link.href)
                        }
                    })

            }
        });

})

app.get('/success', (req, res) => {
    let payerId = req.query.PayerID
    let paymentId = req.query.paymentId

    const execute_payment_json = {
        "payer_id": payerId,
        "transactions": [
            {
                "amount": {
                    "currency": "USD",
                    "total": "25.00"
                }
            }
        ]
    }

    paypal.payment.execute(paymentId, execute_payment_json, (error, payment) => {
        if (error) {
            console.log('something went wrong')
            throw error
        } else {
            console.log(JSON.stringify(payment))
            res.send('success')
        }
    })

})

app.get('/cancel', (req, res) => {
    res.send('canceled')
})

app.listen(port, (req, res) => {
    console.log('server started')
})