const express = require('express')
const ejs = require('ejs')
const paypal = require('paypal-rest-sdk')
const keys = require('./config/keys')

const app = express()
app.set('view engine', 'ejs')

const port = 3000 || process.env.PORT

//configuration , you should use your own keys
paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': keys.clientKey, // client key
    'client_secret': keys.secretKey // secrect key
});


app.get('/', (req, res) => {
    res.render('index')
})

app.post('/pay', (req, res) => {
    // create a valid payment object
    var create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:3000/success", // uri where to go after payment is done succetly
            "cancel_url": "http://localhost:3000/cancel" // something when wrong 
        },
        "transactions": [
            {
                "item_list": { // item information  and quantity
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
                "amount": { // price of item
                    "currency": "USD",
                    "total": "25.00"
                },
                "description": "Hat for look like a hacker"
            }
        ]
    };

    //create payment
    paypal.payment.create(create_payment_json, function (error, payment) {
            if (error) {
                throw error;
            } else {
                console.log("Create Payment Response");
                console.log(payment);
                // if everything go well then redirect to paypal login
                payment
                    .links
                    .forEach((link) => {
                        if (link.rel === 'approval_url') {
                            res.redirect(link.href) // take the uri to approval login payment
                        }
                    })

            }
        });

})

app.get('/success', (req, res) => {
    let payerId = req.query.PayerID
    let paymentId = req.query.paymentId

    // confirm payment 
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
    // execute payment and do your own transation in your database
    paypal.payment.execute(paymentId, execute_payment_json, (error, payment) => {
        if (error) {
            console.log('something went wrong')
            throw error
        } else {
            // if everything go well , you have access to your payment information do some stuff to your store if you need it
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