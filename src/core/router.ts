export abstract class Router {
  /**
   * App routes
   * @static
   * @memberof Router
   * @example /
   */
  static App = class {
    /** App */
    static ApiTag = 'App';
    /** '' (root) */
    static Base = '';
    /** undefined */
    static Health: string;
  };

  /**
   * Integrated libraries routes
   * @static
   * @memberof Router
   * @example /queues
   */
  static Integrated = class {
    /** Swagger auth name */
    static ApiAuthName = 'JWT-auth';
    /** Swagger route */
    static SwaggerRoute = 'api';
    /** MQ Board */
    static MqBoard = 'queues';
  };

  /**
   * Authentication routes
   * @static
   * @memberof Router
   * @example /auth/sign-in
   */
  static Auth = class {
    /** Authentication */
    static ApiTag = 'Authentication';
    /** auth */
    static Base = 'auth';
    /** sign-in */
    static SignIn = 'sign-in';
    /** admin-sign-in */
    static AdminSignIn = 'admin-sign-in';
    /** register */
    static Register = 'register';
    /** permissions */
    static Permissions = 'permissions';

    /**
     * Access Groups nested routes
     */
    static AccessGroups = class {
      /** access-groups */
      static Base = 'access-groups';
      /** :accessGroupId */
      static ById = 'access-groups/:accessGroupId';
      /** :accessGroupId/add-employee */
      static AddEmployee = 'access-groups/:accessGroupId/add-employee/:userId';
      /** access-groups/remove-employee */
      static RemoveEmployee = 'access-groups/remove-employee/:userId';
    };
  };

  /**
   * Users routes
   * @static
   * @memberof Router
   * @example /users
   */
  static Users = class {
    /** Users */
    static ApiTag = 'Users';
    /** users */
    static Base = 'users';
    /** undefined */
    static List: string;
    /** me */
    static Me = 'me';
    /** :id */
    static ById = ':id';
  };

  /**
   * Storage routes
   * @static
   * @memberof Router
   * @example /storage/upload-file
   */
  static Storage = class {
    /** Storage */
    static ApiTag = 'Storage';
    /** storage */
    static Base = 'storage';
    /** upload-file */
    static UploadFile = 'upload-file';
  };

  /**
   * Wallet routes
   * @static
   * @memberof Router
   * @example /wallets
   */
  static Wallet = class {
    /** Wallet */
    static ApiTag = 'Wallet';
    /** wallets */
    static Base = 'wallets';
    /** me */
    static Me = 'me';
    /** :userId */
    static ByUserId = ':userId';
    /** me/withdraw */
    static Withdraw = 'me/withdraw';
    /** me/withdraws */
    static MyWithdraws = 'me/withdraws';
    /** :userId/withdraws */
    static UserWithdraws = ':userId/withdraws';
    /** withdraws */
    static AllWithdraws = 'withdraws';
  };

  /**
   * Courses routes
   * @static
   * @memberof Router
   * @example /courses
   */
  static Courses = class {
    /** Courses */
    static ApiTag = 'Courses';
    /** courses */
    static Base = 'courses';
    /** admin */
    static Admin = 'admin';
    /** :courseId */
    static ById = ':courseId';
    /** :courseId/detailed */
    static Detailed = ':courseId/detailed';
  };

  /**
   * Modules routes
   * @static
   * @memberof Router
   * @example /modules
   */
  static Modules = class {
    /** Modules */
    static ApiTag = 'Modules';
    /** modules */
    static Base = 'modules';
    /** course/:courseId */
    static ByCourseId = 'course/:courseId';
    /** admin/course/:courseId */
    static AdminByCourseId = 'admin/course/:courseId';
    /** :moduleId */
    static ById = ':moduleId';
  };

  /**
   * Lectures routes
   * @static
   * @memberof Router
   * @example /lectures
   */
  static Lectures = class {
    /** Lectures */
    static ApiTag = 'Lectures';
    /** lectures */
    static Base = 'lectures';
    /** module/:moduleId */
    static ByModuleId = 'module/:moduleId';
    /** admin/module/:moduleId */
    static AdminByModuleId = 'admin/module/:moduleId';
    /** :lectureId */
    static ById = ':lectureId';
  };

  /**
   * Settings routes
   * @static
   * @memberof Router
   * @example /settings
   */
  static Settings = class {
    /** Settings */
    static ApiTag = 'Settings';
    /** settings */
    static Base = 'settings';
    /** :id */
    static ById = ':id';
  };

  /**
   * Transactions routes
   * @static
   * @memberof Router
   * @example /transactions
   */
  static Transactions = class {
    /** Transactions */
    static ApiTag = 'Transactions';
    /** transactions */
    static Base = 'transactions';
    /** :transactionId */
    static ById = ':transactionId';
  };

  /**
   * Purchases routes
   * @static
   * @memberof Router
   * @example /purchases
   */
  static Purchases = class {
    /** Purchases */
    static ApiTag = 'Purchases';
    /** purchases */
    static Base = 'purchases';
    /** courses/:courseId */
    static CourseById = 'courses/:courseId';
  };

  /**
   * Refunds routes
   * @static
   * @memberof Router
   * @example /refunds
   */
  static Refunds = class {
    /** Refunds */
    static ApiTag = 'Refunds';
    /** refunds */
    static Base = 'refunds';
    /** :refundId */
    static ById = ':refundId';
    /** transactions/:transactionId */
    static ByTransactionId = 'transactions/:transactionId';
    /** :refundId/review */
    static Review = ':refundId/review';
  };

  /**
   * Stripe webhook routes
   * @static
   * @memberof Router
   * @example /stripe/webhook
   */
  static Stripe = class {
    /** Stripe */
    static ApiTag = 'Stripe';
    /** stripe/webhook */
    static Webhook = 'stripe/webhook';
  };

  /**
   * PayPal webhook routes
   * @static
   * @memberof Router
   * @example /paypal/webhook
   */
  static PayPal = class {
    /** PayPal */
    static ApiTag = 'PayPal';
    /** paypal/webhook */
    static Webhook = 'paypal/webhook';
  };
}
