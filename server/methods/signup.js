/*
* Methods: Signup
* Methods for signing users up and adding them to our database.
*/

var Future = Npm.require('fibers/future');

Meteor.methods({
  createTrialCustomer: function(customer){
    // Check our customer object against our expected pattern.
    check(customer, {
      name: String,
      emailAddress: String,
      password: String,
      plan: String,
      creditCard: {
        number: String,
        cvv: String,
        expirationMonth: String,
        expirationYear: String,
        billingAddress: {
          postalCode: String
        }
      }
    });

    // Before we send anything to Braintree, we should verify that our user doesn't
    // exist in our database. We do this here because we technically won't create
    // our user until AFTER we've created them on Braintree. To avoid duplicate customers
    // on Braintree, we can check to see if they exist in our database first. If they
    // don't, we know that they don't exist on Braintree either. Make sure to use a
    // RegExp (regular expression) object to match any case.
    var emailRegex     = new RegExp(customer.emailAddress, "i");
    var lookupCustomer = Meteor.users.findOne({"emails.address": emailRegex});

    if ( !lookupCustomer ) {
      // Create a Future that we can use to confirm successful account creation.
      var newCustomer = new Future();
      console.log('called');
      // Create our customer.
      Meteor.call('btCreateCustomer', customer.creditCard, customer.emailAddress, customer.name, function(error, btCustomer){
        if (error) {
          console.log(error);
        } else {
          console.log('response' + JSON.stringify(btCustomer));
          var customerId = btCustomer.customer.id,
              plan       = customer.plan;

          // Setup a subscription for our new customer.
          Meteor.call('btCreateSubscription', customerId, plan, function(error, response){
            if (error) {
              console.log(error);
            } else {
              // Once Braintree is all setup, create our user in the application, adding all
              // of the Braintree data we just received. Note: the third parameter being passed
              // is the "profile" data we want to set for the customer. Note: here we're using
              // a try/catch statement because Accounts.createUser does NOT accept a callback
              // on the server. This was if we run into an error, we can still grab it and
              // return it to the client.
              try {
                var user = Accounts.createUser({
                  email: customer.emailAddress,
                  password: customer.password,
                  profile: {
                    name: customer.name,
                  }
                });

                // Before we return our user to the client, we need to perform a Meteor.users.update
                // on our user. This is done because we need to add our subscription data to our
                // customer, however, we don't want to store it in our customer's profile object.
                // Unfortunately, the only way to do this is to wait until the user exists and
                // *then* add the subscription data.

                var customerSubscription = {
                  customerId: customerId,
                  subscription: {
                    plan: {
                      name: customer.plan,
                      used: 0
                    },
                    payment: {
                      card: {
                        type: btCustomer.customer.paymentMethods[0].cardType,
                        lastFour: btCustomer.customer.paymentMethods[0].last4
                      },
                      nextPaymentDue: response.subscription.nextBillingDate
                    },
                    status: response.subscription.status,
                    ends: response.subscription.nextBillingDate
                  }
                }

                // Perform an update on our new user.
                Meteor.users.update(user, {
                  $set: customerSubscription
                }, function(error, response){
                  if (error){
                    console.log(error);
                  } else {
                    // Once the subscription data has been added, return to our Future.
                    newCustomer.return(customerSubscription);
                  }
                });
              } catch(exception) {
                newCustomer.return(exception);
              }
            }
          });
        }
      });
      // Return our newCustomer Future.
      return newCustomer.wait();
    } else {
      throw new Meteor.Error('customer-exists', 'Sorry, that customer email already exists!');
    }
  }
});
