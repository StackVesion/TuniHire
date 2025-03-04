import { all_routes } from "../../../feature-module/router/all_routes";
import { route } from "../../common/selectoption/selectoption";
const routes = all_routes;

export const SidebarDataTest = [
  {
    tittle: 'OverView',
    icon: 'airplay',
    showAsTab: true,
    separateRoute: false,
    submenuItems: [
      {
        label: 'Dashboard',
        link: 'index',
        submenu: true,
        showSubRoute: false,
        icon: 'smart-home',
        base: 'dashboard',
        materialicons: 'start',
        dot: true,
        submenuItems: [
          { label: "Analytics", link: routes.adminDashboard },
          {
            label: 'Subscriptions',
            link: routes.superAdminSubscriptions,
            base: 'subscriptions',
          },

        ],
      },
      {
        label: 'Applications',
        link: 'apps',
        submenu: true,
        showSubRoute: false,
        icon: 'layout-grid-add',
        base: 'application',
        materialicons: 'dashboard',
        submenuItems: [
          {
            label: 'Calendar',
            showSubRoute: false,
            link: routes.calendar,
            customSubmenuTwo: false,
            base: 'calendar',
          },
          {
            label: 'To Do',
            showSubRoute: false,
            link: routes.todo,
            customSubmenuTwo: false,
            base: 'todo',
          },
          {
            label: 'Notes',
            showSubRoute: false,
            link: routes.notes,
            customSubmenuTwo: false,
            base: 'notes',
          },
          {
            label: 'Social Feed',
            showSubRoute: false,
            link: routes.socialFeed,
            customSubmenuTwo: false,
            base: 'social-feed',
          },
        ],
      },
      
    ],
  },
  
  
  {
    tittle: 'CRM',
    icon: 'file',
    showAsTab: false,
    separateRoute: false,
    submenuItems: [
      {
        label: 'Sponsors',
        link: routes.contactGrid,
        submenu: false,
        showSubRoute: false,
        icon: 'user-shield',
        base: 'contact',
        materialicons: 'confirmation_number',
        submenuItems: [],
      },
      {
        label: 'Companies',
        link: routes.companiesGrid,
        submenu: false,
        showSubRoute: false,
        icon: 'building',
        base: 'company',
        materialicons: 'shopping_bag',
        submenuItems: [],
      },
      
      {
        label: 'Analytics',
        link: routes.analytics,
        submenu: false,
        showSubRoute: false,
        icon: 'graph',
        base: 'analytics',
        materialicons: 'report_gmailerrorred',
        submenuItems: [],
      },
      {
        label: 'Blogs',
        submenu: true,
        showSubRoute: false,
        icon: 'brand-blogger',
        base: 'blogs',
        submenuItems: [
          {
            label: 'All Blogs',
            link: routes.blogs,
            base2: 'All Blogs',
          },
          {
            label: 'Comments',
            link: routes.blogComments,
            base: '/blog-comments',
          },
          
        ],
      },
    ],
  },
  
  {
    tittle: 'RECRUITMENT',
    icon: 'file',
    showAsTab: false,
    separateRoute: false,
    submenuItems: [
      {
        label: 'Jobs',
        link: routes.jobgrid,
        submenu: false,
        showSubRoute: false,
        icon: 'timeline',
        base: 'jobs',
        materialicons: 'confirmation_number',
        submenuItems: [],
      },
      {
        label: 'Candidates',
        link: routes.candidatesGrid,
        submenu: false,
        showSubRoute: false,
        icon: 'user-shield',
        base: 'candidates',
        materialicons: 'shopping_bag',
        submenuItems: [],
      },
      {
        label: 'Refferals',
        link: routes.refferal,
        submenu: false,
        showSubRoute: false,
        icon: 'ux-circle',
        base: 'refferals',
        materialicons: 'account_balance_wallet',
        submenuItems: [],
      },

    ],
  },
  
  {
    tittle: 'Administration',
    showAsTab: false,
    separateRoute: false,
    submenuItems: [
      
      {
        label: 'Help & Supports',
        base: 'supports',
        submenu: true,
        showSubRoute: false,
        icon: 'headset',
        submenuItems: [
          {
            label: 'Chat',
            link: routes.chat,
            base: 'chats',
            customSubmenuTwo: false,
          },
          {
            label: 'Email',
            showSubRoute: false,
            link: routes.email,
            customSubmenuTwo: false,
            base: 'email',
          },
        ],
      },
      {
        label: 'User Management',
        base: 'user-management',
        submenu: true,
        showSubRoute: false,
        icon: 'user-star',
        submenuItems: [
          {
            label: 'Users',
            link: routes.users,
            base: 'users',
          },
          {
            label: 'Roles & Permissions',
            link: routes.rolePermission,
            base: 'roles-permissions',
          },
        ],
      },
      {
        label: 'Reports',
        base: 'reports',
        submenu: true,
        showSubRoute: false,
        icon: 'user-star',
        submenuItems: [
          
          {
            label: 'Payment Report',
            link: routes.paymentreport,
            base: 'payment-report',
          },
          
          {
            label: 'User Report',
            link: routes.userreport,
            base: 'user-report',
          },
          {
            label: 'Employee Report',
            link: routes.employeereport,
            base: 'employee-report',
          },
         
        ],
      },
    ],
  },
  
  
  {
    tittle: 'Authentication',
    showAsTab: false,
    separateRoute: false,
    submenuItems: [
      {
        label: 'Login',
        submenu: true,
        showSubRoute: false,
        icon: 'login',
        submenuItems: [
          {
            label: 'Cover',
            link: routes.login,
          },
          
        ],
      },
      {
        label: 'Register',
        submenu: true,
        showSubRoute: false,
        icon: 'forms',
        submenuItems: [
          {
            label: 'Cover',
            link: routes.register,
          },
          
        ],
      },
      {
        label: 'Forgot Password',
        submenu: true,
        showSubRoute: false,
        icon: 'help-triangle',
        submenuItems: [
          {
            label: 'Cover',
            link: routes.forgotPassword,
          },
          {
            label: 'Illustration',
            link: routes.forgotPassword2,
          },
          {
            label: 'Basic',
            link: routes.forgotPassword3,
          },
        ],
      },
      {
        label: 'Reset Password',
        submenu: true,
        showSubRoute: false,
        icon: 'restore',
        submenuItems: [
          {
            label: 'Cover',
            link: routes.resetPassword,
          },
          {
            label: 'Illustration',
            link: routes.resetPassword2,
          },
          {
            label: 'Basic',
            link: routes.resetPassword3,
          },
        ],
      },
      {
        label: 'Email Verification',
        submenu: true,
        showSubRoute: false,
        icon: 'mail-exclamation',
        submenuItems: [
          {
            label: 'Cover',
            link: routes.emailVerification,
          },
          {
            label: 'Illustration',
            link: routes.emailVerification2,
          },
          {
            label: 'Basic',
            link: routes.emailVerification3,
          },
        ],
      },
      {
        label: '2 Step Verification',
        submenu: true,
        showSubRoute: false,
        icon: 'password',
        submenuItems: [
          {
            label: 'Cover',
            link: routes.twoStepVerification,
          },
          {
            label: 'Illustration',
            link: routes.twoStepVerification2,
          },
          {
            label: 'Basic',
            link: routes.twoStepVerification3,
          },
        ],
      },
      {
        label: 'Lock Screen',
        link: routes.lockScreen,
        submenu: false,
        showSubRoute: false,
        icon: 'lock-square',
        submenuItems: [],
      },
      {
        label: '404 Error',
        link: routes.error404,
        submenu: false,
        showSubRoute: false,
        icon: 'error-404',
        submenuItems: [],
      },
      {
        label: '500 Error',
        link: routes.error500,
        submenu: false,
        showSubRoute: false,
        icon: 'server',
        submenuItems: [],
      },
    ],
  },
];