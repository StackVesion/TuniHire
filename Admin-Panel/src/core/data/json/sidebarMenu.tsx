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
        label: 'Applications List',
        link: routes.jobgrid,
        submenu: false,
        showSubRoute: false,
        icon: 'timeline',
        base: 'Applications List',
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
        label: 'Newsletter',
        link: routes.refferal,
        submenu: false,
        showSubRoute: false,
        icon: 'ux-circle',
        base: 'Newsletter',
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
          {
            label: 'Complaints',
            showSubRoute: false,
            link: routes.reclamations,
            customSubmenuTwo: false,
            base: 'reclamations',
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
            link: routes.manageusers,
            base: 'manage-users',
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
            label: 'User Report',
            link: routes.userreport,
            base: 'user-report',
          },
         
         
        ],
      },
    ],
  },
];