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
        required: [false, 'Pleae enter name']
      },

      phone: {
        type: String,
        required: [false, 'Please enter phone']
      },

      email: {
        type: String,
        required: [false, 'Please enter email']
      },

      address: {
        type: String,
        required: [false, 'please enter address']
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
        required: [false, 'Please enter city']
      },

      pin_code: {
        type: String,
        required: [false, 'Please enter pin code']
      },

      state: {
        type: String,
        required: [false, 'Please enter state']
      },

    },
    billingAddress: {
      name: {
        type: String,
        required: [false, 'Pleae enter name']
      },

      phone: {
        type: String,
        required: [false, 'Please enter phone']
      },

      email: {
        type: String,
        required: [false, 'Please enter email']
      },

      address: {
        type: String,
        required: [false, 'please enter address']
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
        required: [false, 'Please enter city']
      },

      pin_code: {
        type: String,
        required: [false, 'Please enter pin code']
      },

      state: {
        type: String,
        required: [false, 'Please enter state']
      },

    }
  },
  discountPrice: {
    type: String,
    required: [false, 'Please enter discount price'],
    default: 0
  },
  itemsPrice: {
    type: String,
    required: [false, 'Please enter items price']
  },
  orderItems: [
    {
      name: {
        type: String,
        required: false,
      },
      image: {
        type: String,
        required: false,
      },
      quantity: {
        type: Number,
        required: false,
        default: 0,
      },
      item_price: {
        type: Number,
        required: false,
        default: 0
      },
      offer_price: {
        type: Number,
        require: false,
        default: 0,
      },
      incrementvalue:{
        type: Number,
        require: false,
        default: 0,
      },
      maxquantity:{
        type: Number,
        require: false,
        default: 0,
      },
      minquantity:{
        type: Number,
        require: false,
        default: 0,
      },
      unit:{
        type: String,
        required: false,
      },
      tax: {
        type: Number,
        required: false,
        default: 0,
      },
      item_total: {
        type: Number,
        required: false,
        default: 0,
      },
      item_total_discount: {
        type: Number,
        required: false,
        default: 0,
      },
      item_total_tax: {
        type: Number,
        required: false,
        default: 0
      },
      gstAmount: {
        type: Number,
        required: false,
        default: 0
      },
      id: {
        type: mongoose.Schema.ObjectId,
        ref: 'products',
        required: false,
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
      required: false,
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
      required: false,
      default: 'cod'
    },
    status: {
      type: String,
      required: false,
      default: 'pending'
    },
    amount: {
      type: Number,
      require: false,
      default: 0
    },
    usedelivery: {
      type: Boolean,
      require: false,
      default: false
    },
    deliverycharges: {
      type: Number,
      require: false,
      default: 0
    },
    useReferral: {
      type: Boolean,
      require: false,
      default: false
    },
    referralAmount: {
      type: Number,
      require: false,
      default: 0
    },
    useWallet: {
      type: Boolean,
      require: false,
      default: false
    },
    walletAmount: {
      type: Number,
      require: false,
      default: 0
    },
    totalGST: {
      type: Number,
      require: false,
      default: 0
    },
    refundAmount: {
      type: Number,
      require: false,
      default: 0
    },
    refundStatus: {
      type: String,
      require: false,
      default: null
    }
  },  
  deliveryInfo: {
    deliveryType: {
      type: String,
      required: false,
      default: null
    },
    deliveryCost: {
      type: Number,
      default: 0,
      required: false
    }, 
    deliveryPartner: {
      name: {
        type: String,
        required: false,
        default: null
      },
      phone: {
        type: Number,
        required: false,
        default: null
      },
      email: {
        type: String,
        required: false,
        default: null
      },
      deliveryPartnerId: {
        type: mongoose.Schema.ObjectId,
        require: true
      },
    }
  },  
  paidAt: {
    type: String,
    required: false,
  },
  total_quantity: {
    type: Number,
    required: false,
    default: 0
  },
  total_item_count: {
    type: Number,
    required: false,
    default: 0
  },
  items_grand_total: {
    type: Number,
    required: false,
    default: 0,
  },
  total_discount: {
    type: Number,
    required: false,
    default: 0,
  },
  total_tax: {
    type: Number,
    required: false,
    default: 0,
  },
  shippingPrice: {
    type: Number,
    required: false,
    default: 0,
  },
  grandTotal: {
    type: Number,
    required: false,
    default: 0,
  },
  orderStatus: {
    type: String,
    required: false,
    default: 'received',
  },
  deliverAt: {
    type: Date,
    require: false,
    default: null
  },
  orderedFrom: {
    type: String,
    require: false,
    default: 'app'
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

orderSchema.pre('save', function (next) {
  const order = this;


  //for total item price
  order.orderItems.forEach( item => {
    if(item.offer_price && item.offer_price > 0) {
      item.item_total = item.offer_price *  item.quantity;
    } 
  });

  //for total item total discount
  order.orderItems.forEach( item => {
    if(item.offer_price && item.offer_price > 0) {
    item.item_total_discount = item.offer_price * item.quantity;
    }
  });

  //for total item tax
  order.orderItems.forEach( item => {
    item.item_total_tax = item.tax * item.quantity;
  });

  //for total quantity
  const totalQuantityCount = order.orderItems.reduce((acc, item) => {
    return acc + item.quantity;
  }, 0);
  order.total_quantity = totalQuantityCount;

  //for total item count
  const totalItemCount = order.orderItems.length;
  order.total_item_count = totalItemCount;

  const itemTotal = order.orderItems.reduce((acc, item) => {
    return acc + item.item_total;
  }, 0);
  order.items_grand_total = itemTotal;

  const totalTax = order.orderItems.reduce((acc, item) => {
    return acc + item.item_total_tax
  }, 0);
  order.total_tax = totalTax;

  const itemDiscountTotal = order.orderItems.reduce((acc, item) => {
    return acc + item.item_total_discount;
  }, 0);
  order.total_discount = itemDiscountTotal;

  order.grandTotal = itemTotal + totalTax + order.shippingPrice;

  next();
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
