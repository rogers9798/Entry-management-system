var mongoose = require('mongoose');
var Schema = mongoose.Schema;

visitorSchema = new Schema( {
	
	email: String,
    Name: String,
    phone:Number,
    host:String,
    entry: [{
        date: {
          type: Date,
          default: Date.now
        },
        checkin: {
          type: Date
        },
        checkout: {
          time: {
            type: Date
          }
        }
      }]
    })

Visitor = mongoose.model('visitor', visitorSchema);

module.exports = Visitor;