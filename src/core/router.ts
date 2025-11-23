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
      static ById = ':accessGroupId';
      /** :accessGroupId/add-employee */
      static AddEmployee = ':accessGroupId/add-employee';
      /** access-groups/remove-employee */
      static RemoveEmployee = 'access-groups/remove-employee';
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
}
