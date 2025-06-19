const router = require('express').Router();

const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const userController = require('../controllers/userController');
const categoryController = require('../controllers/categoryController');
const orderLogController = require('../controllers/orderLogController');
const subcategoryController = require('../controllers/subcategoryController');


const auth = require('../middleware/Auth');

router.route('/auth').post(adminController.sendCurrentUser);

// register new admin
router
  .route('/register')
  .post(
    auth.checkUserAuthentication,
    auth.checkAdminPrivileges('super'),
    adminController.registerAdmin
  );

// login admin
router.route('/login').post(adminController.loginAdmin);

// logout admin
router.route('/logout').get(adminController.logoutAdmin);

// get all admin details
router
  .route('/users')
  .get(
    auth.checkUserAuthentication,
    auth.checkAdminPrivileges('super'),
    adminController.getAllAdminDetails
  );

// get single admin details
router
  .route('/users/:id')
  .get(
    auth.checkUserAuthentication,
    auth.checkAdminPrivileges('super'),
    adminController.getSingleAdminDetails
  )
  .put(
    auth.checkUserAuthentication,
    auth.checkAdminPrivileges('super'),
    adminController.updateAdminPrivilege
  )
  .delete(
    auth.checkUserAuthentication,
    auth.checkAdminPrivileges('super'),
    adminController.deleteAdmin
  );


  //get product for table
router
  .route('/product/')
  .get(
    auth.checkUserAuthentication,
    auth.checkAdminPrivileges('moderate', 'super'),
    productController.getAllProductForTable
  );

router
  .route('/product/new')
  .post(
    auth.checkUserAuthentication,
    auth.checkAdminPrivileges('moderate', 'super'),
    productController.createProduct
  );

// send, update, delete a single product
router
  .route('/product/:id')
  .put(
    auth.checkUserAuthentication,
    auth.checkAdminPrivileges('moderate', 'super'),
    productController.updateProduct
  )
  .delete(
    auth.checkUserAuthentication,
    auth.checkAdminPrivileges('moderate', 'super'),
    productController.deleteProduct
  )
  .get(
    auth.checkUserAuthentication,
    auth.checkAdminPrivileges('moderate', 'super'),
    productController.getProductByIdForAdmin
  );

  router
    .route('/product/update/:id')
    .get(
      auth.checkUserAuthentication,
      auth.checkAdminPrivileges('moderate', 'super'),
      productController.getProductDetailByIdForUpdate  
    );


// delete product reviews
router
  .route('/product/review/:id')
  .delete(
    auth.checkUserAuthentication,
    auth.checkAdminPrivileges('moderate', 'super'),
    productController.deleteReview
  );

// send all orders
router
  .route('/orders')
  .get(
    auth.checkUserAuthentication,
    auth.checkAdminPrivileges('moderate', 'super', 'low'),
    orderController.getAllOrders
  );

// send single order
router
  .route('/order/:id')
  .put(
    auth.checkUserAuthentication,
    auth.checkAdminPrivileges('moderate', 'super', 'low'),
    orderController.updateOrderStatus
  )
  .delete(
    auth.checkUserAuthentication,
    auth.checkAdminPrivileges('moderate', 'super'),
    orderController.deleteOrder
  );


  //update single order
  router
  .route('/editorder/:orderId')
  .put(
    auth.checkUserAuthentication,
    auth.checkAdminPrivileges('moderate', 'super'),
    orderController.updateOrderByAdmin
  );

  router
    .route('/order/markcancelled/:orderId')
    .put(
      auth.checkUserAuthentication,
      auth.checkAdminPrivileges('moderate', 'super'),
      orderController.markOrderStatusToCancelledByOrderId
    );

  // delete user
  router.route('/user/:id')
  .delete(
    auth.checkUserAuthentication,
    auth.checkAdminPrivileges('super'),
    userController.deleteUser
  );
  


// send all users



//get, update, delete routers for admin
router
  .route('/category/')
  .get(
    auth.checkUserAuthentication,
    auth.checkAdminPrivileges('super', 'moderate'),
    categoryController.getAllCategoriesForTable
  );

  router
  .route('/subcategory/')
  .get(
    auth.checkUserAuthentication,
    auth.checkAdminPrivileges('super', 'moderate'),
    subcategoryController.getAllSubCategoriesForTable
  );

router
  .route('/category/:id')
  .put(
    auth.checkUserAuthentication,
    auth.checkAdminPrivileges('super', 'moderate'),
    categoryController.updateCategory
  );


router
  .route('/category/delete/:id')
  .delete(
    auth.checkUserAuthentication,
    auth.checkAdminPrivileges('super', 'moderate'),
    categoryController.deleteCategory
  );

  router
  .route('/subcategory/delete/:id')
  .delete(
    auth.checkUserAuthentication,
    auth.checkAdminPrivileges('super', 'moderate'),
    subcategoryController.deleteSubCategory
  );


  router
    .route('/orderlogs/:userId')
    .get(
      auth.checkUserAuthentication,
      auth.checkAdminPrivileges('super', 'moderate'),
      orderLogController.getOrderLogsByUserId
    );


module.exports = router;

//order Log Router for admin
