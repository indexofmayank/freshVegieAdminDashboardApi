const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({

  orderId: {
    type: String,
    require: true,
    unique: true
  },

  shippingInfo: {
    deliveryAddress: {
      name: {
        type: String,
        required: [true, 'Pleae enter name']
      },

      phone: {
        type: String,
        required: [true, 'Please enter phone']
      },

      email: {
        type: String,
        required: [false, 'Please enter email']
      },

      address: {
        type: String,
        required: [true, 'please enter address']
      },

      locality: {
        type: String,
        required: [false, 'Please enter locality']
      },

      landmark: {
        type: String,
        required: [false, 'Pleae enter landmark']
      },

      city: {
        type: String,
        required: [true, 'Please enter city']
      },

      pin_code: {
        type: String,
        required: [true, 'Please enter pin code']
      },

      state: {
        type: String,
        required: [true, 'Please enter state']
      },

    },
    billingAddress: {
      name: {
        type: String,
        required: [true, 'Pleae enter name']
      },

      phone: {
        type: String,
        required: [true, 'Please enter phone']
      },

      email: {
        type: String,
        required: [false, 'Please enter email']
      },

      address: {
        type: String,
        required: [true, 'please enter address']
      },

      locality: {
        type: String,
        required: [false, 'Please enter locality']
      },

      landmark: {
        type: String,
        required: [false, 'Pleae enter landmark']
      },

      city: {
        type: String,
        required: [true, 'Please enter city']
      },

      pin_code: {
        type: String,
        required: [true, 'Please enter pin code']
      },

      state: {
        type: String,
        required: [true, 'Please enter state']
      },

    }
  },
  orderItems: [
    {
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      image: {
        type: String,
        required: true,
      },
      tax: {
        type: Number,
        required: true,
        default: 0
      },
      id: {
        type: mongoose.Schema.ObjectId,
        ref: 'products',
        required: true,
      },
    },
  ],
  user: {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true
    },
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'users',
      required: true,
    }
  },
  paymentInfo: {
    payment_type: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
  },
  paidAt: {
    type: String,
    required: true,
  },
  itemsPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  discountPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  orderStatus: {
    type: String,
    required: true,
    default: 'processing',
  },
  deliverAt: {
    type: Date,
    require: true,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
// Create a virtual property 'id' that's computed from '_id'
orderSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Ensure virtual fields are serialized.
orderSchema.set('toJSON', {
  virtuals: true
});
orderSchema.set('toObject', {
  virtuals: true
});


module.exports = mongoose.model('Order', orderSchema);
